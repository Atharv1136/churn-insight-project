"""
Explainability API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import numpy as np

from app.database import get_db
from app.models import Prediction
from api.routes.predict import load_models, _explainer, _feature_names

logger = logging.getLogger(__name__)

router = APIRouter()


class WhatIfRequest(BaseModel):
    """What-if analysis request"""
    customer_id: str
    changes: Dict[str, Any]


@router.get("/explain/{customer_id}")
async def explain_prediction(
    customer_id: str,
    db: Session = Depends(get_db)
):
    """
    Get SHAP explanation for a customer prediction
    """
    # Load models if not already loaded
    if not load_models():
        raise HTTPException(status_code=503, detail="Models not available")
    
    try:
        # Get prediction from database
        prediction = db.query(Prediction).filter(
            Prediction.customer_id == customer_id
        ).order_by(Prediction.prediction_date.desc()).first()
        
        if not prediction:
            raise HTTPException(status_code=404, detail=f"No prediction found for customer {customer_id}")
        
        # Return stored explanation
        return {
            "customer_id": customer_id,
            "churn_probability": prediction.churn_probability,
            "risk_level": prediction.risk_level,
            "top_features": prediction.top_features,
            "recommendations": prediction.recommendations,
            "shap_values": prediction.shap_values,
            "prediction_date": prediction.prediction_date.isoformat() if prediction.prediction_date else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error explaining prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain/what-if")
async def what_if_analysis(
    request: WhatIfRequest,
    db: Session = Depends(get_db)
):
    """
    Perform what-if analysis by changing feature values
    """
    # Load models if not already loaded
    if not load_models():
        raise HTTPException(status_code=503, detail="Models not available")
    
    try:
        # Get original prediction
        original_prediction = db.query(Prediction).filter(
            Prediction.customer_id == request.customer_id
        ).order_by(Prediction.prediction_date.desc()).first()
        
        if not original_prediction:
            raise HTTPException(status_code=404, detail=f"No prediction found for customer {request.customer_id}")
        
        # Get original features
        original_features = original_prediction.features
        
        # Apply changes
        modified_features = original_features.copy()
        modified_features.update(request.changes)
        
        # Make new prediction with modified features
        from api.routes.predict import _predictor, _processor, _feature_engineer
        import pandas as pd
        
        # Convert to DataFrame
        df_input = pd.DataFrame([{
            'customerID': request.customer_id,
            'gender': modified_features.get('gender'),
            'SeniorCitizen': modified_features.get('senior_citizen', 0),
            'Partner': modified_features.get('partner'),
            'Dependents': modified_features.get('dependents'),
            'tenure': modified_features.get('tenure'),
            'PhoneService': modified_features.get('phone_service', 'Yes'),
            'MultipleLines': modified_features.get('multiple_lines', 'No'),
            'InternetService': modified_features.get('internet_service'),
            'OnlineSecurity': modified_features.get('online_security', 'No'),
            'OnlineBackup': modified_features.get('online_backup', 'No'),
            'DeviceProtection': modified_features.get('device_protection', 'No'),
            'TechSupport': modified_features.get('tech_support', 'No'),
            'StreamingTV': modified_features.get('streaming_tv', 'No'),
            'StreamingMovies': modified_features.get('streaming_movies', 'No'),
            'Contract': modified_features.get('contract'),
            'PaperlessBilling': modified_features.get('paperless_billing', 'Yes'),
            'PaymentMethod': modified_features.get('payment_method'),
            'MonthlyCharges': modified_features.get('monthly_charges'),
            'TotalCharges': modified_features.get('total_charges')
        }])
        
        # Feature engineering
        df_engineered = _feature_engineer.engineer_features(df_input)
        
        # Process features
        X_processed, _, _ = _processor.process_pipeline(df_engineered, fit=False, target_col='Churn')
        
        # Make prediction
        new_prediction = _predictor.predict_single(X_processed)
        
        # Calculate impact
        probability_change = new_prediction['churn_probability'] - original_prediction.churn_probability
        
        return {
            "customer_id": request.customer_id,
            "original": {
                "churn_probability": original_prediction.churn_probability,
                "risk_level": original_prediction.risk_level
            },
            "modified": {
                "churn_probability": new_prediction['churn_probability'],
                "risk_level": new_prediction['risk_level']
            },
            "changes_applied": request.changes,
            "impact": {
                "probability_change": round(probability_change, 4),
                "risk_level_change": original_prediction.risk_level != new_prediction['risk_level'],
                "improvement": probability_change < 0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in what-if analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/explain/recommendations/{customer_id}")
async def get_recommendations(
    customer_id: str,
    db: Session = Depends(get_db)
):
    """
    Get personalized recommendations for a customer
    """
    try:
        prediction = db.query(Prediction).filter(
            Prediction.customer_id == customer_id
        ).order_by(Prediction.prediction_date.desc()).first()
        
        if not prediction:
            raise HTTPException(status_code=404, detail=f"No prediction found for customer {customer_id}")
        
        return {
            "customer_id": customer_id,
            "risk_level": prediction.risk_level,
            "churn_probability": prediction.churn_probability,
            "recommendations": prediction.recommendations,
            "top_risk_factors": prediction.top_features[:3] if prediction.top_features else []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

"""
Prediction API endpoints
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime
import logging
import io
import uuid

from app.database import get_db
from app.models import Prediction, Customer
from app.config import settings
from src.predictor import Predictor
from src.data_processor import DataProcessor
from src.feature_engineer import FeatureEngineer
from src.explainer import Explainer
import joblib

logger = logging.getLogger(__name__)

router = APIRouter()


# Pydantic models for request/response
class PredictionRequest(BaseModel):
    """Single prediction request"""
    customer_id: Optional[str] = None
    gender: str = Field(..., description="Male or Female")
    senior_citizen: int = Field(0, ge=0, le=1)
    partner: str = Field(..., description="Yes or No")
    dependents: str = Field(..., description="Yes or No")
    tenure: int = Field(..., ge=0, le=72, description="Months with company")
    phone_service: str = "Yes"
    multiple_lines: str = "No"
    internet_service: str = Field(..., description="DSL, Fiber optic, or No")
    online_security: str = "No"
    online_backup: str = "No"
    device_protection: str = "No"
    tech_support: str = "No"
    streaming_tv: str = "No"
    streaming_movies: str = "No"
    contract: str = Field(..., description="Month-to-month, One year, or Two year")
    paperless_billing: str = "Yes"
    payment_method: str = Field(..., description="Payment method")
    monthly_charges: float = Field(..., gt=0, description="Monthly charges")
    total_charges: Optional[float] = None
    save_prediction: bool = Field(True, description="Whether to save prediction data to database")
    
    class Config:
        json_schema_extra = {
            "example": {
                "customer_id": "CUST001",
                "gender": "Female",
                "senior_citizen": 0,
                "partner": "Yes",
                "dependents": "No",
                "tenure": 12,
                "phone_service": "Yes",
                "multiple_lines": "No",
                "internet_service": "Fiber optic",
                "online_security": "No",
                "online_backup": "No",
                "device_protection": "No",
                "tech_support": "No",
                "streaming_tv": "Yes",
                "streaming_movies": "Yes",
                "contract": "Month-to-month",
                "paperless_billing": "Yes",
                "payment_method": "Electronic check",
                "monthly_charges": 85.50,
                "total_charges": 1026.00
            }
        }


class PredictionResponse(BaseModel):
    """Prediction response"""
    customer_id: str
    churn_prediction: bool
    churn_probability: float
    risk_level: str
    top_features: List[Dict[str, Any]]
    recommendations: List[str]
    model_name: str
    prediction_date: str


# Global variables for loaded models
_predictor: Optional[Predictor] = None
_processor: Optional[DataProcessor] = None
_feature_engineer: Optional[FeatureEngineer] = None
_explainer: Optional[Explainer] = None
_feature_names: List[str] = []


def load_models():
    """Load models and processors"""
    global _predictor, _processor, _feature_engineer, _explainer, _feature_names
    
    if _predictor is None:
        try:
            # Load XGBoost model (best performing)
            model_path = settings.SAVED_MODELS_DIR / "xgboost.pkl"
            scaler_path = settings.SCALERS_DIR / "scaler.pkl"
            
            if not model_path.exists():
                logger.warning("Model not found, will need to train first")
                return False
            
            _predictor = Predictor(model_path, scaler_path, "XGBoost")
            _processor = DataProcessor()
            _feature_engineer = FeatureEngineer()
            
            # Load scaler to get feature names
            if scaler_path.exists():
                _processor.scaler = joblib.load(scaler_path)
            
            # Load feature names from metadata
            metadata_path = settings.MODELS_DIR / "model_metadata.json"
            if metadata_path.exists():
                import json
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                    _feature_names = metadata.get('feature_names', [])
            
            # Initialize explainer
            if _predictor.model and len(_feature_names) > 0:
                # Use a small background dataset for explainer
                background_data = np.random.randn(100, len(_feature_names))
                _explainer = Explainer(_predictor.model, background_data)
            
            logger.info("Models loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            return False
    
    return True


@router.post("/predict", response_model=PredictionResponse)
async def predict_churn(
    request: PredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Predict churn for a single customer
    """
    # Load models if not already loaded
    if not load_models():
        raise HTTPException(status_code=503, detail="Models not available. Please train models first.")
    
    try:
        # Prepare input data
        input_data = request.dict()
        
        # Ensure customer_id is always set
        customer_id = input_data.get('customer_id')
        if not customer_id or customer_id == '' or customer_id is None:
            customer_id = f"CUST_{datetime.now().strftime('%Y%m%d%H%M%S')}_{str(uuid.uuid4())[:8]}"
        
        logger.info(f"Processing prediction for customer_id: {customer_id}")
        
        # Calculate total charges if not provided
        if input_data.get('total_charges') is None:
            input_data['total_charges'] = input_data['monthly_charges'] * input_data['tenure']
        
        # Convert to DataFrame format expected by processor
        df_input = pd.DataFrame([{
            'customerID': customer_id,
            'gender': input_data['gender'],
            'SeniorCitizen': input_data['senior_citizen'],
            'Partner': input_data['partner'],
            'Dependents': input_data['dependents'],
            'tenure': input_data['tenure'],
            'PhoneService': input_data['phone_service'],
            'MultipleLines': input_data['multiple_lines'],
            'InternetService': input_data['internet_service'],
            'OnlineSecurity': input_data['online_security'],
            'OnlineBackup': input_data['online_backup'],
            'DeviceProtection': input_data['device_protection'],
            'TechSupport': input_data['tech_support'],
            'StreamingTV': input_data['streaming_tv'],
            'StreamingMovies': input_data['streaming_movies'],
            'Contract': input_data['contract'],
            'PaperlessBilling': input_data['paperless_billing'],
            'PaymentMethod': input_data['payment_method'],
            'MonthlyCharges': input_data['monthly_charges'],
            'TotalCharges': input_data['total_charges']
        }])
        
        # Feature engineering
        df_engineered = _feature_engineer.engineer_features(df_input)
        
        # Process features with expected feature names from metadata
        X_processed, _, feature_names = _processor.process_pipeline(
            df_engineered, 
            fit=False, 
            target_col='Churn',
            expected_features=_feature_names if _feature_names else None
        )
        
        # Make prediction
        prediction_result = _predictor.predict_single(X_processed)
        
        # Get SHAP explanation
        top_features = []
        recommendations = []
        
        if _explainer:
            try:
                explanation = _explainer.explain_with_recommendations(
                    X_processed,
                    feature_names,
                    prediction_result['churn_probability']
                )
                top_features = explanation.get('top_features', [])
                recommendations = explanation.get('recommendations', [])
            except Exception as e:
                logger.warning(f"Error generating explanation: {e}")
                recommendations = ["Unable to generate recommendations at this time"]
        
        # Save customer data to database for future training
        if request.save_prediction:
            try:
                existing_customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
                if not existing_customer:
                    db_customer = Customer(
                        customer_id=customer_id,
                        gender=input_data['gender'],
                        senior_citizen=bool(input_data['senior_citizen']),
                        partner=input_data['partner'] == 'Yes',
                        dependents=input_data['dependents'] == 'Yes',
                        tenure=input_data['tenure'],
                        contract_type=input_data['contract'],
                        payment_method=input_data['payment_method'],
                        paperless_billing=input_data['paperless_billing'] == 'Yes',
                        phone_service=input_data['phone_service'] == 'Yes',
                        multiple_lines=input_data['multiple_lines'] == 'Yes',
                        internet_service=input_data['internet_service'],
                        online_security=input_data['online_security'] == 'Yes',
                        online_backup=input_data['online_backup'] == 'Yes',
                        device_protection=input_data['device_protection'] == 'Yes',
                        tech_support=input_data['tech_support'] == 'Yes',
                        streaming_tv=input_data['streaming_tv'] == 'Yes',
                        streaming_movies=input_data['streaming_movies'] == 'Yes',
                        monthly_charges=input_data['monthly_charges'],
                        total_charges=input_data['total_charges'],
                        churn_status=prediction_result['churn_prediction']
                    )
                    db.add(db_customer)
                    logger.info(f"Saved new customer data for {customer_id}")
            except Exception as e:
                logger.warning(f"Could not save customer data: {e}")
            
            # Save prediction to database
            db_prediction = Prediction(
                customer_id=customer_id,
                churn_probability=prediction_result['churn_probability'],
                churn_prediction=prediction_result['churn_prediction'],
                risk_level=prediction_result['risk_level'],
                model_name=prediction_result['model_name'],
                model_version=settings.MODEL_VERSION,
                features=input_data,
                top_features=top_features,
                recommendations=recommendations
            )
            
            db.add(db_prediction)
            db.commit()
            db.refresh(db_prediction)
        
        # Return response
        return PredictionResponse(
            customer_id=customer_id,
            churn_prediction=prediction_result['churn_prediction'],
            churn_probability=round(prediction_result['churn_probability'], 4),
            risk_level=prediction_result['risk_level'],
            top_features=top_features,
            recommendations=recommendations,
            model_name=prediction_result['model_name'],
            prediction_date=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/predict-batch")
async def predict_batch(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Predict churn for multiple customers from CSV file
    """
    # Load models if not already loaded
    if not load_models():
        raise HTTPException(status_code=503, detail="Models not available. Please train models first.")
    
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        logger.info(f"Received batch prediction request with {len(df)} records")
        
        # Feature engineering
        df_engineered = _feature_engineer.engineer_features(df)
        
        # Process features
        X_processed, _, feature_names = _processor.process_pipeline(df_engineered, fit=False, target_col='Churn')
        
        # Make batch predictions
        predictions = _predictor.predict_batch(X_processed)
        
        # Add predictions to dataframe
        df['churn_prediction'] = [p['churn_prediction'] for p in predictions]
        df['churn_probability'] = [round(p['churn_probability'], 4) for p in predictions]
        df['risk_level'] = [p['risk_level'] for p in predictions]
        
        # Convert to CSV
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        # Save predictions to database
        for i, pred in enumerate(predictions):
            customer_id = df.iloc[i].get('customerID', f"BATCH_{i}")
            
            db_prediction = Prediction(
                customer_id=customer_id,
                churn_probability=pred['churn_probability'],
                churn_prediction=pred['churn_prediction'],
                risk_level=pred['risk_level'],
                model_name=pred['model_name'],
                model_version=settings.MODEL_VERSION
            )
            db.add(db_prediction)
        
        db.commit()
        
        from fastapi.responses import StreamingResponse
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=predictions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
        )
        
    except Exception as e:
        logger.error(f"Batch prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


@router.get("/predictions/recent")
async def get_recent_predictions(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get recent predictions
    """
    try:
        predictions = db.query(Prediction).order_by(
            Prediction.prediction_date.desc()
        ).limit(limit).all()
        
        return {
            "predictions": [pred.to_dict() for pred in predictions],
            "count": len(predictions)
        }
        
    except Exception as e:
        logger.error(f"Error fetching predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk_predict")
async def bulk_predict(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Bulk prediction from CSV file
    """
    global _predictor, _processor, _feature_engineer, _explainer, _feature_names
    
    if not _predictor:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        logger.info(f"Processing bulk prediction for {len(df)} customers")
        
        results = []
        
        for idx, row in df.iterrows():
            try:
                # Convert row to input format
                input_data = {
                    'gender': str(row.get('gender', 'Male')),
                    'senior_citizen': int(row.get('SeniorCitizen', 0)),
                    'partner': str(row.get('Partner', 'No')),
                    'dependents': str(row.get('Dependents', 'No')),
                    'tenure': int(row.get('tenure', 0)),
                    'phone_service': str(row.get('PhoneService', 'No')),
                    'multiple_lines': str(row.get('MultipleLines', 'No')),
                    'internet_service': str(row.get('InternetService', 'No')),
                    'online_security': str(row.get('OnlineSecurity', 'No')),
                    'online_backup': str(row.get('OnlineBackup', 'No')),
                    'device_protection': str(row.get('DeviceProtection', 'No')),
                    'tech_support': str(row.get('TechSupport', 'No')),
                    'streaming_tv': str(row.get('StreamingTV', 'No')),
                    'streaming_movies': str(row.get('StreamingMovies', 'No')),
                    'contract': str(row.get('Contract', 'Month-to-month')),
                    'paperless_billing': str(row.get('PaperlessBilling', 'No')),
                    'payment_method': str(row.get('PaymentMethod', 'Electronic check')),
                    'monthly_charges': float(row.get('MonthlyCharges', 0)),
                    'total_charges': float(row.get('TotalCharges', 0))
                }
                
                # Create DataFrame for processing
                df_single = pd.DataFrame([input_data])
                
                # Engineer features
                df_engineered = _feature_engineer.engineer_features(df_single)
                
                # Process features with expected feature names from metadata
                X_processed, _, feature_names = _processor.process_pipeline(
                    df_engineered, 
                    fit=False, 
                    target_col='Churn',
                    expected_features=_feature_names if _feature_names else None
                )
                
                # Make prediction
                prediction_result = _predictor.predict_single(X_processed)
                
                # Get SHAP explanation
                top_features = []
                if _explainer:
                    try:
                        explanation = _explainer.explain_with_recommendations(
                            X_processed,
                            feature_names,
                            prediction_result['churn_probability']
                        )
                        top_features = explanation.get('top_features', [])
                    except Exception as e:
                        logger.warning(f"Could not generate SHAP explanation for row {idx}: {e}")
                
                # Generate customer ID
                customer_id = f"BULK_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"
                
                results.append({
                    'row_number': idx + 1,
                    'customer_id': customer_id,
                    'churn_probability': round(prediction_result['churn_probability'], 4),
                    'churn_prediction': prediction_result['churn_prediction'],
                    'risk_level': prediction_result['risk_level']
                })
                
            except Exception as e:
                logger.error(f"Error processing row {idx}: {e}")
                results.append({
                    'row_number': idx + 1,
                    'customer_id': f"ERROR_ROW_{idx + 1}",
                    'error': str(e),
                    'churn_probability': None,
                    'churn_prediction': None,
                    'risk_level': None
                })
        
        logger.info(f"Bulk prediction completed. Processed {len(results)} rows")
        
        return {
            "total_rows": len(df),
            "successful_predictions": len([r for r in results if 'error' not in r]),
            "failed_predictions": len([r for r in results if 'error' in r]),
            "results": results
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except pd.errors.ParserError:
        raise HTTPException(status_code=400, detail="Invalid CSV format")
    except Exception as e:
        logger.error(f"Bulk prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Bulk prediction failed: {str(e)}")

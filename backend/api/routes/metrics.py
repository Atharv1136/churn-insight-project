"""
Metrics and performance API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any
import logging
from datetime import datetime, timedelta

from app.database import get_db
from app.models import ModelMetric, Prediction, Customer

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/metrics")
async def get_model_metrics(
    db: Session = Depends(get_db)
):
    """
    Get latest model performance metrics
    """
    try:
        # Get latest metrics for each model
        latest_metrics = db.query(ModelMetric).order_by(
            ModelMetric.model_name,
            desc(ModelMetric.trained_at)
        ).all()
        
        # Group by model name and take latest
        metrics_by_model = {}
        for metric in latest_metrics:
            if metric.model_name not in metrics_by_model:
                metrics_by_model[metric.model_name] = metric.to_dict()
        
        return {
            "metrics": metrics_by_model,
            "count": len(metrics_by_model)
        }
        
    except Exception as e:
        logger.error(f"Error fetching metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/comparison")
async def get_model_comparison(
    db: Session = Depends(get_db)
):
    """
    Get model comparison table
    """
    try:
        # Get latest metrics for each model
        latest_metrics = {}
        
        for model_name in ["Logistic Regression", "Random Forest", "XGBoost"]:
            metric = db.query(ModelMetric).filter(
                ModelMetric.model_name == model_name
            ).order_by(desc(ModelMetric.trained_at)).first()
            
            if metric:
                latest_metrics[model_name] = {
                    "accuracy": round(metric.accuracy, 4),
                    "precision": round(metric.precision, 4),
                    "recall": round(metric.recall, 4),
                    "f1_score": round(metric.f1_score, 4),
                    "roc_auc": round(metric.roc_auc, 4),
                    "trained_at": metric.trained_at.isoformat() if metric.trained_at else None
                }
        
        return {
            "comparison": latest_metrics,
            "best_model": max(latest_metrics.items(), key=lambda x: x[1]['roc_auc'])[0] if latest_metrics else None
        }
        
    except Exception as e:
        logger.error(f"Error fetching comparison: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/dashboard")
async def get_dashboard_metrics(
    db: Session = Depends(get_db)
):
    """
    Get dashboard KPI metrics
    """
    try:
        # Total predictions
        total_predictions = db.query(func.count(Prediction.id)).scalar() or 0
        
        # Predictions in last 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_predictions = db.query(func.count(Prediction.id)).filter(
            Prediction.prediction_date >= week_ago
        ).scalar() or 0
        
        # Average churn probability
        avg_churn_prob = db.query(func.avg(Prediction.churn_probability)).scalar() or 0
        
        # Risk level distribution
        high_risk = db.query(func.count(Prediction.id)).filter(
            Prediction.risk_level == "HIGH"
        ).scalar() or 0
        
        medium_risk = db.query(func.count(Prediction.id)).filter(
            Prediction.risk_level == "MEDIUM"
        ).scalar() or 0
        
        low_risk = db.query(func.count(Prediction.id)).filter(
            Prediction.risk_level == "LOW"
        ).scalar() or 0
        
        # Churn trend (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        daily_predictions = db.query(
            func.date(Prediction.prediction_date).label('date'),
            func.avg(Prediction.churn_probability).label('avg_prob'),
            func.count(Prediction.id).label('count')
        ).filter(
            Prediction.prediction_date >= thirty_days_ago
        ).group_by(
            func.date(Prediction.prediction_date)
        ).all()
        
        churn_trend = [
            {
                "date": str(row.date),
                "avg_probability": round(float(row.avg_prob), 4),
                "count": row.count
            }
            for row in daily_predictions
        ]
        
        return {
            "kpis": {
                "total_predictions": total_predictions,
                "recent_predictions": recent_predictions,
                "avg_churn_probability": round(float(avg_churn_prob), 4),
                "high_risk_count": high_risk,
                "medium_risk_count": medium_risk,
                "low_risk_count": low_risk
            },
            "churn_trend": churn_trend,
            "risk_distribution": {
                "HIGH": high_risk,
                "MEDIUM": medium_risk,
                "LOW": low_risk
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/feature-importance/{model_name}")
async def get_feature_importance(
    model_name: str,
    db: Session = Depends(get_db)
):
    """
    Get feature importance for a specific model
    """
    try:
        metric = db.query(ModelMetric).filter(
            ModelMetric.model_name == model_name
        ).order_by(desc(ModelMetric.trained_at)).first()
        
        if not metric:
            raise HTTPException(status_code=404, detail=f"Metrics for {model_name} not found")
        
        return {
            "model_name": model_name,
            "feature_importance": metric.feature_importance,
            "trained_at": metric.trained_at.isoformat() if metric.trained_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching feature importance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/confusion-matrix/{model_name}")
async def get_confusion_matrix(
    model_name: str,
    db: Session = Depends(get_db)
):
    """
    Get confusion matrix for a specific model
    """
    try:
        metric = db.query(ModelMetric).filter(
            ModelMetric.model_name == model_name
        ).order_by(desc(ModelMetric.trained_at)).first()
        
        if not metric:
            raise HTTPException(status_code=404, detail=f"Metrics for {model_name} not found")
        
        return {
            "model_name": model_name,
            "confusion_matrix": metric.confusion_matrix,
            "true_positives": metric.true_positives,
            "true_negatives": metric.true_negatives,
            "false_positives": metric.false_positives,
            "false_negatives": metric.false_negatives,
            "trained_at": metric.trained_at.isoformat() if metric.trained_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching confusion matrix: {e}")
        raise HTTPException(status_code=500, detail=str(e))

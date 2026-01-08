"""
Model training API endpoints
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
from datetime import datetime
import logging
import joblib

from app.database import get_db
from app.models import TrainingJob, ModelMetric
from app.config import settings
from src.data_loader import DataLoader
from src.data_processor import DataProcessor
from src.feature_engineer import FeatureEngineer
from src.model_trainer import ModelTrainer
from src.model_evaluator import ModelEvaluator

logger = logging.getLogger(__name__)

router = APIRouter()


class TrainRequest(BaseModel):
    """Training request"""
    tune_hyperparameters: bool = False
    balance_classes: bool = True
    test_size: float = 0.2


class TrainResponse(BaseModel):
    """Training response"""
    job_id: str
    status: str
    message: str


def train_models_task(job_id: str, tune_hyperparameters: bool, balance_classes: bool, test_size: float):
    """
    Background task for model training
    """
    from app.database import SessionLocal
    db = SessionLocal()
    
    try:
        # Update job status
        job = db.query(TrainingJob).filter(TrainingJob.job_id == job_id).first()
        if not job:
            logger.error(f"Job {job_id} not found")
            return
        
        job.status = "running"
        job.started_at = datetime.utcnow()
        job.current_model = "Loading data"
        job.progress = 0.1
        db.commit()
        
        # Load data
        logger.info("Loading dataset...")
        data_loader = DataLoader()
        df = data_loader.load_telco_churn()
        
        job.progress = 0.2
        job.current_model = "Engineering features"
        db.commit()
        
        # Feature engineering
        logger.info("Engineering features...")
        feature_engineer = FeatureEngineer()
        df_engineered = feature_engineer.engineer_features(df)
        
        job.progress = 0.3
        job.current_model = "Processing data"
        db.commit()
        
        # Process data
        logger.info("Processing data...")
        processor = DataProcessor()
        X, y, feature_names = processor.process_pipeline(df_engineered, fit=True)
        
        job.progress = 0.4
        job.current_model = "Splitting data"
        db.commit()
        
        # Train models
        logger.info("Training models...")
        trainer = ModelTrainer(random_state=settings.RANDOM_STATE)
        X_train, X_test, y_train, y_test = trainer.prepare_train_test_split(
            X, y, test_size=test_size, balance=balance_classes
        )
        
        job.progress = 0.5
        job.current_model = "Training models"
        db.commit()
        
        models = trainer.train_all_models(X_train, y_train, tune_hyperparameters)
        
        job.progress = 0.7
        job.current_model = "Evaluating models"
        db.commit()
        
        # Evaluate models
        logger.info("Evaluating models...")
        evaluator = ModelEvaluator()
        metrics = evaluator.evaluate_all_models(models, X_test, y_test)
        
        job.progress = 0.8
        job.current_model = "Saving models"
        db.commit()
        
        # Save models and scaler
        logger.info("Saving models...")
        trainer.save_models(settings.SAVED_MODELS_DIR, processor.scaler)
        
        # Save feature names to metadata
        import json
        metadata = {
            'feature_names': feature_names,
            'model_version': settings.MODEL_VERSION,
            'trained_at': datetime.utcnow().isoformat(),
            'n_features': len(feature_names),
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        }
        
        metadata_path = settings.MODELS_DIR / "model_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        job.progress = 0.9
        job.current_model = "Saving metrics"
        db.commit()
        
        # Save metrics to database
        for model_name, model_metrics in metrics.items():
            db_metric = ModelMetric(
                model_name=model_name,
                model_version=settings.MODEL_VERSION,
                accuracy=model_metrics['accuracy'],
                precision=model_metrics['precision'],
                recall=model_metrics['recall'],
                f1_score=model_metrics['f1_score'],
                roc_auc=model_metrics['roc_auc'],
                true_positives=model_metrics['true_positives'],
                true_negatives=model_metrics['true_negatives'],
                false_positives=model_metrics['false_positives'],
                false_negatives=model_metrics['false_negatives'],
                confusion_matrix=evaluator.get_confusion_matrix(model_name).tolist(),
                classification_report=evaluator.get_classification_report(model_name),
                feature_importance=evaluator.get_feature_importance(models[model_name], feature_names, top_n=20),
                training_samples=len(X_train),
                test_samples=len(X_test),
                training_time_seconds=trainer.training_times.get(model_name, 0)
            )
            db.add(db_metric)
        
        db.commit()
        
        # Update job as completed
        job.status = "completed"
        job.progress = 1.0
        job.completed_at = datetime.utcnow()
        job.results = {
            'metrics': {k: {key: float(val) if isinstance(val, (int, float)) else val 
                           for key, val in v.items()} for k, v in metrics.items()},
            'best_model': evaluator.get_best_model()[0],
            'feature_count': len(feature_names)
        }
        db.commit()
        
        logger.info(f"Training job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Training job {job_id} failed: {e}", exc_info=True)
        
        job = db.query(TrainingJob).filter(TrainingJob.job_id == job_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            db.commit()
    
    finally:
        db.close()


@router.post("/train", response_model=TrainResponse)
async def train_models(
    request: TrainRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Trigger model training
    """
    try:
        # Create training job
        job_id = str(uuid.uuid4())
        
        job = TrainingJob(
            job_id=job_id,
            status="pending",
            models_to_train=["Logistic Regression", "Random Forest", "XGBoost"]
        )
        
        db.add(job)
        db.commit()
        
        # Add background task
        background_tasks.add_task(
            train_models_task,
            job_id,
            request.tune_hyperparameters,
            request.balance_classes,
            request.test_size
        )
        
        logger.info(f"Training job {job_id} created")
        
        return TrainResponse(
            job_id=job_id,
            status="pending",
            message="Training job started. Use /train/status/{job_id} to check progress."
        )
        
    except Exception as e:
        logger.error(f"Error creating training job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/train/status/{job_id}")
async def get_training_status(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Get training job status
    """
    try:
        job = db.query(TrainingJob).filter(TrainingJob.job_id == job_id).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Training job not found")
        
        return job.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching training status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/train/jobs")
async def get_training_jobs(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get recent training jobs
    """
    try:
        jobs = db.query(TrainingJob).order_by(
            TrainingJob.created_at.desc()
        ).limit(limit).all()
        
        return {
            "jobs": [job.to_dict() for job in jobs],
            "count": len(jobs)
        }
        
    except Exception as e:
        logger.error(f"Error fetching training jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

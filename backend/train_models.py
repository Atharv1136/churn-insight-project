"""
Quick start script to train models
"""
import sys
import logging
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from src.data_loader import DataLoader
from src.data_processor import DataProcessor
from src.feature_engineer import FeatureEngineer
from src.model_trainer import ModelTrainer
from src.model_evaluator import ModelEvaluator
from app.config import settings
from app.database import init_db
from app.models import ModelMetric
from sqlalchemy.orm import Session
from app.database import SessionLocal
from datetime import datetime
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def main():
    """Train all models"""
    logger.info("=" * 60)
    logger.info("Customer Churn Prediction - Model Training")
    logger.info("=" * 60)
    
    # Initialize database
    logger.info("Initializing database...")
    init_db()
    
    # Load data
    logger.info("Loading dataset...")
    data_loader = DataLoader()
    df = data_loader.load_telco_churn()
    logger.info(f"Loaded {len(df)} records")
    
    # Clean data FIRST
    logger.info("Cleaning data...")
    processor = DataProcessor()
    df_clean = processor.clean_data(df)
    logger.info("Data cleaned")
    
    # Feature engineering (after cleaning)
    logger.info("Engineering features...")
    feature_engineer = FeatureEngineer()
    df_engineered = feature_engineer.engineer_features(df_clean)
    logger.info(f"Features engineered: {df_engineered.shape[1]} columns")
    
    # Process data (encode and scale)
    logger.info("Encoding and scaling features...")
    df_encoded = processor.encode_categorical(df_engineered, fit=True)
    X, y = processor.prepare_features(df_encoded, target_col='Churn')
    X_scaled = processor.scale_features(X, fit=True)
    feature_names = processor.feature_names
    logger.info(f"Processed data: {X_scaled.shape[0]} samples, {X_scaled.shape[1]} features")
    
    # Train models
    logger.info("Training models...")
    trainer = ModelTrainer(random_state=settings.RANDOM_STATE)
    X_train, X_test, y_train, y_test = trainer.prepare_train_test_split(
        X_scaled, y, test_size=settings.TEST_SIZE, balance=True
    )
    
    models = trainer.train_all_models(X_train, y_train, tune_hyperparameters=True)
    logger.info(f"Trained {len(models)} models with hyperparameter tuning")
    
    # Evaluate models
    logger.info("Evaluating models...")
    evaluator = ModelEvaluator()
    metrics = evaluator.evaluate_all_models(models, X_test, y_test)
    
    # Print results
    logger.info("\n" + "=" * 60)
    logger.info("Model Performance Comparison")
    logger.info("=" * 60)
    
    for model_name, model_metrics in metrics.items():
        logger.info(f"\n{model_name}:")
        logger.info(f"  Accuracy:  {model_metrics['accuracy']:.4f}")
        logger.info(f"  Precision: {model_metrics['precision']:.4f}")
        logger.info(f"  Recall:    {model_metrics['recall']:.4f}")
        logger.info(f"  F1 Score:  {model_metrics['f1_score']:.4f}")
        logger.info(f"  ROC-AUC:   {model_metrics['roc_auc']:.4f}")
    
    best_model, best_score = evaluator.get_best_model()
    logger.info(f"\n[BEST] Best Model: {best_model} (ROC-AUC: {best_score:.4f})")
    
    # Save models
    logger.info("\nSaving models...")
    trainer.save_models(settings.SAVED_MODELS_DIR, processor.scaler)
    
    # Save metadata
    logger.info("Saving metadata...")
    metadata = {
        'feature_names': feature_names,
        'model_version': settings.MODEL_VERSION,
        'trained_at': datetime.utcnow().isoformat(),
        'n_features': len(feature_names),
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'best_model': best_model
    }
    
    metadata_path = settings.MODELS_DIR / "model_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    # Save metrics to database
    logger.info("Saving metrics to database...")
    db = SessionLocal()
    
    try:
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
        logger.info("Metrics saved to database")
    finally:
        db.close()
    
    logger.info("\n" + "=" * 60)
    logger.info("[SUCCESS] Training completed successfully!")
    logger.info("=" * 60)
    logger.info(f"Models saved to: {settings.SAVED_MODELS_DIR}")
    logger.info(f"Scaler saved to: {settings.SCALERS_DIR}")
    logger.info(f"Metadata saved to: {metadata_path}")
    logger.info("\nYou can now start the API server with:")
    logger.info("  uvicorn app.main:app --reload")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()

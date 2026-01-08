"""
ML model tests
"""
import pytest
import numpy as np
import pandas as pd
from src.data_loader import DataLoader
from src.data_processor import DataProcessor
from src.feature_engineer import FeatureEngineer
from src.model_trainer import ModelTrainer
from src.model_evaluator import ModelEvaluator
from src.predictor import Predictor


def test_data_loader():
    """Test data loading"""
    loader = DataLoader()
    df = loader._generate_sample_data(n_samples=100)
    
    assert len(df) == 100
    assert 'customerID' in df.columns
    assert 'Churn' in df.columns
    assert loader.validate_data(df)


def test_data_processor():
    """Test data processing"""
    loader = DataLoader()
    df = loader._generate_sample_data(n_samples=100)
    
    processor = DataProcessor()
    df_clean = processor.clean_data(df)
    
    assert len(df_clean) == len(df)
    assert df_clean['TotalCharges'].notna().all()


def test_feature_engineer():
    """Test feature engineering"""
    loader = DataLoader()
    df = loader._generate_sample_data(n_samples=100)
    
    engineer = FeatureEngineer()
    df_engineered = engineer.engineer_features(df)
    
    # Check that new features were created
    assert 'total_services' in df_engineered.columns or len(df_engineered.columns) > len(df.columns)


def test_model_trainer():
    """Test model training"""
    # Generate sample data
    loader = DataLoader()
    df = loader._generate_sample_data(n_samples=200)
    
    # Process data
    engineer = FeatureEngineer()
    df_engineered = engineer.engineer_features(df)
    
    processor = DataProcessor()
    X, y, feature_names = processor.process_pipeline(df_engineered, fit=True)
    
    # Train models
    trainer = ModelTrainer(random_state=42)
    X_train, X_test, y_train, y_test = trainer.prepare_train_test_split(
        X, y, test_size=0.2, balance=False
    )
    
    # Train just one model for speed
    model = trainer.train_logistic_regression(X_train, y_train, tune_hyperparameters=False)
    
    assert model is not None
    assert hasattr(model, 'predict')
    assert hasattr(model, 'predict_proba')


def test_model_evaluator():
    """Test model evaluation"""
    # Generate sample data
    loader = DataLoader()
    df = loader._generate_sample_data(n_samples=200)
    
    # Process data
    engineer = FeatureEngineer()
    df_engineered = engineer.engineer_features(df)
    
    processor = DataProcessor()
    X, y, feature_names = processor.process_pipeline(df_engineered, fit=True)
    
    # Train model
    trainer = ModelTrainer(random_state=42)
    X_train, X_test, y_train, y_test = trainer.prepare_train_test_split(
        X, y, test_size=0.2, balance=False
    )
    
    model = trainer.train_logistic_regression(X_train, y_train, tune_hyperparameters=False)
    
    # Evaluate
    evaluator = ModelEvaluator()
    metrics = evaluator.evaluate_model(model, X_test, y_test, "Logistic Regression")
    
    assert 'accuracy' in metrics
    assert 'precision' in metrics
    assert 'recall' in metrics
    assert 'f1_score' in metrics
    assert 'roc_auc' in metrics
    assert 0 <= metrics['accuracy'] <= 1


def test_predictor():
    """Test predictor"""
    # Generate and process sample data
    loader = DataLoader()
    df = loader._generate_sample_data(n_samples=200)
    
    engineer = FeatureEngineer()
    df_engineered = engineer.engineer_features(df)
    
    processor = DataProcessor()
    X, y, feature_names = processor.process_pipeline(df_engineered, fit=True)
    
    # Train model
    trainer = ModelTrainer(random_state=42)
    X_train, X_test, y_train, y_test = trainer.prepare_train_test_split(
        X, y, test_size=0.2, balance=False
    )
    
    model = trainer.train_xgboost(X_train, y_train, tune_hyperparameters=False)
    
    # Create predictor
    predictor = Predictor()
    predictor.model = model
    predictor.scaler = processor.scaler
    
    # Make prediction
    result = predictor.predict_single(X_test[:1])
    
    assert 'churn_prediction' in result
    assert 'churn_probability' in result
    assert 'risk_level' in result
    assert result['risk_level'] in ['LOW', 'MEDIUM', 'HIGH']
    assert 0 <= result['churn_probability'] <= 1


def test_batch_prediction():
    """Test batch predictions"""
    # Generate and process sample data
    loader = DataLoader()
    df = loader._generate_sample_data(n_samples=200)
    
    engineer = FeatureEngineer()
    df_engineered = engineer.engineer_features(df)
    
    processor = DataProcessor()
    X, y, feature_names = processor.process_pipeline(df_engineered, fit=True)
    
    # Train model
    trainer = ModelTrainer(random_state=42)
    X_train, X_test, y_train, y_test = trainer.prepare_train_test_split(
        X, y, test_size=0.2, balance=False
    )
    
    model = trainer.train_xgboost(X_train, y_train, tune_hyperparameters=False)
    
    # Create predictor
    predictor = Predictor()
    predictor.model = model
    predictor.scaler = processor.scaler
    
    # Make batch predictions
    results = predictor.predict_batch(X_test[:5])
    
    assert len(results) == 5
    assert all('churn_probability' in r for r in results)
    assert all('risk_level' in r for r in results)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

"""
Model training pipeline
"""
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import joblib
from pathlib import Path
from typing import Dict, Tuple, Any
import logging
import time

logger = logging.getLogger(__name__)


class ModelTrainer:
    """Train multiple churn prediction models"""
    
    def __init__(self, random_state: int = 42):
        """
        Initialize ModelTrainer
        
        Args:
            random_state: Random seed for reproducibility
        """
        self.random_state = random_state
        self.models: Dict[str, Any] = {}
        self.best_models: Dict[str, Any] = {}
        self.training_times: Dict[str, float] = {}
    
    def prepare_train_test_split(
        self,
        X: np.ndarray,
        y: np.ndarray,
        test_size: float = 0.2,
        balance: bool = True
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Split data and optionally balance classes
        
        Args:
            X: Features
            y: Target
            test_size: Test set proportion
            balance: Whether to use SMOTE for balancing
            
        Returns:
            Tuple of (X_train, X_test, y_train, y_test)
        """
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=self.random_state, stratify=y
        )
        
        logger.info(f"Train set: {X_train.shape}, Test set: {X_test.shape}")
        logger.info(f"Class distribution - Train: {np.bincount(y_train.astype(int))}, Test: {np.bincount(y_test.astype(int))}")
        
        # Balance classes using SMOTE
        if balance:
            smote = SMOTE(random_state=self.random_state)
            X_train, y_train = smote.fit_resample(X_train, y_train)
            logger.info(f"After SMOTE - Train: {X_train.shape}, Class distribution: {np.bincount(y_train.astype(int))}")
        
        return X_train, X_test, y_train, y_test
    
    def train_logistic_regression(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        tune_hyperparameters: bool = False
    ) -> LogisticRegression:
        """
        Train Logistic Regression model
        
        Args:
            X_train: Training features
            y_train: Training target
            tune_hyperparameters: Whether to perform hyperparameter tuning
            
        Returns:
            Trained model
        """
        logger.info("Training Logistic Regression...")
        start_time = time.time()
        
        if tune_hyperparameters:
            param_grid = {
                'C': [0.01, 0.1, 1, 10, 100],
                'penalty': ['l1', 'l2'],
                'solver': ['liblinear', 'saga']
            }
            
            model = GridSearchCV(
                LogisticRegression(random_state=self.random_state, max_iter=1000),
                param_grid,
                cv=5,
                scoring='roc_auc',
                n_jobs=-1
            )
            model.fit(X_train, y_train)
            logger.info(f"Best parameters: {model.best_params_}")
            best_model = model.best_estimator_
        else:
            model = LogisticRegression(
                random_state=self.random_state,
                max_iter=1000,
                C=1.0,
                penalty='l2'
            )
            model.fit(X_train, y_train)
            best_model = model
        
        training_time = time.time() - start_time
        self.training_times['Logistic Regression'] = training_time
        
        logger.info(f"Logistic Regression trained in {training_time:.2f}s")
        return best_model
    
    def train_random_forest(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        tune_hyperparameters: bool = False
    ) -> RandomForestClassifier:
        """
        Train Random Forest model
        
        Args:
            X_train: Training features
            y_train: Training target
            tune_hyperparameters: Whether to perform hyperparameter tuning
            
        Returns:
            Trained model
        """
        logger.info("Training Random Forest...")
        start_time = time.time()
        
        if tune_hyperparameters:
            param_grid = {
                'n_estimators': [100, 200, 300],
                'max_depth': [10, 20, 30, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            }
            
            model = GridSearchCV(
                RandomForestClassifier(random_state=self.random_state),
                param_grid,
                cv=3,
                scoring='roc_auc',
                n_jobs=-1
            )
            model.fit(X_train, y_train)
            logger.info(f"Best parameters: {model.best_params_}")
            best_model = model.best_estimator_
        else:
            model = RandomForestClassifier(
                n_estimators=200,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=self.random_state,
                n_jobs=-1
            )
            model.fit(X_train, y_train)
            best_model = model
        
        training_time = time.time() - start_time
        self.training_times['Random Forest'] = training_time
        
        logger.info(f"Random Forest trained in {training_time:.2f}s")
        return best_model
    
    def train_xgboost(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        tune_hyperparameters: bool = False
    ) -> XGBClassifier:
        """
        Train XGBoost model
        
        Args:
            X_train: Training features
            y_train: Training target
            tune_hyperparameters: Whether to perform hyperparameter tuning
            
        Returns:
            Trained model
        """
        logger.info("Training XGBoost...")
        start_time = time.time()
        
        if tune_hyperparameters:
            param_grid = {
                'n_estimators': [100, 200, 300],
                'max_depth': [3, 5, 7, 9],
                'learning_rate': [0.01, 0.05, 0.1, 0.2],
                'subsample': [0.8, 0.9, 1.0],
                'colsample_bytree': [0.8, 0.9, 1.0]
            }
            
            model = GridSearchCV(
                XGBClassifier(random_state=self.random_state, use_label_encoder=False, eval_metric='logloss'),
                param_grid,
                cv=3,
                scoring='roc_auc',
                n_jobs=-1
            )
            model.fit(X_train, y_train)
            logger.info(f"Best parameters: {model.best_params_}")
            best_model = model.best_estimator_
        else:
            model = XGBClassifier(
                n_estimators=200,
                max_depth=5,
                learning_rate=0.1,
                subsample=0.9,
                colsample_bytree=0.9,
                random_state=self.random_state,
                use_label_encoder=False,
                eval_metric='logloss'
            )
            model.fit(X_train, y_train)
            best_model = model
        
        training_time = time.time() - start_time
        self.training_times['XGBoost'] = training_time
        
        logger.info(f"XGBoost trained in {training_time:.2f}s")
        return best_model
    
    def train_all_models(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        tune_hyperparameters: bool = False
    ) -> Dict[str, Any]:
        """
        Train all models
        
        Args:
            X_train: Training features
            y_train: Training target
            tune_hyperparameters: Whether to perform hyperparameter tuning
            
        Returns:
            Dictionary of trained models
        """
        logger.info("Training all models...")
        
        self.best_models = {
            'Logistic Regression': self.train_logistic_regression(X_train, y_train, tune_hyperparameters),
            'Random Forest': self.train_random_forest(X_train, y_train, tune_hyperparameters),
            'XGBoost': self.train_xgboost(X_train, y_train, tune_hyperparameters)
        }
        
        logger.info(f"All models trained. Training times: {self.training_times}")
        
        return self.best_models
    
    def save_models(self, models_dir: Path, scaler: Any = None):
        """
        Save trained models
        
        Args:
            models_dir: Directory to save models
            scaler: Scaler object to save
        """
        models_dir.mkdir(parents=True, exist_ok=True)
        
        for name, model in self.best_models.items():
            filename = name.lower().replace(' ', '_') + '.pkl'
            filepath = models_dir / filename
            joblib.dump(model, filepath)
            logger.info(f"Saved {name} to {filepath}")
        
        # Save scaler
        if scaler is not None:
            scaler_path = models_dir.parent / 'scalers' / 'scaler.pkl'
            scaler_path.parent.mkdir(parents=True, exist_ok=True)
            joblib.dump(scaler, scaler_path)
            logger.info(f"Saved scaler to {scaler_path}")
    
    def load_models(self, models_dir: Path) -> Dict[str, Any]:
        """
        Load trained models
        
        Args:
            models_dir: Directory containing models
            
        Returns:
            Dictionary of loaded models
        """
        models = {}
        
        model_files = {
            'Logistic Regression': 'logistic_regression.pkl',
            'Random Forest': 'random_forest.pkl',
            'XGBoost': 'xgboost.pkl'
        }
        
        for name, filename in model_files.items():
            filepath = models_dir / filename
            if filepath.exists():
                models[name] = joblib.load(filepath)
                logger.info(f"Loaded {name} from {filepath}")
            else:
                logger.warning(f"Model file not found: {filepath}")
        
        self.best_models = models
        return models

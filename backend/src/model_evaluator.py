"""
Model evaluation and metrics calculation
"""
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report, roc_curve
)
from typing import Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)


class ModelEvaluator:
    """Evaluate model performance"""
    
    def __init__(self):
        """Initialize ModelEvaluator"""
        self.metrics: Dict[str, Dict[str, float]] = {}
        self.confusion_matrices: Dict[str, np.ndarray] = {}
        self.classification_reports: Dict[str, Dict] = {}
    
    def evaluate_model(
        self,
        model: Any,
        X_test: np.ndarray,
        y_test: np.ndarray,
        model_name: str
    ) -> Dict[str, float]:
        """
        Evaluate a single model
        
        Args:
            model: Trained model
            X_test: Test features
            y_test: Test target
            model_name: Name of the model
            
        Returns:
            Dictionary of metrics
        """
        logger.info(f"Evaluating {model_name}...")
        
        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, zero_division=0),
            'recall': recall_score(y_test, y_pred, zero_division=0),
            'f1_score': f1_score(y_test, y_pred, zero_division=0),
            'roc_auc': roc_auc_score(y_test, y_pred_proba)
        }
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        self.confusion_matrices[model_name] = cm
        
        # Add confusion matrix values to metrics
        tn, fp, fn, tp = cm.ravel()
        metrics.update({
            'true_positives': int(tp),
            'true_negatives': int(tn),
            'false_positives': int(fp),
            'false_negatives': int(fn)
        })
        
        # Classification report
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        self.classification_reports[model_name] = report
        
        # Store metrics
        self.metrics[model_name] = metrics
        
        logger.info(f"{model_name} - Accuracy: {metrics['accuracy']:.4f}, "
                   f"Precision: {metrics['precision']:.4f}, "
                   f"Recall: {metrics['recall']:.4f}, "
                   f"F1: {metrics['f1_score']:.4f}, "
                   f"ROC-AUC: {metrics['roc_auc']:.4f}")
        
        return metrics
    
    def evaluate_all_models(
        self,
        models: Dict[str, Any],
        X_test: np.ndarray,
        y_test: np.ndarray
    ) -> Dict[str, Dict[str, float]]:
        """
        Evaluate all models
        
        Args:
            models: Dictionary of trained models
            X_test: Test features
            y_test: Test target
            
        Returns:
            Dictionary of metrics for all models
        """
        logger.info("Evaluating all models...")
        
        all_metrics = {}
        
        for model_name, model in models.items():
            metrics = self.evaluate_model(model, X_test, y_test, model_name)
            all_metrics[model_name] = metrics
        
        return all_metrics
    
    def get_best_model(self, metric: str = 'roc_auc') -> Tuple[str, float]:
        """
        Get best performing model
        
        Args:
            metric: Metric to use for comparison
            
        Returns:
            Tuple of (model_name, metric_value)
        """
        if not self.metrics:
            raise ValueError("No models have been evaluated yet")
        
        best_model = max(self.metrics.items(), key=lambda x: x[1][metric])
        logger.info(f"Best model by {metric}: {best_model[0]} ({best_model[1][metric]:.4f})")
        
        return best_model[0], best_model[1][metric]
    
    def get_confusion_matrix(self, model_name: str) -> np.ndarray:
        """
        Get confusion matrix for a model
        
        Args:
            model_name: Name of the model
            
        Returns:
            Confusion matrix
        """
        return self.confusion_matrices.get(model_name, np.array([]))
    
    def get_classification_report(self, model_name: str) -> Dict:
        """
        Get classification report for a model
        
        Args:
            model_name: Name of the model
            
        Returns:
            Classification report dictionary
        """
        return self.classification_reports.get(model_name, {})
    
    def get_roc_curve_data(
        self,
        model: Any,
        X_test: np.ndarray,
        y_test: np.ndarray
    ) -> Dict[str, Any]:
        """
        Get ROC curve data
        
        Args:
            model: Trained model
            X_test: Test features
            y_test: Test target
            
        Returns:
            Dictionary with FPR, TPR, and thresholds
        """
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        fpr, tpr, thresholds = roc_curve(y_test, y_pred_proba)
        
        return {
            'fpr': fpr.tolist(),
            'tpr': tpr.tolist(),
            'thresholds': thresholds.tolist(),
            'auc': roc_auc_score(y_test, y_pred_proba)
        }
    
    def get_feature_importance(
        self,
        model: Any,
        feature_names: list,
        top_n: int = 10
    ) -> Dict[str, float]:
        """
        Get feature importance
        
        Args:
            model: Trained model
            feature_names: List of feature names
            top_n: Number of top features to return
            
        Returns:
            Dictionary of feature importances
        """
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
        elif hasattr(model, 'coef_'):
            importances = np.abs(model.coef_[0])
        else:
            logger.warning("Model does not have feature importances")
            return {}
        
        # Create feature importance dictionary
        feature_importance = dict(zip(feature_names, importances))
        
        # Sort and get top N
        sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        top_features = dict(sorted_features[:top_n])
        
        logger.info(f"Top {top_n} features: {list(top_features.keys())}")
        
        return top_features
    
    def generate_comparison_table(self) -> Dict[str, Dict[str, float]]:
        """
        Generate comparison table for all models
        
        Returns:
            Dictionary with comparison metrics
        """
        comparison = {}
        
        for model_name, metrics in self.metrics.items():
            comparison[model_name] = {
                'Accuracy': round(metrics['accuracy'], 4),
                'Precision': round(metrics['precision'], 4),
                'Recall': round(metrics['recall'], 4),
                'F1 Score': round(metrics['f1_score'], 4),
                'ROC-AUC': round(metrics['roc_auc'], 4)
            }
        
        return comparison

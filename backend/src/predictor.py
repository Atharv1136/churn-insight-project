"""
Prediction inference engine
"""
import numpy as np
import joblib
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


class Predictor:
    """Make predictions using trained models"""
    
    def __init__(
        self,
        model_path: Optional[Path] = None,
        scaler_path: Optional[Path] = None,
        model_name: str = "XGBoost"
    ):
        """
        Initialize Predictor
        
        Args:
            model_path: Path to saved model
            scaler_path: Path to saved scaler
            model_name: Name of model to use
        """
        self.model = None
        self.scaler = None
        self.model_name = model_name
        self.feature_names = []
        
        if model_path:
            self.load_model(model_path)
        
        if scaler_path:
            self.load_scaler(scaler_path)
    
    def load_model(self, model_path: Path):
        """
        Load trained model
        
        Args:
            model_path: Path to model file
        """
        try:
            self.model = joblib.load(model_path)
            logger.info(f"Loaded model from {model_path}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    
    def load_scaler(self, scaler_path: Path):
        """
        Load scaler
        
        Args:
            scaler_path: Path to scaler file
        """
        try:
            self.scaler = joblib.load(scaler_path)
            logger.info(f"Loaded scaler from {scaler_path}")
        except Exception as e:
            logger.error(f"Error loading scaler: {e}")
            raise
    
    def predict_single(self, X: np.ndarray) -> Dict[str, Any]:
        """
        Make prediction for single sample
        
        Args:
            X: Feature vector
            
        Returns:
            Dictionary with prediction results
        """
        if self.model is None:
            raise ValueError("Model not loaded")
        
        try:
            # Get prediction and probability
            prediction = self.model.predict(X)[0]
            probability = self.model.predict_proba(X)[0]
            
            # Churn probability (probability of class 1)
            churn_prob = float(probability[1])
            
            # Determine risk level
            risk_level = self._get_risk_level(churn_prob)
            
            result = {
                'churn_prediction': bool(prediction),
                'churn_probability': churn_prob,
                'no_churn_probability': float(probability[0]),
                'risk_level': risk_level,
                'model_name': self.model_name
            }
            
            logger.info(f"Prediction: {prediction}, Probability: {churn_prob:.4f}, Risk: {risk_level}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error making prediction: {e}")
            raise
    
    def predict_batch(self, X: np.ndarray) -> List[Dict[str, Any]]:
        """
        Make predictions for multiple samples
        
        Args:
            X: Feature matrix
            
        Returns:
            List of prediction dictionaries
        """
        if self.model is None:
            raise ValueError("Model not loaded")
        
        try:
            predictions = self.model.predict(X)
            probabilities = self.model.predict_proba(X)
            
            results = []
            for i, (pred, prob) in enumerate(zip(predictions, probabilities)):
                churn_prob = float(prob[1])
                risk_level = self._get_risk_level(churn_prob)
                
                results.append({
                    'churn_prediction': bool(pred),
                    'churn_probability': churn_prob,
                    'no_churn_probability': float(prob[0]),
                    'risk_level': risk_level,
                    'model_name': self.model_name
                })
            
            logger.info(f"Made {len(results)} predictions")
            
            return results
            
        except Exception as e:
            logger.error(f"Error making batch predictions: {e}")
            raise
    
    def _get_risk_level(self, probability: float) -> str:
        """
        Determine risk level based on churn probability
        
        Args:
            probability: Churn probability
            
        Returns:
            Risk level string
        """
        if probability >= 0.7:
            return "HIGH"
        elif probability >= 0.4:
            return "MEDIUM"
        else:
            return "LOW"
    
    def get_prediction_confidence(self, probability: float) -> str:
        """
        Get confidence level of prediction
        
        Args:
            probability: Prediction probability
            
        Returns:
            Confidence level string
        """
        # Confidence based on distance from 0.5
        confidence = abs(probability - 0.5) * 2
        
        if confidence >= 0.8:
            return "Very High"
        elif confidence >= 0.6:
            return "High"
        elif confidence >= 0.4:
            return "Medium"
        else:
            return "Low"
    
    def predict_with_confidence(self, X: np.ndarray) -> Dict[str, Any]:
        """
        Make prediction with confidence level
        
        Args:
            X: Feature vector
            
        Returns:
            Dictionary with prediction and confidence
        """
        result = self.predict_single(X)
        confidence = self.get_prediction_confidence(result['churn_probability'])
        result['confidence'] = confidence
        
        return result

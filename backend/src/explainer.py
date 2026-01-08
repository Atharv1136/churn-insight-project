"""
SHAP-based model explainability
"""
import shap
import numpy as np
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class Explainer:
    """SHAP-based model explainability"""
    
    def __init__(self, model: Any, X_train: np.ndarray):
        """
        Initialize Explainer
        
        Args:
            model: Trained model
            X_train: Training data for background distribution
        """
        self.model = model
        self.X_train = X_train
        self.explainer = None
        self._initialize_explainer()
    
    def _initialize_explainer(self):
        """Initialize SHAP explainer based on model type"""
        try:
            model_type = type(self.model).__name__
            
            if 'XGB' in model_type:
                # Use TreeExplainer for XGBoost
                self.explainer = shap.TreeExplainer(self.model)
                logger.info("Initialized TreeExplainer for XGBoost")
            elif 'RandomForest' in model_type:
                # Use TreeExplainer for Random Forest
                self.explainer = shap.TreeExplainer(self.model)
                logger.info("Initialized TreeExplainer for Random Forest")
            else:
                # Use KernelExplainer for other models (e.g., Logistic Regression)
                # Use a subset of training data for efficiency
                background = shap.sample(self.X_train, min(100, len(self.X_train)))
                self.explainer = shap.KernelExplainer(self.model.predict_proba, background)
                logger.info("Initialized KernelExplainer for Logistic Regression")
        except Exception as e:
            logger.error(f"Error initializing SHAP explainer: {e}")
            self.explainer = None
    
    def explain_prediction(
        self,
        X: np.ndarray,
        feature_names: List[str]
    ) -> Dict[str, Any]:
        """
        Explain a single prediction
        
        Args:
            X: Feature vector (single sample)
            feature_names: List of feature names
            
        Returns:
            Dictionary with SHAP values and explanations
        """
        if self.explainer is None:
            logger.warning("Explainer not initialized")
            return {}
        
        try:
            # Calculate SHAP values
            shap_values = self.explainer.shap_values(X)
            
            # Handle different SHAP value formats
            if isinstance(shap_values, list):
                # For binary classification, take positive class
                shap_values = shap_values[1] if len(shap_values) > 1 else shap_values[0]
            
            # Ensure shap_values is 1D for single prediction
            if len(shap_values.shape) > 1:
                shap_values = shap_values[0]
            
            # Get base value
            if hasattr(self.explainer, 'expected_value'):
                base_value = self.explainer.expected_value
                if isinstance(base_value, (list, np.ndarray)):
                    base_value = base_value[1] if len(base_value) > 1 else base_value[0]
            else:
                base_value = 0.0
            
            # Create feature impact dictionary
            feature_impacts = []
            for i, (feature, shap_val) in enumerate(zip(feature_names, shap_values)):
                feature_impacts.append({
                    'feature': feature,
                    'value': float(X[0][i]) if len(X.shape) > 1 else float(X[i]),
                    'shap_value': float(shap_val),
                    'impact': 'positive' if shap_val > 0 else 'negative'
                })
            
            # Sort by absolute SHAP value
            feature_impacts.sort(key=lambda x: abs(x['shap_value']), reverse=True)
            
            result = {
                'base_value': float(base_value),
                'shap_values': [float(v) for v in shap_values],
                'feature_impacts': feature_impacts,
                'top_features': feature_impacts[:5]
            }
            
            logger.info(f"Generated SHAP explanation with {len(feature_impacts)} features")
            return result
            
        except Exception as e:
            logger.error(f"Error explaining prediction: {e}")
            return {}
    
    def get_top_features(
        self,
        X: np.ndarray,
        feature_names: List[str],
        top_n: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get top contributing features
        
        Args:
            X: Feature vector
            feature_names: List of feature names
            top_n: Number of top features
            
        Returns:
            List of top features with their contributions
        """
        explanation = self.explain_prediction(X, feature_names)
        
        if not explanation:
            return []
        
        return explanation['feature_impacts'][:top_n]
    
    def generate_recommendations(
        self,
        feature_impacts: List[Dict[str, Any]],
        churn_probability: float
    ) -> List[str]:
        """
        Generate actionable recommendations based on SHAP values
        
        Args:
            feature_impacts: List of feature impacts from SHAP
            churn_probability: Predicted churn probability
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        # Get top positive contributors (increasing churn risk)
        top_risk_factors = [f for f in feature_impacts if f['shap_value'] > 0][:3]
        
        for factor in top_risk_factors:
            feature = factor['feature']
            
            # Contract-related recommendations
            if 'month_to_month' in feature.lower() or 'contract' in feature.lower():
                recommendations.append("Offer a contract upgrade incentive (annual or 2-year plan)")
            
            # Payment-related recommendations
            elif 'electronic_check' in feature.lower() or 'payment' in feature.lower():
                recommendations.append("Promote automatic payment methods with discount")
            
            # Service-related recommendations
            elif 'tech_support' in feature.lower():
                recommendations.append("Offer complimentary tech support trial")
            elif 'online_security' in feature.lower() or 'security' in feature.lower():
                recommendations.append("Provide security service package promotion")
            
            # Tenure-related recommendations
            elif 'tenure' in feature.lower():
                recommendations.append("Implement loyalty rewards program for long-term customers")
            
            # Charge-related recommendations
            elif 'charges' in feature.lower():
                if churn_probability > 0.7:
                    recommendations.append("Consider offering a personalized discount or price adjustment")
                else:
                    recommendations.append("Highlight value-added services to justify pricing")
        
        # General recommendations based on churn probability
        if churn_probability > 0.8:
            recommendations.append("⚠️ HIGH PRIORITY: Immediate customer retention outreach required")
        elif churn_probability > 0.6:
            recommendations.append("Schedule proactive customer satisfaction call")
        
        # Ensure we have at least some recommendations
        if not recommendations:
            recommendations.append("Monitor customer engagement and satisfaction metrics")
            recommendations.append("Conduct customer feedback survey")
        
        return recommendations[:5]  # Return top 5 recommendations
    
    def explain_with_recommendations(
        self,
        X: np.ndarray,
        feature_names: List[str],
        churn_probability: float
    ) -> Dict[str, Any]:
        """
        Complete explanation with recommendations
        
        Args:
            X: Feature vector
            feature_names: List of feature names
            churn_probability: Predicted churn probability
            
        Returns:
            Dictionary with explanations and recommendations
        """
        explanation = self.explain_prediction(X, feature_names)
        
        if explanation:
            recommendations = self.generate_recommendations(
                explanation['feature_impacts'],
                churn_probability
            )
            explanation['recommendations'] = recommendations
        
        return explanation

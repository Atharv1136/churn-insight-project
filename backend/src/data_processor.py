"""
Data preprocessing and cleaning
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from typing import Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)


class DataProcessor:
    """Clean and preprocess customer data"""
    
    def __init__(self):
        """Initialize DataProcessor"""
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.scaler: StandardScaler = StandardScaler()
        self.feature_names = []
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean raw data
        
        Args:
            df: Raw DataFrame
            
        Returns:
            Cleaned DataFrame
        """
        df = df.copy()
        
        # Handle TotalCharges - convert to numeric (handles empty strings and spaces)
        if 'TotalCharges' in df.columns:
            # Replace empty strings and spaces with NaN
            df['TotalCharges'] = df['TotalCharges'].replace(' ', np.nan)
            df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
            # Fill NaN with MonthlyCharges (for new customers with 0 tenure)
            df['TotalCharges'].fillna(df['MonthlyCharges'], inplace=True)
        
        # Remove customerID for modeling (keep for reference)
        if 'customerID' in df.columns:
            df['customer_id'] = df['customerID']
        
        # Handle missing values using forward fill
        df = df.ffill()
        
        # Convert SeniorCitizen to Yes/No for consistency
        if 'SeniorCitizen' in df.columns:
            df['SeniorCitizen'] = df['SeniorCitizen'].map({0: 'No', 1: 'Yes'})
        
        logger.info(f"Cleaned data: {len(df)} records")
        return df
    
    def encode_categorical(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        """
        Encode categorical variables
        
        Args:
            df: DataFrame with categorical columns
            fit: Whether to fit encoders (True for training, False for inference)
            
        Returns:
            DataFrame with encoded features
        """
        df = df.copy()
        
        # Binary categorical columns
        binary_columns = {
            'gender': {'Male': 1, 'Female': 0},
            'Partner': {'Yes': 1, 'No': 0},
            'Dependents': {'Yes': 1, 'No': 0},
            'PhoneService': {'Yes': 1, 'No': 0},
            'PaperlessBilling': {'Yes': 1, 'No': 0},
            'SeniorCitizen': {'Yes': 1, 'No': 0},
            'Churn': {'Yes': 1, 'No': 0}
        }
        
        for col, mapping in binary_columns.items():
            if col in df.columns:
                df[col] = df[col].map(mapping)
        
        # Multi-class categorical columns - use one-hot encoding
        categorical_columns = [
            'MultipleLines', 'InternetService', 'OnlineSecurity',
            'OnlineBackup', 'DeviceProtection', 'TechSupport',
            'StreamingTV', 'StreamingMovies', 'Contract', 'PaymentMethod'
        ]
        
        existing_categorical = [col for col in categorical_columns if col in df.columns]
        
        if existing_categorical:
            df = pd.get_dummies(df, columns=existing_categorical, drop_first=True)
        
        logger.info(f"Encoded categorical features: {df.shape[1]} total features")
        return df
    
    def prepare_features(self, df: pd.DataFrame, target_col: str = 'Churn') -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare features and target
        
        Args:
            df: Processed DataFrame
            target_col: Name of target column
            
        Returns:
            Tuple of (features DataFrame, target Series)
        """
        df = df.copy()
        
        # Separate features and target
        if target_col in df.columns:
            y = df[target_col]
            X = df.drop(columns=[target_col])
        else:
            y = None
            X = df
        
        # Remove non-feature columns
        cols_to_drop = ['customerID', 'customer_id']
        X = X.drop(columns=[col for col in cols_to_drop if col in X.columns])
        
        # Store feature names
        self.feature_names = X.columns.tolist()
        
        logger.info(f"Prepared features: {X.shape[1]} features, {len(X)} samples")
        
        return X, y
    
    def scale_features(self, X: pd.DataFrame, fit: bool = True) -> np.ndarray:
        """
        Scale numerical features
        
        Args:
            X: Features DataFrame
            fit: Whether to fit scaler
            
        Returns:
            Scaled features array
        """
        if fit:
            X_scaled = self.scaler.fit_transform(X)
            logger.info("Fitted and transformed features")
        else:
            X_scaled = self.scaler.transform(X)
            logger.info("Transformed features using existing scaler")
        
        return X_scaled
    
    def process_pipeline(self, df: pd.DataFrame, fit: bool = True, target_col: str = 'Churn') -> Tuple[np.ndarray, np.ndarray, list]:
        """
        Complete preprocessing pipeline
        
        Args:
            df: Raw DataFrame
            fit: Whether to fit transformers
            target_col: Target column name
            
        Returns:
            Tuple of (X_scaled, y, feature_names)
        """
        # Clean data
        df_clean = self.clean_data(df)
        
        # Encode categorical
        df_encoded = self.encode_categorical(df_clean, fit=fit)
        
        # Prepare features
        X, y = self.prepare_features(df_encoded, target_col=target_col)
        
        # Scale features
        X_scaled = self.scale_features(X, fit=fit)
        
        # Convert target to numpy array
        y_array = y.values if y is not None else None
        
        logger.info(f"Pipeline complete: X shape {X_scaled.shape}, y shape {y_array.shape if y_array is not None else 'None'}")
        
        return X_scaled, y_array, self.feature_names
    
    def process_single_input(self, input_data: Dict[str, Any]) -> np.ndarray:
        """
        Process single input for prediction
        
        Args:
            input_data: Dictionary with customer features
            
        Returns:
            Scaled feature array
        """
        # Convert to DataFrame
        df = pd.DataFrame([input_data])
        
        # Process without fitting
        X_scaled, _, _ = self.process_pipeline(df, fit=False, target_col='Churn')
        
        return X_scaled

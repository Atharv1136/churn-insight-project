"""
Feature engineering for churn prediction
"""
import pandas as pd
import numpy as np
from typing import List
import logging

logger = logging.getLogger(__name__)


class FeatureEngineer:
    """Create derived features for better predictions"""
    
    def __init__(self):
        """Initialize FeatureEngineer"""
        pass
    
    def create_tenure_groups(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create tenure groups
        
        Args:
            df: DataFrame with tenure column
            
        Returns:
            DataFrame with tenure group features
        """
        df = df.copy()
        
        if 'tenure' in df.columns:
            df['tenure_group'] = pd.cut(
                df['tenure'],
                bins=[0, 12, 24, 48, 72],
                labels=['0-1 year', '1-2 years', '2-4 years', '4+ years']
            )
            
            # One-hot encode tenure groups
            df = pd.get_dummies(df, columns=['tenure_group'], prefix='tenure')
            
            logger.info("Created tenure group features")
        
        return df
    
    def create_charge_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create charge-related features
        
        Args:
            df: DataFrame with charge columns
            
        Returns:
            DataFrame with new charge features
        """
        df = df.copy()
        
        if 'MonthlyCharges' in df.columns and 'TotalCharges' in df.columns:
            # Average monthly charges
            df['avg_monthly_charges'] = df['TotalCharges'] / (df['tenure'] + 1)
            
            # Charge increase indicator
            df['charge_increase'] = (df['MonthlyCharges'] > df['avg_monthly_charges']).astype(int)
            
            # Charge to tenure ratio
            df['charge_per_tenure'] = df['MonthlyCharges'] / (df['tenure'] + 1)
            
            logger.info("Created charge-based features")
        
        return df
    
    def create_service_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create service-related features
        
        Args:
            df: DataFrame with service columns
            
        Returns:
            DataFrame with service features
        """
        df = df.copy()
        
        # Count total services
        service_columns = [
            'PhoneService', 'MultipleLines', 'OnlineSecurity',
            'OnlineBackup', 'DeviceProtection', 'TechSupport',
            'StreamingTV', 'StreamingMovies'
        ]
        
        existing_services = [col for col in service_columns if col in df.columns]
        
        if existing_services:
            # Total number of services (count 'Yes' values)
            df['total_services'] = 0
            for col in existing_services:
                if df[col].dtype == 'object':
                    df['total_services'] += (df[col] == 'Yes').astype(int)
                else:
                    df['total_services'] += df[col]
            
            # Has internet services
            if 'InternetService' in df.columns:
                df['has_internet'] = (df['InternetService'] != 'No').astype(int)
            
            # Has security services
            security_services = ['OnlineSecurity', 'OnlineBackup', 'DeviceProtection', 'TechSupport']
            existing_security = [col for col in security_services if col in df.columns]
            
            if existing_security:
                df['has_security'] = 0
                for col in existing_security:
                    if df[col].dtype == 'object':
                        df['has_security'] += (df[col] == 'Yes').astype(int)
                    else:
                        df['has_security'] += df[col]
                
                df['has_security'] = (df['has_security'] > 0).astype(int)
            
            logger.info("Created service-based features")
        
        return df
    
    def create_contract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create contract-related features
        
        Args:
            df: DataFrame with contract columns
            
        Returns:
            DataFrame with contract features
        """
        df = df.copy()
        
        if 'Contract' in df.columns:
            # Is month-to-month
            df['is_month_to_month'] = (df['Contract'] == 'Month-to-month').astype(int)
            
            # Has long-term contract
            df['has_long_contract'] = df['Contract'].isin(['One year', 'Two year']).astype(int)
        
        if 'PaymentMethod' in df.columns:
            # Is automatic payment
            df['is_auto_payment'] = df['PaymentMethod'].str.contains('automatic', case=False, na=False).astype(int)
            
            # Is electronic check (high churn indicator)
            df['is_electronic_check'] = (df['PaymentMethod'] == 'Electronic check').astype(int)
        
        logger.info("Created contract-based features")
        
        return df
    
    def create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create interaction features
        
        Args:
            df: DataFrame
            
        Returns:
            DataFrame with interaction features
        """
        df = df.copy()
        
        # Tenure * Monthly Charges
        if 'tenure' in df.columns and 'MonthlyCharges' in df.columns:
            df['tenure_charges_interaction'] = df['tenure'] * df['MonthlyCharges']
        
        # Contract * Payment Method
        if 'is_month_to_month' in df.columns and 'is_electronic_check' in df.columns:
            df['risky_customer'] = (df['is_month_to_month'] & df['is_electronic_check']).astype(int)
        
        logger.info("Created interaction features")
        
        return df
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply all feature engineering steps
        
        Args:
            df: Raw DataFrame
            
        Returns:
            DataFrame with engineered features
        """
        logger.info("Starting feature engineering")
        
        df = self.create_charge_features(df)
        df = self.create_service_features(df)
        df = self.create_contract_features(df)
        df = self.create_tenure_groups(df)
        df = self.create_interaction_features(df)
        
        logger.info(f"Feature engineering complete: {df.shape[1]} total columns")
        
        return df
    
    def get_feature_importance_names(self) -> List[str]:
        """
        Get list of engineered feature names
        
        Returns:
            List of feature names
        """
        return [
            'avg_monthly_charges', 'charge_increase', 'charge_per_tenure',
            'total_services', 'has_internet', 'has_security',
            'is_month_to_month', 'has_long_contract', 'is_auto_payment',
            'is_electronic_check', 'tenure_charges_interaction', 'risky_customer'
        ]

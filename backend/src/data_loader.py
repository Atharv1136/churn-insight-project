"""
Data loading utilities
"""
import pandas as pd
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class DataLoader:
    """Load and validate datasets"""
    
    def __init__(self, data_path: Optional[Path] = None):
        """
        Initialize DataLoader
        
        Args:
            data_path: Path to data directory
        """
        self.data_path = data_path or Path(__file__).parent.parent / "data"
        self.raw_data_path = self.data_path / "raw"
    
    def load_telco_churn(self, filename: str = "telco_churn.csv") -> pd.DataFrame:
        """
        Load Telco Customer Churn dataset
        
        Args:
            filename: Name of CSV file
            
        Returns:
            DataFrame with customer data
        """
        file_path = self.raw_data_path / filename
        
        if not file_path.exists():
            raise FileNotFoundError(
                f"Dataset not found at {file_path}. "
                f"Please place the Telco Customer Churn dataset (WA_Fn-UseC_-Telco-Customer-Churn.csv) "
                f"in the {self.raw_data_path} directory and rename it to 'telco_churn.csv'"
            )
        
        try:
            df = pd.read_csv(file_path)
            logger.info(f"Loaded {len(df)} records from {filename}")
            return df
        except Exception as e:
            logger.error(f"Error loading dataset: {e}")
            raise
    
    
    def validate_data(self, df: pd.DataFrame) -> bool:
        """
        Validate dataset structure
        
        Args:
            df: DataFrame to validate
            
        Returns:
            True if valid, raises exception otherwise
        """
        required_columns = [
            'customerID', 'tenure', 'MonthlyCharges', 'TotalCharges',
            'Contract', 'PaymentMethod', 'InternetService'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        if len(df) == 0:
            raise ValueError("Dataset is empty")
        
        logger.info("Dataset validation passed")
        return True
    
    def save_processed_data(self, df: pd.DataFrame, filename: str = "processed_data.csv"):
        """
        Save processed data
        
        Args:
            df: DataFrame to save
            filename: Output filename
        """
        output_path = self.data_path.parent / "processed" / filename
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        df.to_csv(output_path, index=False)
        logger.info(f"Saved processed data to {output_path}")

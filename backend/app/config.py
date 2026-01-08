"""
Configuration management using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from pathlib import Path
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./database/churn.db"
    
    # Model Settings
    MODEL_PATH: str = "models/saved_models/"
    SCALER_PATH: str = "models/scalers/"
    MODEL_VERSION: str = "1.0.0"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:8080"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    
    # Training
    RANDOM_STATE: int = 42
    TEST_SIZE: float = 0.2
    CV_FOLDS: int = 5
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    RAW_DATA_DIR: Path = DATA_DIR / "raw"
    PROCESSED_DATA_DIR: Path = DATA_DIR / "processed"
    MODELS_DIR: Path = BASE_DIR / "models"
    SAVED_MODELS_DIR: Path = MODELS_DIR / "saved_models"
    SCALERS_DIR: Path = MODELS_DIR / "scalers"
    LOGS_DIR: Path = BASE_DIR / "logs"
    DATABASE_DIR: Path = BASE_DIR / "database"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    def create_directories(self):
        """Create necessary directories if they don't exist"""
        directories = [
            self.DATA_DIR,
            self.RAW_DATA_DIR,
            self.PROCESSED_DATA_DIR,
            self.MODELS_DIR,
            self.SAVED_MODELS_DIR,
            self.SCALERS_DIR,
            self.LOGS_DIR,
            self.DATABASE_DIR
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)


# Global settings instance
settings = Settings()

# Create directories on import
settings.create_directories()

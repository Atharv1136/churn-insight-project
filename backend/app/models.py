"""
SQLAlchemy ORM Models
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, Text
from datetime import datetime
from app.database import Base


class Customer(Base):
    """Customer data model"""
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, unique=True, index=True, nullable=False)
    
    # Demographics
    gender = Column(String)
    senior_citizen = Column(Boolean, default=False)
    partner = Column(Boolean, default=False)
    dependents = Column(Boolean, default=False)
    
    # Account Information
    tenure = Column(Integer)
    contract_type = Column(String)
    payment_method = Column(String)
    paperless_billing = Column(Boolean, default=False)
    
    # Services
    phone_service = Column(Boolean, default=False)
    multiple_lines = Column(Boolean, default=False)
    internet_service = Column(String)
    online_security = Column(Boolean, default=False)
    online_backup = Column(Boolean, default=False)
    device_protection = Column(Boolean, default=False)
    tech_support = Column(Boolean, default=False)
    streaming_tv = Column(Boolean, default=False)
    streaming_movies = Column(Boolean, default=False)
    
    # Charges
    monthly_charges = Column(Float)
    total_charges = Column(Float)
    
    # Churn Status
    churn_status = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Prediction(Base):
    """Prediction results model"""
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, index=True, nullable=False)
    
    # Prediction Results
    churn_probability = Column(Float, nullable=False)
    churn_prediction = Column(Boolean, nullable=False)
    risk_level = Column(String)  # LOW, MEDIUM, HIGH
    
    # Model Information
    model_name = Column(String, default="XGBoost")
    model_version = Column(String)
    
    # Features Used
    features = Column(JSON)
    
    # Explainability
    top_features = Column(JSON)  # Top contributing features
    shap_values = Column(JSON, nullable=True)
    
    # Recommendations
    recommendations = Column(JSON, nullable=True)
    
    # Metadata
    prediction_date = Column(DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "churn_probability": self.churn_probability,
            "churn_prediction": self.churn_prediction,
            "risk_level": self.risk_level,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "features": self.features,
            "top_features": self.top_features,
            "recommendations": self.recommendations,
            "prediction_date": self.prediction_date.isoformat() if self.prediction_date else None
        }


class ModelMetric(Base):
    """Model performance metrics"""
    __tablename__ = "model_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, nullable=False, index=True)
    model_version = Column(String)
    
    # Performance Metrics
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    roc_auc = Column(Float)
    
    # Confusion Matrix
    true_positives = Column(Integer)
    true_negatives = Column(Integer)
    false_positives = Column(Integer)
    false_negatives = Column(Integer)
    
    # Additional Metrics
    confusion_matrix = Column(JSON)
    classification_report = Column(JSON)
    feature_importance = Column(JSON)
    
    # Training Information
    training_samples = Column(Integer)
    test_samples = Column(Integer)
    training_time_seconds = Column(Float)
    
    # Metadata
    trained_at = Column(DateTime, default=datetime.utcnow, index=True)
    notes = Column(Text, nullable=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "accuracy": self.accuracy,
            "precision": self.precision,
            "recall": self.recall,
            "f1_score": self.f1_score,
            "roc_auc": self.roc_auc,
            "trained_at": self.trained_at.isoformat() if self.trained_at else None
        }


class TrainingJob(Base):
    """Training job tracking"""
    __tablename__ = "training_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True, nullable=False)
    
    # Job Status
    status = Column(String, default="pending")  # pending, running, completed, failed
    progress = Column(Float, default=0.0)
    
    # Job Details
    models_to_train = Column(JSON)
    current_model = Column(String, nullable=True)
    
    # Results
    results = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "job_id": self.job_id,
            "status": self.status,
            "progress": self.progress,
            "current_model": self.current_model,
            "results": self.results,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }

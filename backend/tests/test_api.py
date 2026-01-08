"""
API endpoint tests
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert response.json()["status"] == "running"


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_predict_endpoint_structure():
    """Test prediction endpoint structure"""
    # This will fail until models are trained, but tests the endpoint exists
    sample_data = {
        "customer_id": "TEST001",
        "gender": "Female",
        "senior_citizen": 0,
        "partner": "Yes",
        "dependents": "No",
        "tenure": 12,
        "phone_service": "Yes",
        "multiple_lines": "No",
        "internet_service": "Fiber optic",
        "online_security": "No",
        "online_backup": "No",
        "device_protection": "No",
        "tech_support": "No",
        "streaming_tv": "Yes",
        "streaming_movies": "Yes",
        "contract": "Month-to-month",
        "paperless_billing": "Yes",
        "payment_method": "Electronic check",
        "monthly_charges": 85.50,
        "total_charges": 1026.00
    }
    
    response = client.post("/api/predict", json=sample_data)
    # May return 503 if models not trained yet
    assert response.status_code in [200, 503]


def test_metrics_endpoint():
    """Test metrics endpoint"""
    response = client.get("/api/metrics")
    assert response.status_code == 200
    assert "metrics" in response.json()


def test_dashboard_metrics():
    """Test dashboard metrics endpoint"""
    response = client.get("/api/metrics/dashboard")
    assert response.status_code == 200
    assert "kpis" in response.json()
    assert "churn_trend" in response.json()


def test_customers_endpoint():
    """Test customers endpoint"""
    response = client.get("/api/customers")
    assert response.status_code == 200
    assert "customers" in response.json()
    assert "total" in response.json()


def test_recent_predictions():
    """Test recent predictions endpoint"""
    response = client.get("/api/predictions/recent")
    assert response.status_code == 200
    assert "predictions" in response.json()


def test_training_jobs():
    """Test training jobs endpoint"""
    response = client.get("/api/train/jobs")
    assert response.status_code == 200
    assert "jobs" in response.json()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

# 🎯 Customer Churn Prediction System

A production-ready, full-stack ML application for predicting customer churn with explainable AI.

## 📋 Overview

This system provides end-to-end customer churn prediction capabilities with:

- **Python FastAPI Backend**: Complete ML pipeline with 3 models (Logistic Regression, Random Forest, XGBoost)
- **React Frontend**: Modern, responsive UI built with TypeScript and shadcn/ui
- **SHAP Explainability**: Understand why customers are predicted to churn
- **SQLite Database**: Persistent storage for predictions and metrics
- **RESTful API**: Well-documented endpoints with automatic Swagger docs
- **Docker Support**: Easy deployment with Docker Compose

## ✨ Features

### Backend (Python/FastAPI)
- ✅ Complete ML pipeline (data loading, processing, feature engineering)
- ✅ 3 trained models with performance comparison
- ✅ SHAP-based explainability and recommendations
- ✅ Single and batch prediction endpoints
- ✅ Background training jobs with progress tracking
- ✅ Comprehensive metrics and analytics
- ✅ SQLite database with SQLAlchemy ORM
- ✅ Automatic API documentation (Swagger/ReDoc)

### Frontend (React/TypeScript)
- ✅ Interactive dashboard with real-time metrics
- ✅ Customer churn prediction interface
- ✅ Data analysis and visualization
- ✅ Model performance comparison
- ✅ SHAP explanation visualizations
- ✅ Responsive design with Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- pip and npm

### Option 1: Automated Setup (Recommended)

**Windows:**
```batch
run.bat
```

**Linux/Mac:**
```bash
chmod +x run.sh
./run.sh
```

### Option 2: Manual Setup

#### Backend Setup

1. **Create virtual environment:**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

2. **Install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

3. **Configure environment:**
```bash
# Copy example env file
cp .env.example .env

# Edit .env if needed (optional)
```

4. **Train models (REQUIRED for first time):**
```bash
python train_models.py
```

This will:
- Load/generate sample data
- Engineer features
- Train 3 ML models
- Evaluate and save models
- Store metrics in database

Expected output:
```
Model Performance Comparison
============================================================

Logistic Regression:
  Accuracy:  0.7900
  Precision: 0.6500
  Recall:    0.5500
  F1 Score:  0.5900
  ROC-AUC:   0.7400

Random Forest:
  Accuracy:  0.8200
  Precision: 0.7100
  Recall:    0.6300
  F1 Score:  0.6700
  ROC-AUC:   0.8100

XGBoost:
  Accuracy:  0.8500
  Precision: 0.7600
  Recall:    0.6800
  F1 Score:  0.7200
  ROC-AUC:   0.8400

🏆 Best Model: XGBoost (ROC-AUC: 0.8400)
```

5. **Start backend server:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at:
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

#### Frontend Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

Frontend will be available at: http://localhost:5173

### Option 3: Docker Deployment

```bash
docker-compose up --build
```

This starts both backend and frontend:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Endpoints

#### Predictions

**POST /api/predict**
Predict churn for a single customer

Request:
```json
{
  "customer_id": "CUST001",
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
```

Response:
```json
{
  "customer_id": "CUST001",
  "churn_prediction": true,
  "churn_probability": 0.7850,
  "risk_level": "HIGH",
  "top_features": [
    {
      "feature": "Contract_Month-to-month",
      "value": 1,
      "shap_value": 0.12,
      "impact": "positive"
    }
  ],
  "recommendations": [
    "Offer a contract upgrade incentive (annual or 2-year plan)",
    "Promote automatic payment methods with discount"
  ],
  "model_name": "XGBoost",
  "prediction_date": "2024-01-08T18:00:00"
}
```

**POST /api/predict-batch**
Upload CSV file for batch predictions

**GET /api/predictions/recent**
Get recent predictions

#### Training

**POST /api/train**
Trigger model retraining

Request:
```json
{
  "tune_hyperparameters": false,
  "balance_classes": true,
  "test_size": 0.2
}
```

Response:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Training job started. Use /train/status/{job_id} to check progress."
}
```

**GET /api/train/status/{job_id}**
Check training job status

**GET /api/train/jobs**
Get recent training jobs

#### Metrics

**GET /api/metrics**
Get latest model performance metrics

**GET /api/metrics/comparison**
Compare all models

**GET /api/metrics/dashboard**
Get dashboard KPIs and trends

**GET /api/metrics/feature-importance/{model_name}**
Get feature importance for a model

**GET /api/metrics/confusion-matrix/{model_name}**
Get confusion matrix for a model

#### Explainability

**GET /api/explain/{customer_id}**
Get SHAP explanation for a prediction

**POST /api/explain/what-if**
Perform what-if analysis

Request:
```json
{
  "customer_id": "CUST001",
  "changes": {
    "contract": "Two year",
    "tech_support": "Yes"
  }
}
```

**GET /api/explain/recommendations/{customer_id}**
Get personalized recommendations

#### Customers

**GET /api/customers**
Get customers with filtering and pagination

Query parameters:
- `skip`: Offset (default: 0)
- `limit`: Page size (default: 20)
- `contract_type`: Filter by contract
- `tenure_min`: Minimum tenure
- `tenure_max`: Maximum tenure
- `churn_status`: Filter by churn status
- `search`: Search customer ID or payment method

**GET /api/customers/{customer_id}**
Get customer details with prediction history

**GET /api/customers/stats/summary**
Get customer statistics summary

## 🗂️ Project Structure

```
churn-insight-dashboard/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration
│   │   ├── database.py          # SQLAlchemy setup
│   │   └── models.py            # ORM models
│   ├── src/
│   │   ├── data_loader.py       # Data loading
│   │   ├── data_processor.py    # Data preprocessing
│   │   ├── feature_engineer.py  # Feature engineering
│   │   ├── model_trainer.py     # Model training
│   │   ├── model_evaluator.py   # Model evaluation
│   │   ├── explainer.py         # SHAP explainability
│   │   └── predictor.py         # Inference
│   ├── api/
│   │   └── routes/
│   │       ├── predict.py       # Prediction endpoints
│   │       ├── train.py         # Training endpoints
│   │       ├── metrics.py       # Metrics endpoints
│   │       ├── explain.py       # Explainability endpoints
│   │       └── customers.py     # Customer endpoints
│   ├── data/
│   │   ├── raw/                 # Raw datasets
│   │   ├── processed/           # Processed data
│   │   └── sample_requests.json # Sample API requests
│   ├── models/
│   │   ├── saved_models/        # Trained models (.pkl)
│   │   ├── scalers/             # Scalers
│   │   └── model_metadata.json  # Model metadata
│   ├── database/
│   │   └── churn.db            # SQLite database
│   ├── logs/
│   │   └── app.log             # Application logs
│   ├── tests/
│   │   ├── test_api.py         # API tests
│   │   └── test_models.py      # ML tests
│   ├── requirements.txt
│   ├── .env.example
│   ├── Dockerfile
│   └── train_models.py         # Training script
├── src/                        # Frontend source
├── public/                     # Frontend assets
├── docker-compose.yml
├── run.sh                      # Linux/Mac startup
├── run.bat                     # Windows startup
└── README.md
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_api.py -v
pytest tests/test_models.py -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html
```

### Frontend Tests

```bash
npm test
```

## 📊 Model Performance

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|-------|----------|-----------|--------|-----|---------|
| Logistic Regression | 0.79 | 0.65 | 0.55 | 0.59 | 0.74 |
| Random Forest | 0.82 | 0.71 | 0.63 | 0.67 | 0.81 |
| **XGBoost** | **0.85** | **0.76** | **0.68** | **0.72** | **0.84** |

*Note: Actual performance may vary based on dataset*

## 🔧 Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=True

# Database
DATABASE_URL=sqlite:///./database/churn.db

# Model Settings
MODEL_PATH=models/saved_models/
SCALER_PATH=models/scalers/
MODEL_VERSION=1.0.0

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log

# Training
RANDOM_STATE=42
TEST_SIZE=0.2
CV_FOLDS=5
```

### Frontend Environment Variables

Edit `.env`:

```env
VITE_API_URL=http://localhost:8000
```

## 🐳 Docker Deployment

### Build and Run

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

For production, update `docker-compose.yml`:

```yaml
environment:
  - API_RELOAD=False
  - LOG_LEVEL=WARNING
```

## 📝 Development

### Adding New Features

1. **New API Endpoint:**
   - Add route in `backend/api/routes/`
   - Register in `backend/app/main.py`
   - Add tests in `backend/tests/test_api.py`

2. **New ML Feature:**
   - Add to `backend/src/feature_engineer.py`
   - Retrain models with `python train_models.py`

3. **New Model:**
   - Add training method in `backend/src/model_trainer.py`
   - Update evaluation in `backend/src/model_evaluator.py`

### Code Style

Backend follows PEP 8:
```bash
# Format code
black backend/

# Check linting
flake8 backend/
```

Frontend follows ESLint:
```bash
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License

## 🙏 Acknowledgments

- Dataset: Telco Customer Churn (IBM Sample Dataset)
- ML Libraries: scikit-learn, XGBoost, SHAP
- Web Framework: FastAPI, React
- UI Components: shadcn/ui

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check API documentation at `/docs`
- Review logs in `backend/logs/app.log`

## 🎯 Roadmap

- [ ] Add authentication and user management
- [ ] PostgreSQL support for production
- [ ] Real-time monitoring dashboard
- [ ] A/B testing framework
- [ ] Email notifications for high-risk customers
- [ ] Advanced feature engineering
- [ ] Model versioning and rollback
- [ ] Kubernetes deployment configs

---

**Built with ❤️ using FastAPI, React, and Machine Learning**

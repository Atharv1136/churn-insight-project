# Troubleshooting Prediction Issues

## Problem: "Predict Result" button just loads without showing results

This issue typically occurs when the backend ML models haven't been trained yet or the backend server isn't running properly.

## Quick Diagnosis

### 1. Check if Backend is Running

Open your browser and navigate to:
```
http://localhost:8000/docs
```

**If this page loads:** ✅ Backend is running
**If this page doesn't load:** ❌ Backend is not running - see "Start Backend Server" below

### 2. Check if Models are Trained

Navigate to:
```
http://localhost:8000/health
```

Look for the response. If you see an error about models not being available, continue to "Train Models" section.

## Solutions

### Solution 1: Start the Backend Server

If the backend isn't running:

**Windows:**
```batch
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Linux/Mac:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Solution 2: Train the Models (REQUIRED for first-time setup)

The models must be trained before predictions can be made:

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Activate virtual environment:**
   
   **Windows:**
   ```batch
   venv\Scripts\activate
   ```
   
   **Linux/Mac:**
   ```bash
   source venv/bin/activate
   ```

3. **Run the training script:**
   ```bash
   python train_models.py
   ```

4. **Wait for training to complete** (takes 2-5 minutes)
   
   You should see output like:
   ```
   Model Performance Comparison
   ============================================================
   
   Logistic Regression:
     Accuracy:  0.7900
     ...
   
   XGBoost:
     Accuracy:  0.8500
     ...
   
   🏆 Best Model: XGBoost (ROC-AUC: 0.8400)
   ✅ Models saved successfully
   ```

5. **Restart the backend server** if it was already running

### Solution 3: Check CORS Configuration

If you're getting CORS errors in the browser console:

1. Open `backend/.env`
2. Ensure it contains:
   ```env
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174
   ```
3. Restart the backend server

### Solution 4: Verify API URL

1. Check your `.env` file in the project root:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

2. If you changed it, restart the frontend:
   ```bash
   npm run dev
   ```

## Testing the Prediction API

Once the backend is running and models are trained, test the API directly:

### Using curl:

```bash
curl -X POST "http://localhost:8000/api/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "Female",
    "senior_citizen": 0,
    "partner": "Yes",
    "dependents": "No",
    "tenure": 12,
    "internet_service": "Fiber optic",
    "contract": "Month-to-month",
    "payment_method": "Electronic check",
    "monthly_charges": 85.50
  }'
```

### Using the Swagger UI:

1. Go to http://localhost:8000/docs
2. Find the `POST /api/predict` endpoint
3. Click "Try it out"
4. Use the example request
5. Click "Execute"

**Expected Response:**
```json
{
  "customer_id": "CUST_...",
  "churn_prediction": true,
  "churn_probability": 0.7850,
  "risk_level": "High",
  "top_features": [...],
  "recommendations": [...],
  "model_name": "XGBoost",
  "prediction_date": "2024-01-08T..."
}
```

## Common Error Messages

### "Models not available. Please train models first."
- **Cause:** Models haven't been trained
- **Solution:** Run `python train_models.py` in the backend directory

### "Cannot connect to the backend server"
- **Cause:** Backend server is not running
- **Solution:** Start the backend server (see Solution 1)

### "Network error: Failed to fetch"
- **Cause:** Frontend can't reach the backend
- **Solution:** 
  1. Check backend is running on port 8000
  2. Verify VITE_API_URL in .env
  3. Check firewall settings

### "503 Service Unavailable"
- **Cause:** Backend is running but models aren't loaded
- **Solution:** Train models and restart backend

## Still Having Issues?

### Check the Logs

**Backend logs:**
```bash
# Look at the terminal where backend is running
# Or check the log file:
cat backend/logs/app.log
```

**Browser console:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages in red

### Verify File Structure

Make sure these files exist:
```
backend/
├── models/
│   ├── saved_models/
│   │   ├── xgboost.pkl          ← Should exist after training
│   │   ├── random_forest.pkl
│   │   └── logistic_regression.pkl
│   ├── scalers/
│   │   └── scaler.pkl           ← Should exist after training
│   └── model_metadata.json      ← Should exist after training
└── database/
    └── churn.db                 ← Created automatically
```

If these files don't exist, run `python train_models.py` again.

### Complete Reset

If nothing works, try a complete reset:

1. **Stop all servers** (Ctrl+C in terminals)

2. **Delete generated files:**
   ```bash
   cd backend
   rm -rf models/saved_models/*
   rm -rf models/scalers/*
   rm -rf database/churn.db
   ```

3. **Reinstall dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Train models:**
   ```bash
   python train_models.py
   ```

5. **Start backend:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Start frontend** (in new terminal):
   ```bash
   npm run dev
   ```

## Need More Help?

1. Check the main README.md for detailed setup instructions
2. Review the API documentation at http://localhost:8000/docs
3. Check the backend logs at `backend/logs/app.log`
4. Open an issue on GitHub with:
   - Error messages from browser console
   - Backend terminal output
   - Steps you've already tried

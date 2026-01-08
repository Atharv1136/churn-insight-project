@echo off
echo Starting Customer Churn Prediction System...

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
pip install -r requirements.txt

REM Copy .env.example to .env if .env doesn't exist
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
)

REM Start backend
echo Starting FastAPI backend...
start /B python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

REM Wait for backend to start
timeout /t 3

echo.
echo ========================================
echo   System started successfully!
echo ========================================
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to stop the server...
pause

REM Kill the backend process
taskkill /F /IM python.exe

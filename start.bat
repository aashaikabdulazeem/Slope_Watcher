@echo off
echo ===================================================================
echo   LandSlide Sentinel - AI Early Warning & Risk Monitoring System
echo ===================================================================
echo.

echo [1/3] Checking ML model artifacts...
if not exist "backend\ml\saved_models\landslide_model.joblib" (
    echo Model artifact not found. Training model now...
    python backend\ml\train.py
) else (
    echo ML model is ready.
)

echo.
echo [2/3] Starting FastAPI Backend with WebSocket and Simulation on port 8000...
start "LandSlide Sentinel Backend" cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo [3/3] Starting React Frontend on port 5173...
start "LandSlide Sentinel Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================================
echo LandSlide Sentinel is launching!
echo - Backend API & Docs: http://127.0.0.1:8000/docs
echo - Frontend Dashboard: http://localhost:5173
echo ===================================================================
pause

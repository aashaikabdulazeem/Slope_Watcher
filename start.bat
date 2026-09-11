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
echo [2/3] Starting FastAPI Backend with WebSocket on 0.0.0.0:8000...
start "LandSlide Sentinel Backend" cmd /k "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [3/3] Starting React Frontend on 0.0.0.0:5173...
start "LandSlide Sentinel Frontend" cmd /k "cd frontend && npm run dev -- --host 0.0.0.0"

echo.
echo ===================================================================
echo LandSlide Sentinel is globally hosted!
echo - Localhost:  http://localhost:5173
echo - Network:    http://192.168.1.9:5173 (accessible on phones/LAN)
echo - API Docs:   http://localhost:8000/docs
echo ===================================================================
pause

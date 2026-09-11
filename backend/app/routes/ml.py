from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
from ..schemas import PredictRequest, PredictResponse
from ...ml.predictor import predictor
from ...ml.train import train_model

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.post("/predict", response_model=PredictResponse)
def predict_landslide_risk(payload: PredictRequest):
    try:
        input_data = payload.model_dump()
        result = predictor.predict(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/metrics", response_model=Dict[str, Any])
def get_model_metrics():
    metadata = predictor.get_metadata()
    if not metadata:
        raise HTTPException(status_code=404, detail="Model metadata not found")
    return metadata

def _background_retrain():
    train_model()
    predictor.reload()

@router.post("/train", response_model=Dict[str, Any])
def trigger_retraining(background_tasks: BackgroundTasks):
    background_tasks.add_task(_background_retrain)
    return {
        "success": True,
        "message": "Model retraining task initiated in background."
    }

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from ...database.connection import get_db
from ...database.models import Station, SensorReading
from ...ml.predictor import predictor
from ..alerts_engine import evaluate_reading_for_alert
from ..schemas import SensorReadingCreate, SensorReadingResponse

router = APIRouter(tags=["Sensor Readings"])

@router.get("/readings", response_model=List[Dict[str, Any]])
def get_readings(
    station_id: Optional[int] = None,
    limit: int = Query(default=60, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(SensorReading)
    if station_id:
        query = query.filter(SensorReading.station_id == station_id)
    
    # Retrieve latest readings ordered by timestamp descending, then return in chronological order
    readings = query.order_by(SensorReading.id.desc()).limit(limit).all()
    # Reverse so charts display left-to-right (oldest -> newest)
    readings.reverse()
    return [r.to_dict() for r in readings]

@router.get("/stations/{station_id}/readings", response_model=List[Dict[str, Any]])
def get_station_readings(
    station_id: int,
    limit: int = Query(default=60, ge=1, le=500),
    db: Session = Depends(get_db)
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    readings = db.query(SensorReading).filter(
        SensorReading.station_id == station_id
    ).order_by(SensorReading.id.desc()).limit(limit).all()
    readings.reverse()
    return [r.to_dict() for r in readings]

@router.post("/readings", response_model=Dict[str, Any])
def ingest_reading(payload: SensorReadingCreate, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == payload.station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    sensor_dict = {
        "rainfall": payload.rainfall,
        "soil_moisture": payload.soil_moisture,
        "slope_angle": payload.slope_angle,
        "vibration": payload.vibration,
        "pore_water_pressure": payload.pore_water_pressure,
        "temperature": payload.temperature
    }

    pred_res = predictor.predict(sensor_dict)

    reading = SensorReading(
        station_id=station.id,
        timestamp=datetime.now(timezone.utc),
        rainfall=payload.rainfall,
        soil_moisture=payload.soil_moisture,
        slope_angle=payload.slope_angle,
        vibration=payload.vibration,
        pore_water_pressure=payload.pore_water_pressure,
        temperature=payload.temperature,
        risk_score=pred_res["risk_score"],
        risk_level=pred_res["risk_level"],
        predicted_by="API_Ingest_RandomForest"
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    # Evaluate alert
    new_alert = evaluate_reading_for_alert(db, station, reading, pred_res)

    return {
        "reading": reading.to_dict(),
        "prediction": pred_res,
        "alert_triggered": new_alert.to_dict() if new_alert else None
    }

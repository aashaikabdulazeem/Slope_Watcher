from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ...database.connection import get_db
from ...database.models import Station, SensorReading
from ...simulation.simulation_service import simulation_service
from ..schemas import StationResponse, StationThresholdUpdate

router = APIRouter(prefix="/stations", tags=["Stations"])

@router.get("", response_model=List[Dict[str, Any]])
def get_all_stations(db: Session = Depends(get_db)):
    stations = db.query(Station).all()
    results = []
    for st in stations:
        st_dict = st.to_dict()
        # Attach latest reading from cache or DB
        latest = simulation_service.latest_readings.get(st.id)
        if not latest:
            db_reading = db.query(SensorReading).filter(
                SensorReading.station_id == st.id
            ).order_by(SensorReading.id.desc()).first()
            if db_reading:
                latest = db_reading.to_dict()
        
        st_dict["latest_reading"] = latest
        results.append(st_dict)
    return results

@router.get("/{station_id}", response_model=Dict[str, Any])
def get_station_detail(station_id: int, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    st_dict = station.to_dict()
    latest = simulation_service.latest_readings.get(station.id)
    if not latest:
        db_reading = db.query(SensorReading).filter(
            SensorReading.station_id == station.id
        ).order_by(SensorReading.id.desc()).first()
        if db_reading:
            latest = db_reading.to_dict()
    
    st_dict["latest_reading"] = latest
    return st_dict

@router.put("/{station_id}/thresholds", response_model=Dict[str, Any])
def update_station_thresholds(
    station_id: int,
    payload: StationThresholdUpdate,
    db: Session = Depends(get_db)
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    if payload.warning_threshold is not None:
        station.warning_threshold = payload.warning_threshold
    if payload.critical_threshold is not None:
        station.critical_threshold = payload.critical_threshold

    if station.warning_threshold >= station.critical_threshold:
        raise HTTPException(
            status_code=400,
            detail="Warning threshold must be strictly lower than critical threshold."
        )

    db.commit()
    db.refresh(station)
    return {
        "success": True,
        "message": f"Updated thresholds for {station.code}",
        "station": station.to_dict()
    }

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from ...database.connection import get_db
from ...database.models import Station
from ...simulation.simulation_service import simulation_service
from ..schemas import ScenarioInjectionRequest, SimulationControlRequest

router = APIRouter(prefix="/simulation", tags=["Simulation Controls"])

@router.get("/status", response_model=Dict[str, Any])
def get_simulation_status():
    return simulation_service.get_status()

@router.post("/scenario", response_model=Dict[str, Any])
def inject_scenario(payload: ScenarioInjectionRequest, db: Session = Depends(get_db)):
    station = None
    if payload.station_id:
        station = db.query(Station).filter(Station.id == payload.station_id).first()
    elif payload.station_code:
        station = db.query(Station).filter(Station.code == payload.station_code).first()

    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    valid_scenarios = ["normal", "gradual_escalation", "flash_flood", "seismic_shock", "dry_out"]
    if payload.scenario not in valid_scenarios:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario '{payload.scenario}'. Valid options: {valid_scenarios}"
        )

    success = simulation_service.set_station_scenario(db, station.id, payload.scenario)
    return {
        "success": success,
        "message": f"Scenario '{payload.scenario}' applied to {station.code} ({station.name}).",
        "station_id": station.id,
        "station_code": station.code,
        "scenario": payload.scenario
    }

@router.post("/control", response_model=Dict[str, Any])
async def control_simulation(payload: SimulationControlRequest):
    if payload.interval_seconds is not None:
        simulation_service.set_interval(payload.interval_seconds)

    if payload.is_running is not None:
        if payload.is_running and not simulation_service.is_running:
            await simulation_service.start()
        elif not payload.is_running and simulation_service.is_running:
            await simulation_service.stop()

    return {
        "success": True,
        "status": simulation_service.get_status()
    }

@router.post("/reset", response_model=Dict[str, Any])
def reset_all_scenarios(db: Session = Depends(get_db)):
    stations = db.query(Station).all()
    for st in stations:
        simulation_service.set_station_scenario(db, st.id, "normal")
    return {
        "success": True,
        "message": f"All {len(stations)} stations reset to normal baseline mode."
    }

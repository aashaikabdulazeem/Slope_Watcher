from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Station Schemas
class StationBase(BaseModel):
    code: str
    name: str
    location_name: str
    latitude: float
    longitude: float
    elevation: float
    slope_angle_base: float
    warning_threshold: float = 50.0
    critical_threshold: float = 75.0
    status: str = "active"
    scenario_mode: str = "normal"

class StationThresholdUpdate(BaseModel):
    warning_threshold: Optional[float] = Field(None, ge=10.0, le=90.0)
    critical_threshold: Optional[float] = Field(None, ge=20.0, le=100.0)

class StationResponse(StationBase):
    id: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    latest_reading: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# Sensor Reading Schemas
class SensorReadingBase(BaseModel):
    station_id: int
    rainfall: float = Field(..., ge=0.0, description="Precipitation rate in mm/h")
    soil_moisture: float = Field(..., ge=0.0, le=100.0, description="Volumetric soil moisture percentage")
    slope_angle: float = Field(..., ge=0.0, le=90.0, description="Current inclination in degrees")
    vibration: float = Field(..., ge=0.0, description="Ground tremor acceleration in m/s^2")
    pore_water_pressure: float = Field(..., ge=0.0, description="Pore water pressure in kPa")
    temperature: float = Field(..., description="Ambient temperature in °C")

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReadingResponse(SensorReadingBase):
    id: int
    station_code: Optional[str] = None
    station_name: Optional[str] = None
    timestamp: str
    risk_score: float
    risk_level: str
    predicted_by: str

    class Config:
        from_attributes = True

# Alert Schemas
class AlertResponse(BaseModel):
    id: int
    station_id: int
    station_code: Optional[str] = None
    station_name: Optional[str] = None
    timestamp: str
    risk_level: str
    risk_score: float
    trigger_factors: str
    recommended_action: str
    status: str
    notification_dispatched: bool
    dispatch_log: Optional[str] = None
    acknowledged_at: Optional[str] = None
    resolved_at: Optional[str] = None

    class Config:
        from_attributes = True

class AlertStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(acknowledged|resolved)$")

# ML Schemas
class PredictRequest(BaseModel):
    rainfall: float = Field(..., ge=0.0)
    soil_moisture: float = Field(..., ge=0.0, le=100.0)
    slope_angle: float = Field(..., ge=0.0, le=90.0)
    vibration: float = Field(..., ge=0.0)
    pore_water_pressure: float = Field(..., ge=0.0)
    temperature: float = Field(..., ge=-20.0, le=60.0)

class PredictResponse(BaseModel):
    risk_score: float
    risk_level: str
    probabilities: Dict[str, float]
    contributing_factors: List[Dict[str, Any]]

# Simulation Schemas
class ScenarioInjectionRequest(BaseModel):
    station_id: Optional[int] = None
    station_code: Optional[str] = None
    scenario: str = Field(..., description="normal, gradual_escalation, flash_flood, seismic_shock, dry_out")

class SimulationControlRequest(BaseModel):
    is_running: Optional[bool] = None
    interval_seconds: Optional[float] = Field(None, ge=0.5, le=30.0)

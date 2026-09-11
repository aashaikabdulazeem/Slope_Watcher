from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .connection import Base

def utc_now():
    return datetime.now(timezone.utc)

class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    location_name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation = Column(Float, nullable=False)  # in meters
    slope_angle_base = Column(Float, nullable=False)  # base slope in degrees
    warning_threshold = Column(Float, default=50.0)  # risk score threshold for Warning
    critical_threshold = Column(Float, default=75.0)  # risk score threshold for Critical
    status = Column(String(20), default="active")  # active, maintenance, offline
    scenario_mode = Column(String(50), default="normal")  # normal, gradual_escalation, flash_flood, seismic_shock, dry_out
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    readings = relationship("SensorReading", back_populates="station", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="station", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "location_name": self.location_name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "elevation": self.elevation,
            "slope_angle_base": self.slope_angle_base,
            "warning_threshold": self.warning_threshold,
            "critical_threshold": self.critical_threshold,
            "status": self.status,
            "scenario_mode": self.scenario_mode,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    rainfall = Column(Float, nullable=False)  # mm/h
    soil_moisture = Column(Float, nullable=False)  # % (0-100)
    slope_angle = Column(Float, nullable=False)  # degrees
    vibration = Column(Float, nullable=False)  # m/s^2 seismic vibration
    pore_water_pressure = Column(Float, nullable=False)  # kPa
    temperature = Column(Float, nullable=False)  # °C
    risk_score = Column(Float, nullable=False)  # 0 - 100
    risk_level = Column(String(20), nullable=False)  # Safe, Watch, Warning, Critical
    predicted_by = Column(String(50), default="ml_model_v1")

    station = relationship("Station", back_populates="readings")

    def to_dict(self):
        return {
            "id": self.id,
            "station_id": self.station_id,
            "station_code": self.station.code if self.station else None,
            "station_name": self.station.name if self.station else None,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "rainfall": round(self.rainfall, 2),
            "soil_moisture": round(self.soil_moisture, 2),
            "slope_angle": round(self.slope_angle, 2),
            "vibration": round(self.vibration, 3),
            "pore_water_pressure": round(self.pore_water_pressure, 2),
            "temperature": round(self.temperature, 1),
            "risk_score": round(self.risk_score, 1),
            "risk_level": self.risk_level,
            "predicted_by": self.predicted_by,
        }


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    risk_level = Column(String(20), nullable=False)  # Warning, Critical
    risk_score = Column(Float, nullable=False)
    trigger_factors = Column(Text, nullable=False)  # JSON or descriptive text
    recommended_action = Column(Text, nullable=False)
    status = Column(String(20), default="active")  # active, acknowledged, resolved
    notification_dispatched = Column(Boolean, default=False)
    dispatch_log = Column(Text, nullable=True)  # Mock SMS/Email record
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    station = relationship("Station", back_populates="alerts")

    def to_dict(self):
        return {
            "id": self.id,
            "station_id": self.station_id,
            "station_code": self.station.code if self.station else None,
            "station_name": self.station.name if self.station else None,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "risk_level": self.risk_level,
            "risk_score": round(self.risk_score, 1),
            "trigger_factors": self.trigger_factors,
            "recommended_action": self.recommended_action,
            "status": self.status,
            "notification_dispatched": self.notification_dispatched,
            "dispatch_log": self.dispatch_log,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }

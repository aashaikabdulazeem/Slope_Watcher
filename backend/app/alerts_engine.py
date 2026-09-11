from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from ..database.models import Station, SensorReading, Alert
from .mock_notifier import dispatch_emergency_alert

RECOMMENDED_ACTIONS = {
    "Critical": (
        "CRITICAL RED PROTOCOL: Mandatory evacuation of downhill hamlets & settlement clusters within 2.5 km. "
        "Sound local warning sirens. Suspend all traffic on mountain pass roads. "
        "Mobilize State Disaster Response Force (SDRF) & National Disaster Response Force (NDRF) rescue battalions."
    ),
    "Warning": (
        "ORANGE WARNING PROTOCOL: Put emergency shelters and primary health centres on high standby. "
        "Deploy quick-response geotechnical sensor inspection team. Issue advisory to avoid steep cutting slopes. "
        "Coordinate heavy earthmoving machinery to clear potential debris blockages."
    ),
    "Watch": (
        "YELLOW ADVISORY: Increase sensor polling frequency to high-alert mode. "
        "Alert local village revenue officers and forest guards to monitor surface runoffs and spring mud cloudiness."
    )
}

def evaluate_reading_for_alert(db: Session, station: Station, reading: SensorReading, ml_result: Dict[str, Any]) -> Optional[Alert]:
    """
    Evaluates whether a sensor reading and ML prediction warrant an automated tiered alert.
    Ensures smart deduplication: only creates new alert if no active alert exists for this station,
    or if the condition has escalated from Warning -> Critical.
    """
    risk_score = reading.risk_score
    risk_level = reading.risk_level

    # Check against station customized thresholds
    if risk_score >= station.critical_threshold:
        severity = "Critical"
    elif risk_score >= station.warning_threshold:
        severity = "Warning"
    else:
        # If risk dropped back to Safe/Watch, auto-resolve any older active alerts for this station!
        active_alerts = db.query(Alert).filter(
            Alert.station_id == station.id,
            Alert.status == "active"
        ).all()
        for active_alert in active_alerts:
            active_alert.status = "resolved"
            active_alert.resolved_at = datetime.now(timezone.utc)
        if active_alerts:
            db.commit()
        return None

    # Check for existing active alert for this station
    existing_alert = db.query(Alert).filter(
        Alert.station_id == station.id,
        Alert.status.in_(["active", "acknowledged"])
    ).order_by(Alert.id.desc()).first()

    # If an active alert already exists at the same or higher severity, avoid duplicate spamming
    if existing_alert:
        if existing_alert.risk_level == "Critical" and severity == "Critical":
            # Already in critical alert, do not re-alert every 3 seconds
            return None
        if existing_alert.risk_level == severity:
            # Same severity already active, don't spam
            return None
        # But if escalated from Warning -> Critical, mark old one resolved and create new Critical alert!
        if existing_alert.risk_level == "Warning" and severity == "Critical":
            existing_alert.status = "resolved"
            existing_alert.resolved_at = datetime.now(timezone.utc)

    # Format contributing factor breakdown
    factors_list = ml_result.get("contributing_factors", [])
    factor_strings = [
        f"[{f.get('severity', 'ELEVATED')}] {f.get('factor')}: {f.get('message')}"
        for f in factors_list
    ]
    formatted_factors = "\n".join(factor_strings) if factor_strings else (
        f"Multi-factor threshold exceeded: Risk Score {risk_score} crossed {severity} threshold."
    )

    action = RECOMMENDED_ACTIONS.get(severity, "Initiate standard geotechnical monitoring protocol.")

    # Dispatch mock SMS/Email
    dispatch_res = dispatch_emergency_alert(
        station_name=station.name,
        station_code=station.code,
        risk_level=severity,
        risk_score=risk_score,
        factors=formatted_factors,
        action=action
    )

    # Create new Alert in database
    new_alert = Alert(
        station_id=station.id,
        timestamp=datetime.now(timezone.utc),
        risk_level=severity,
        risk_score=risk_score,
        trigger_factors=formatted_factors,
        recommended_action=action,
        status="active",
        notification_dispatched=True,
        dispatch_log=dispatch_res.get("dispatch_log")
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return new_alert

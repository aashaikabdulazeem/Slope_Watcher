from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from ...database.connection import get_db
from ...database.models import Alert
from ..schemas import AlertResponse, AlertStatusUpdate

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[Dict[str, Any]])
def get_alerts(
    status: Optional[str] = Query(None, description="active, acknowledged, resolved, all"),
    station_id: Optional[int] = None,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if status and status != "all":
        query = query.filter(Alert.status == status)
    if station_id:
        query = query.filter(Alert.station_id == station_id)

    alerts = query.order_by(Alert.id.desc()).limit(limit).all()
    return [a.to_dict() for a in alerts]

@router.get("/summary", response_model=Dict[str, Any])
def get_alert_summary(db: Session = Depends(get_db)):
    active_count = db.query(Alert).filter(Alert.status == "active").count()
    critical_active = db.query(Alert).filter(
        Alert.status == "active",
        Alert.risk_level == "Critical"
    ).count()
    warning_active = db.query(Alert).filter(
        Alert.status == "active",
        Alert.risk_level == "Warning"
    ).count()
    total_count = db.query(Alert).count()

    return {
        "active_total": active_count,
        "critical_active": critical_active,
        "warning_active": warning_active,
        "total_historical": total_count
    }

@router.post("/{alert_id}/acknowledge", response_model=Dict[str, Any])
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "acknowledged"
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return {
        "success": True,
        "message": f"Alert #{alert.id} acknowledged.",
        "alert": alert.to_dict()
    }

@router.post("/{alert_id}/resolve", response_model=Dict[str, Any])
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "resolved"
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return {
        "success": True,
        "message": f"Alert #{alert.id} marked as resolved.",
        "alert": alert.to_dict()
    }

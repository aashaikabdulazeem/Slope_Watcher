import logging
from datetime import datetime, timezone
from typing import Dict, Any

logger = logging.getLogger("landslide_sentinel.notifier")

# Standard emergency stakeholder directory
EMERGENCY_RECIPIENTS = [
    {
        "role": "District Disaster Management Officer (DDMA)",
        "phone": "+91-98765-43210",
        "email": "ddma-alerts@disaster.gov.in"
    },
    {
        "role": "State Emergency Operations Centre (SEOC)",
        "phone": "+91-94470-11223",
        "email": "seoc.control@kerala.gov.in"
    },
    {
        "role": "Fire & Rescue Quick Response Team",
        "phone": "+91-94471-99887",
        "email": "fire-rescue-wayanad@kerala.gov.in"
    }
]

def dispatch_emergency_alert(station_name: str, station_code: str, risk_level: str, risk_score: float, factors: str, action: str) -> Dict[str, Any]:
    """
    Mock dispatcher for tiered emergency alerts via SMS & Email.
    In production, this swaps seamlessly with Twilio SMS and SendGrid API.
    """
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # SMS Format (concise, urgent)
    sms_body = (
        f"[SENTINEL ALERT - {risk_level.upper()}] {station_code} ({station_name}): "
        f"Risk Score {risk_score}/100. Action: {action[:100]}... Dispatched {timestamp}"
    )

    # Email Format (full geotechnical report)
    email_subject = f"URGENT: Landslide Risk {risk_level.upper()} - Station {station_code}"
    email_body = f"""
===================================================================
LANDSLIDE SENTINEL - EARLY WARNING DISPATCH
===================================================================
Severity Level : {risk_level.upper()}
Station Code   : {station_code}
Station Name   : {station_name}
Risk Index     : {risk_score} / 100.0
Timestamp      : {timestamp}

CRITICAL TRIGGER FACTORS:
{factors}

MANDATORY GEOTECHNICAL PROTOCOL:
{action}

RECIPIENT AGENCIES NOTIFIED:
- District Disaster Management Authority (DDMA)
- State Emergency Operations Centre (SEOC)
- District Police & Fire Force Command

[MOCK DISPATCH ENGINE: Swappable with Twilio SMS / SendGrid API]
===================================================================
"""

    # Log to server console / logger
    logger.warning(f"DISPATCHING EMERGENCY ALERT:\n{email_body}")

    # Build audit log entry
    dispatch_log = (
        f"[{timestamp}] Dispatched to {len(EMERGENCY_RECIPIENTS)} emergency agencies: "
        f"SMS sent to ({', '.join(r['phone'] for r in EMERGENCY_RECIPIENTS)}); "
        f"Email sent to ({', '.join(r['email'] for r in EMERGENCY_RECIPIENTS)})"
    )

    return {
        "success": True,
        "dispatched_at": timestamp,
        "sms_body": sms_body,
        "recipients_count": len(EMERGENCY_RECIPIENTS),
        "dispatch_log": dispatch_log
    }

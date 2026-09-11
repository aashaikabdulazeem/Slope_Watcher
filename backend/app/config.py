import os

class Settings:
    PROJECT_NAME: str = "LandSlide Sentinel"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    SIMULATION_INTERVAL_SECONDS: float = 3.0
    
    # MapTiler Free Tier key support (optional, falls back gracefully to OpenTopoMap + Esri Satellite)
    MAPTILER_API_KEY: str = os.getenv("MAPTILER_API_KEY", "")

    # Alert notification config
    ALERT_EMAIL_ENABLED: bool = os.getenv("ALERT_EMAIL_ENABLED", "false").lower() == "true"
    ALERT_SMS_ENABLED: bool = os.getenv("ALERT_SMS_ENABLED", "false").lower() == "true"

settings = Settings()

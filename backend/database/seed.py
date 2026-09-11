from datetime import datetime, timedelta, timezone
import random
from .connection import Base, engine, SessionLocal
from .models import Station, SensorReading, Alert

DEFAULT_STATIONS = [
    {
        "code": "STN-001",
        "name": "Anamudi Peak Ridge",
        "location_name": "High Range Sector A, Munnar/Idukki",
        "latitude": 10.1708,
        "longitude": 77.0645,
        "elevation": 1920.0,
        "slope_angle_base": 38.0,
        "warning_threshold": 55.0,
        "critical_threshold": 75.0,
        "status": "active",
        "scenario_mode": "normal"
    },
    {
        "code": "STN-002",
        "name": "Vellarimala Valley Slopes",
        "location_name": "Upper Chaliyar Basin, Wayanad",
        "latitude": 11.4552,
        "longitude": 76.1284,
        "elevation": 1420.0,
        "slope_angle_base": 34.0,
        "warning_threshold": 50.0,
        "critical_threshold": 75.0,
        "status": "active",
        "scenario_mode": "normal"
    },
    {
        "code": "STN-003",
        "name": "Meppadi Escarpment",
        "location_name": "Chooralmala-Meppadi Vulnerable Zone",
        "latitude": 11.5521,
        "longitude": 76.1259,
        "elevation": 1150.0,
        "slope_angle_base": 42.0,
        "warning_threshold": 50.0,
        "critical_threshold": 75.0,
        "status": "active",
        "scenario_mode": "gradual_escalation"  # Escalating demo station!
    },
    {
        "code": "STN-004",
        "name": "Chembra Peak Transect",
        "location_name": "South Wayanad Ridge, Kerala",
        "latitude": 11.5085,
        "longitude": 76.0883,
        "elevation": 1680.0,
        "slope_angle_base": 29.0,
        "warning_threshold": 55.0,
        "critical_threshold": 80.0,
        "status": "active",
        "scenario_mode": "normal"
    },
    {
        "code": "STN-005",
        "name": "Puthumala Crest",
        "location_name": "Tea Plantation Catchment, Wayanad",
        "latitude": 11.5230,
        "longitude": 76.1415,
        "elevation": 1050.0,
        "slope_angle_base": 36.0,
        "warning_threshold": 50.0,
        "critical_threshold": 75.0,
        "status": "active",
        "scenario_mode": "normal"
    },
    {
        "code": "STN-006",
        "name": "Banasura Foothill Outpost",
        "location_name": "Reservoir Catchment Zone, Wayanad",
        "latitude": 11.6667,
        "longitude": 75.9556,
        "elevation": 890.0,
        "slope_angle_base": 22.0,
        "warning_threshold": 60.0,
        "critical_threshold": 80.0,
        "status": "active",
        "scenario_mode": "normal"
    }
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if stations exist
        existing_count = db.query(Station).count()
        if existing_count == 0:
            print("Seeding stations...")
            station_objs = []
            for st_data in DEFAULT_STATIONS:
                station = Station(**st_data)
                db.add(station)
                station_objs.append(station)
            db.commit()

            # Refresh to get IDs
            for st in station_objs:
                db.refresh(st)

            # Generate 20 historical readings for each station over the past 2 hours
            print("Generating initial historical readings...")
            now = datetime.now(timezone.utc)
            for st in station_objs:
                for i in range(20, 0, -1):
                    reading_time = now - timedelta(minutes=i * 6)
                    # Baseline variance
                    base_rain = 2.0 + random.uniform(0, 4)
                    base_moist = 32.0 + random.uniform(0, 8)
                    base_slope = st.slope_angle_base + random.uniform(-0.3, 0.3)
                    base_vib = 0.08 + random.uniform(0, 0.06)
                    base_pwp = 4.0 + random.uniform(0, 3)
                    base_temp = 24.0 + random.uniform(-2, 2)
                    base_score = 15.0 + random.uniform(0, 10)

                    reading = SensorReading(
                        station_id=st.id,
                        timestamp=reading_time,
                        rainfall=round(base_rain, 2),
                        soil_moisture=round(base_moist, 2),
                        slope_angle=round(base_slope, 2),
                        vibration=round(base_vib, 3),
                        pore_water_pressure=round(base_pwp, 2),
                        temperature=round(base_temp, 1),
                        risk_score=round(base_score, 1),
                        risk_level="Safe",
                        predicted_by="ml_model_v1"
                    )
                    db.add(reading)
            db.commit()
            print("Initial stations and baseline readings successfully seeded.")
        else:
            print(f"Database already contains {existing_count} stations. Skipping seed.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

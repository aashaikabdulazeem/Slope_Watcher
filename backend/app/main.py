import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from ..database.connection import engine, Base, get_db, SessionLocal
from ..database.seed import seed_database
from ..database.models import Station, SensorReading, Alert
from .config import settings
from .websocket_manager import manager as ws_manager
from ..simulation.simulation_service import simulation_service
from .routes import stations, readings, alerts, ml, simulation

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("landslide_sentinel")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed DB
    logger.info("Initializing LandSlide Sentinel database and models...")
    Base.metadata.create_all(bind=engine)
    seed_database()

    # Initialize simulators and launch background simulation
    db = SessionLocal()
    try:
        simulation_service.initialize_simulators(db)
    finally:
        db.close()

    await simulation_service.start()
    logger.info("LandSlide Sentinel backend service is fully operational.")

    yield

    # Shutdown: Cleanly stop background tasks
    logger.info("Stopping simulation service...")
    await simulation_service.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Early Warning and Landslide Risk Monitoring System",
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev and cloud deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(stations.router, prefix=settings.API_V1_PREFIX)
app.include_router(readings.router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts.router, prefix=settings.API_V1_PREFIX)
app.include_router(ml.router, prefix=settings.API_V1_PREFIX)
app.include_router(simulation.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "simulation_running": simulation_service.is_running,
        "docs_url": "/docs",
        "websocket_url": "/ws"
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    db = SessionLocal()
    try:
        # Send initial snapshot immediately to the client
        stations_list = db.query(Station).all()
        station_payloads = []
        for st in stations_list:
            st_dict = st.to_dict()
            latest = simulation_service.latest_readings.get(st.id)
            if not latest:
                db_reading = db.query(SensorReading).filter(
                    SensorReading.station_id == st.id
                ).order_by(SensorReading.id.desc()).first()
                if db_reading:
                    latest = db_reading.to_dict()
            st_dict["latest_reading"] = latest
            station_payloads.append(st_dict)

        active_alerts = db.query(Alert).filter(Alert.status == "active").order_by(Alert.id.desc()).limit(10).all()

        initial_snapshot = {
            "type": "INITIAL_SNAPSHOT",
            "stations": station_payloads,
            "alerts": [a.to_dict() for a in active_alerts],
            "simulation_status": simulation_service.get_status()
        }
        await websocket.send_json(initial_snapshot)

        # Keep listening for client messages (e.g., ping)
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client session terminated: {e}")
        await ws_manager.disconnect(websocket)
    finally:
        db.close()

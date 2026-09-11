import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from ..database.connection import SessionLocal
from ..database.models import Station, SensorReading, Alert
from ..ml.predictor import predictor
from ..app.alerts_engine import evaluate_reading_for_alert
from ..app.websocket_manager import manager as ws_manager
from .sensor_generator import StationSensorSimulator

logger = logging.getLogger("landslide_sentinel.simulation")

class SimulationService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SimulationService, cls).__new__(cls)
            cls._instance.is_running = False
            cls._instance.interval_seconds = 3.0
            cls._instance.simulators: Dict[int, StationSensorSimulator] = {}
            cls._instance._task = None
            cls._instance.latest_readings: Dict[int, Dict[str, Any]] = {}
        return cls._instance

    def initialize_simulators(self, db: Session):
        stations = db.query(Station).all()
        for st in stations:
            if st.id not in self.simulators:
                sim = StationSensorSimulator(
                    station_id=st.id,
                    code=st.code,
                    slope_angle_base=st.slope_angle_base,
                    initial_mode=st.scenario_mode or "normal"
                )
                self.simulators[st.id] = sim
        logger.info(f"Initialized simulators for {len(self.simulators)} stations.")

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info("Simulation service background task started.")

    async def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("Simulation service stopped.")

    def set_interval(self, seconds: float):
        self.interval_seconds = max(0.5, min(30.0, seconds))
        logger.info(f"Simulation interval set to {self.interval_seconds}s")

    def set_station_scenario(self, db: Session, station_id: int, scenario: str) -> bool:
        station = db.query(Station).filter(Station.id == station_id).first()
        if not station:
            return False
        
        station.scenario_mode = scenario
        db.commit()

        if station_id in self.simulators:
            self.simulators[station_id].set_mode(scenario)
        else:
            sim = StationSensorSimulator(
                station_id=station.id,
                code=station.code,
                slope_angle_base=station.slope_angle_base,
                initial_mode=scenario
            )
            self.simulators[station_id] = sim

        logger.info(f"Set scenario '{scenario}' on station {station.code} ({station.name})")
        return True

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_running": self.is_running,
            "interval_seconds": self.interval_seconds,
            "active_simulators_count": len(self.simulators),
            "simulators": {
                st_id: {
                    "code": sim.code,
                    "mode": sim.scenario_mode,
                    "ticks": sim.tick_count
                }
                for st_id, sim in self.simulators.items()
            }
        }

    async def _run_loop(self):
        while self.is_running:
            try:
                await self._tick()
            except Exception as e:
                logger.error(f"Error during simulation tick: {e}", exc_info=True)
            
            await asyncio.sleep(self.interval_seconds)

    async def _tick(self):
        db = SessionLocal()
        try:
            stations = db.query(Station).filter(Station.status == "active").all()
            if not stations:
                return

            # Ensure simulators exist
            for st in stations:
                if st.id not in self.simulators:
                    self.simulators[st.id] = StationSensorSimulator(
                        station_id=st.id,
                        code=st.code,
                        slope_angle_base=st.slope_angle_base,
                        initial_mode=st.scenario_mode or "normal"
                    )

            now_utc = datetime.now(timezone.utc)
            updated_station_payloads = []
            alerts_triggered = []

            for st in stations:
                sim = self.simulators[st.id]
                sensor_vals = sim.step()

                # ML Risk Prediction
                pred_result = predictor.predict(sensor_vals)
                risk_score = pred_result["risk_score"]
                risk_level = pred_result["risk_level"]

                # Persist SensorReading
                reading = SensorReading(
                    station_id=st.id,
                    timestamp=now_utc,
                    rainfall=sensor_vals["rainfall"],
                    soil_moisture=sensor_vals["soil_moisture"],
                    slope_angle=sensor_vals["slope_angle"],
                    vibration=sensor_vals["vibration"],
                    pore_water_pressure=sensor_vals["pore_water_pressure"],
                    temperature=sensor_vals["temperature"],
                    risk_score=risk_score,
                    risk_level=risk_level,
                    predicted_by="RandomForest_v1"
                )
                db.add(reading)
                db.flush()

                # Store latest reading in memory cache
                reading_dict = reading.to_dict()
                reading_dict["probabilities"] = pred_result["probabilities"]
                reading_dict["contributing_factors"] = pred_result["contributing_factors"]
                self.latest_readings[st.id] = reading_dict

                # Check Alert Engine
                new_alert = evaluate_reading_for_alert(db, st, reading, pred_result)
                if new_alert:
                    alerts_triggered.append(new_alert.to_dict())

                # Station summary for frontend
                st_payload = st.to_dict()
                st_payload["latest_reading"] = reading_dict
                st_payload["scenario_mode"] = sim.scenario_mode
                updated_station_payloads.append(st_payload)

            db.commit()

            # Broadcast via WebSocket
            ws_message = {
                "type": "SIMULATION_UPDATE",
                "timestamp": now_utc.isoformat(),
                "stations": updated_station_payloads,
                "alerts": alerts_triggered
            }
            await ws_manager.broadcast(ws_message)

        except Exception as e:
            db.rollback()
            logger.error(f"Simulation tick failed: {e}", exc_info=True)
        finally:
            db.close()

simulation_service = SimulationService()

import random
import math
from typing import Dict, Any

class StationSensorSimulator:
    def __init__(self, station_id: int, code: str, slope_angle_base: float, initial_mode: str = "normal"):
        self.station_id = station_id
        self.code = code
        self.slope_angle_base = slope_angle_base
        self.scenario_mode = initial_mode
        self.tick_count = 0

        # State variables
        self.rainfall = 2.0 + random.uniform(0, 3)
        self.soil_moisture = 34.0 + random.uniform(0, 5)
        self.slope_angle = slope_angle_base + random.uniform(-0.2, 0.2)
        self.vibration = 0.08 + random.uniform(0, 0.04)
        self.pore_water_pressure = 4.0 + random.uniform(0, 2)
        self.temperature = 24.5 + random.uniform(-1, 1)

    def set_mode(self, mode: str):
        self.scenario_mode = mode
        self.tick_count = 0

    def step(self) -> Dict[str, float]:
        self.tick_count += 1
        mode = self.scenario_mode

        if mode == "normal":
            # Calm weather, minor random fluctuation
            target_rain = max(0.0, 3.0 + random.uniform(-2, 3))
            self.rainfall += (target_rain - self.rainfall) * 0.2
            
            # Moisture drifts towards 35%
            target_moist = 35.0 + random.uniform(-2, 2)
            self.soil_moisture += (target_moist - self.soil_moisture) * 0.1
            
            # Pore water pressure drifts towards 4 kPa
            target_pwp = 4.0 + (self.soil_moisture - 30) * 0.1
            self.pore_water_pressure += (target_pwp - self.pore_water_pressure) * 0.15

            # Vibration is ambient noise
            self.vibration = max(0.02, 0.08 + random.uniform(-0.03, 0.05))

            # Slope stable
            self.slope_angle = self.slope_angle_base + random.uniform(-0.1, 0.1)

            # Temp
            self.temperature = 24.0 + random.uniform(-0.5, 0.5)

        elif mode == "gradual_escalation":
            # 60 ticks escalation lifecycle (~3-4 minutes demo)
            # Cycle every 80 ticks so it can loop naturally
            cycle_tick = self.tick_count % 85

            if cycle_tick < 15:
                # Stage 1: Safe -> Rain starts picking up (5 to 30 mm/h)
                progress = cycle_tick / 15.0
                self.rainfall = 5.0 + progress * 25.0 + random.uniform(-2, 3)
                self.soil_moisture += 0.9 + random.uniform(-0.2, 0.3)
                self.pore_water_pressure += 0.4 + random.uniform(0, 0.2)
                self.vibration = 0.12 + random.uniform(-0.02, 0.04)

            elif cycle_tick < 35:
                # Stage 2: Watch -> Heavy downpour (30 to 70 mm/h), soil saturating
                progress = (cycle_tick - 15) / 20.0
                self.rainfall = 30.0 + progress * 40.0 + random.uniform(-3, 4)
                self.soil_moisture += 1.1 + random.uniform(-0.2, 0.4)
                self.pore_water_pressure += 0.8 + random.uniform(0, 0.3)
                self.vibration = 0.25 + random.uniform(-0.05, 0.08)

            elif cycle_tick < 55:
                # Stage 3: Warning -> Torrential rain (70 to 110 mm/h), liquefaction begins
                progress = (cycle_tick - 35) / 20.0
                self.rainfall = 70.0 + progress * 40.0 + random.uniform(-4, 6)
                self.soil_moisture = min(96.0, self.soil_moisture + 0.8)
                self.pore_water_pressure += 1.1 + random.uniform(0, 0.4)
                self.vibration = 0.65 + progress * 0.7 + random.uniform(-0.1, 0.15)
                # Slight creep in slope
                self.slope_angle = self.slope_angle_base + progress * 1.5 + random.uniform(-0.1, 0.1)

            elif cycle_tick < 75:
                # Stage 4: Critical -> Severe cloudburst, seismic creep, peak failure probability
                self.rainfall = 115.0 + random.uniform(-5, 10)
                self.soil_moisture = min(98.0, 93.0 + random.uniform(0, 4))
                self.pore_water_pressure = min(62.0, 48.0 + random.uniform(-2, 5))
                self.vibration = 2.1 + random.uniform(-0.3, 0.6)
                self.slope_angle = self.slope_angle_base + 2.2 + random.uniform(-0.2, 0.2)

            else:
                # Stage 5: Rain eases slightly, begins receding towards normal
                self.rainfall = max(10.0, self.rainfall - 15.0)
                self.soil_moisture = max(40.0, self.soil_moisture - 5.0)
                self.pore_water_pressure = max(8.0, self.pore_water_pressure - 4.0)
                self.vibration = max(0.1, self.vibration - 0.3)
                self.slope_angle = self.slope_angle_base

        elif mode == "flash_flood":
            # Immediate torrential rainstorm
            self.rainfall = min(160.0, max(85.0, self.rainfall + 15.0 + random.uniform(-5, 10)))
            self.soil_moisture = min(97.0, self.soil_moisture + 3.5)
            self.pore_water_pressure = min(58.0, self.pore_water_pressure + 3.0)
            self.vibration = max(0.4, 0.7 + random.uniform(-0.1, 0.3))
            self.temperature = max(18.0, self.temperature - 0.3)

        elif mode == "seismic_shock":
            # Strong earth tremor
            self.vibration = min(5.5, max(2.5, self.vibration + random.uniform(1.5, 3.0)))
            # Vibrations cause instantaneous pore pressure pulse & shear creep
            self.pore_water_pressure = min(55.0, self.pore_water_pressure + 4.0)
            self.slope_angle = self.slope_angle_base + random.uniform(0.5, 2.5)

        elif mode == "dry_out":
            # Rain ceases, drainage occurs
            self.rainfall = max(0.0, self.rainfall - 8.0)
            self.soil_moisture = max(25.0, self.soil_moisture - 4.0)
            self.pore_water_pressure = max(2.0, self.pore_water_pressure - 3.5)
            self.vibration = max(0.05, self.vibration - 0.2)
            self.slope_angle = self.slope_angle_base
            self.temperature = min(28.0, self.temperature + 0.3)

            # Auto reset to normal once dried
            if self.rainfall <= 1.0 and self.soil_moisture <= 32.0:
                self.scenario_mode = "normal"

        # Apply global safety bounds
        self.rainfall = round(max(0.0, min(200.0, self.rainfall)), 2)
        self.soil_moisture = round(max(10.0, min(100.0, self.soil_moisture)), 2)
        self.slope_angle = round(max(10.0, min(65.0, self.slope_angle)), 2)
        self.vibration = round(max(0.01, min(6.0, self.vibration)), 3)
        self.pore_water_pressure = round(max(0.0, min(70.0, self.pore_water_pressure)), 2)
        self.temperature = round(max(10.0, min(42.0, self.temperature)), 1)

        return {
            "rainfall": self.rainfall,
            "soil_moisture": self.soil_moisture,
            "slope_angle": self.slope_angle,
            "vibration": self.vibration,
            "pore_water_pressure": self.pore_water_pressure,
            "temperature": self.temperature
        }

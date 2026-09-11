import sys
import os

# Test ML predictor
from backend.ml.predictor import predictor

print("Testing ML predictor...")
safe_sample = {
    "rainfall": 2.5,
    "soil_moisture": 30.0,
    "slope_angle": 22.0,
    "vibration": 0.05,
    "pore_water_pressure": 3.0,
    "temperature": 25.0
}
safe_pred = predictor.predict(safe_sample)
print("Safe sample prediction:", safe_pred["risk_level"], f"(Score: {safe_pred['risk_score']})")
assert safe_pred["risk_level"] in ["Safe", "Watch"], f"Expected Safe/Watch, got {safe_pred['risk_level']}"

critical_sample = {
    "rainfall": 125.0,
    "soil_moisture": 94.0,
    "slope_angle": 44.0,
    "vibration": 2.8,
    "pore_water_pressure": 52.0,
    "temperature": 21.0
}
crit_pred = predictor.predict(critical_sample)
print("Critical sample prediction:", crit_pred["risk_level"], f"(Score: {crit_pred['risk_score']})")
print("Contributing factors:", [f["factor"] for f in crit_pred["contributing_factors"]])
assert crit_pred["risk_level"] == "Critical", f"Expected Critical, got {crit_pred['risk_level']}"

# Test Simulation step
from backend.simulation.sensor_generator import StationSensorSimulator
sim = StationSensorSimulator(1, "TEST-01", 35.0, "normal")
step1 = sim.step()
print("Simulation step output:", step1)
assert "rainfall" in step1 and "soil_moisture" in step1

# Test FastAPI app instantiation
from backend.app.main import app
openapi_paths = list(app.openapi()["paths"].keys())
print("OpenAPI paths registered:", openapi_paths)
assert any("/api/stations" in p for p in openapi_paths), "Missing /api/stations"
assert any("/api/readings" in p for p in openapi_paths), "Missing /api/readings"
assert any("/api/alerts" in p for p in openapi_paths), "Missing /api/alerts"
assert any("/api/ml/predict" in p for p in openapi_paths), "Missing /api/ml/predict"

print("\nALL BACKEND TESTS PASSED SUCCESSFULLY!")

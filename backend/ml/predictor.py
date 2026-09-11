import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "landslide_model.joblib")
METADATA_PATH = os.path.join(SAVED_MODELS_DIR, "model_metadata.json")

# Normal baseline sensor reference values for anomaly/contribution detection
NORMAL_BASELINES = {
    "rainfall": 5.0,        # mm/h
    "soil_moisture": 35.0,  # %
    "slope_angle": 25.0,    # degrees
    "vibration": 0.15,      # m/s^2
    "pore_water_pressure": 5.0, # kPa
    "temperature": 24.0     # °C
}

class LandslidePredictor:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LandslidePredictor, cls).__new__(cls)
            cls._instance._model_payload = None
            cls._instance._metadata = None
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        if not os.path.exists(MODEL_PATH):
            print("Model artifact not found. Training model now...")
            from .train import train_model
            train_model()

        try:
            self._model_payload = joblib.load(MODEL_PATH)
            if os.path.exists(METADATA_PATH):
                with open(METADATA_PATH, "r") as f:
                    self._metadata = json.load(f)
            print("ML model successfully loaded into memory.")
        except Exception as e:
            print(f"Error loading model: {e}")
            raise e

    def reload(self):
        self._load_model()

    def get_metadata(self) -> Dict[str, Any]:
        if self._metadata is None and os.path.exists(METADATA_PATH):
            with open(METADATA_PATH, "r") as f:
                self._metadata = json.load(f)
        return self._metadata or {}

    def predict(self, reading: Dict[str, float]) -> Dict[str, Any]:
        if self._model_payload is None:
            self._load_model()

        feature_names = self._model_payload["feature_names"]
        clf = self._model_payload["classifier"]
        reg = self._model_payload["regressor"]

        row = [reading.get(k, NORMAL_BASELINES.get(k, 0.0)) for k in feature_names]
        X = pd.DataFrame([row], columns=feature_names)

        # Risk category prediction & probabilities
        pred_class = clf.predict(X)[0]
        class_probs = clf.predict_proba(X)[0]
        prob_dict = {cls_name: round(float(prob), 4) for cls_name, prob in zip(clf.classes_, class_probs)}

        # Continuous score prediction
        pred_score = float(reg.predict(X)[0])
        pred_score = max(0.0, min(100.0, pred_score))

        # Enforce consistency between score and class
        # (e.g. if score > 80, ensure category is Critical)
        if pred_score >= 80.0:
            pred_class = "Critical"
        elif pred_score >= 60.0 and pred_class == "Safe":
            pred_class = "Warning"
        elif pred_score < 35.0 and pred_class in ("Warning", "Critical"):
            pred_class = "Safe"

        # Calculate contributing factors for explainability
        contributing_factors = self._calculate_contributions(reading)

        return {
            "risk_score": round(pred_score, 1),
            "risk_level": pred_class,
            "probabilities": prob_dict,
            "contributing_factors": contributing_factors
        }

    def _calculate_contributions(self, reading: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Determines which sensors are deviating most severely from safe thresholds.
        """
        factors = []
        
        rain = reading.get("rainfall", 0.0)
        moist = reading.get("soil_moisture", 0.0)
        pwp = reading.get("pore_water_pressure", 0.0)
        slope = reading.get("slope_angle", 0.0)
        vib = reading.get("vibration", 0.0)

        # Rainfall evaluation
        if rain >= 60.0:
            factors.append({
                "factor": "Rainfall Rate",
                "severity": "CRITICAL",
                "value": f"{round(rain, 1)} mm/h",
                "message": f"Extreme torrential cloudburst ({round(rain, 1)} mm/h), +{int((rain/NORMAL_BASELINES['rainfall'] - 1)*100)}% above baseline"
            })
        elif rain >= 25.0:
            factors.append({
                "factor": "Rainfall Rate",
                "severity": "ELEVATED",
                "value": f"{round(rain, 1)} mm/h",
                "message": f"Heavy continuous precipitation ({round(rain, 1)} mm/h)"
            })

        # Soil moisture evaluation
        if moist >= 85.0:
            factors.append({
                "factor": "Soil Saturation",
                "severity": "CRITICAL",
                "value": f"{round(moist, 1)}%",
                "message": f"Critical soil liquefaction zone reached ({round(moist, 1)}% saturation)"
            })
        elif moist >= 65.0:
            factors.append({
                "factor": "Soil Saturation",
                "severity": "ELEVATED",
                "value": f"{round(moist, 1)}%",
                "message": f"Elevated ground moisture ({round(moist, 1)}%) reducing internal friction"
            })

        # Pore Water Pressure evaluation
        if pwp >= 35.0:
            factors.append({
                "factor": "Pore Water Pressure",
                "severity": "CRITICAL",
                "value": f"{round(pwp, 1)} kPa",
                "message": f"Severe hydraulic upward pressure ({round(pwp, 1)} kPa) cancelling effective shear stress"
            })
        elif pwp >= 20.0:
            factors.append({
                "factor": "Pore Water Pressure",
                "severity": "ELEVATED",
                "value": f"{round(pwp, 1)} kPa",
                "message": f"Rising interstitial groundwater pressure ({round(pwp, 1)} kPa)"
            })

        # Seismic / Vibration evaluation
        if vib >= 1.5:
            factors.append({
                "factor": "Seismic Vibration",
                "severity": "CRITICAL",
                "value": f"{round(vib, 2)} m/s²",
                "message": f"Strong ground tremors/vibration ({round(vib, 2)} m/s²), triggering dynamic slope acceleration"
            })
        elif vib >= 0.6:
            factors.append({
                "factor": "Seismic Vibration",
                "severity": "ELEVATED",
                "value": f"{round(vib, 2)} m/s²",
                "message": f"Micro-tremors detected on bedrock ({round(vib, 2)} m/s²)"
            })

        # Slope steepness evaluation
        if slope >= 38.0:
            factors.append({
                "factor": "Topographic Slope",
                "severity": "HIGH VULNERABILITY",
                "value": f"{round(slope, 1)}°",
                "message": f"Steep escarpment inclination ({round(slope, 1)}°) exceeds angle of repose"
            })

        # Fallback if everything is nominal
        if not factors:
            factors.append({
                "factor": "All Sensors",
                "severity": "NORMAL",
                "value": "Nominal",
                "message": "All sensor readings remain within calibrated baseline safe limits."
            })

        return factors

predictor = LandslidePredictor()

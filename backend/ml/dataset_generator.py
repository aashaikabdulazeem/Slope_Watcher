import numpy as np
import pandas as pd
import os

FEATURE_NAMES = [
    "rainfall",
    "soil_moisture",
    "slope_angle",
    "vibration",
    "pore_water_pressure",
    "temperature"
]

def calculate_physics_risk(rainfall, soil_moisture, slope_angle, vibration, pore_water_pressure, temperature):
    """
    Computes a continuous geotechnical risk score (0 to 100) based on
    Mohr-Coulomb failure mechanics, hydraulic saturation, and seismic triggers.
    """
    # 1. Slope angle factor (15° is stable, 45°+ is critically steep)
    # Normalized slope factor from 0 to 1
    slope_norm = np.clip((slope_angle - 15) / 35.0, 0.0, 1.2)
    slope_weight = np.power(slope_norm, 1.3)

    # 2. Hydraulic factor (Rainfall + Soil Moisture + Pore Water Pressure)
    # Rainfall saturation rate
    rain_norm = np.clip(rainfall / 100.0, 0.0, 1.5)
    
    # Soil moisture threshold effect (dramatic increase above 70% saturation)
    moisture_norm = np.clip((soil_moisture - 20) / 80.0, 0.0, 1.0)
    moisture_weight = np.where(soil_moisture > 75, 1.0 + (soil_moisture - 75) * 0.03, moisture_norm)

    # Pore water pressure reduces effective stress (0 kPa = dry, 50+ kPa = critical liquefaction)
    pwp_norm = np.clip(pore_water_pressure / 50.0, 0.0, 1.5)

    # Combined hydraulic saturation score
    hydraulic_factor = 0.35 * rain_norm + 0.35 * moisture_weight + 0.30 * pwp_norm

    # 3. Dynamic seismic vibration trigger (0 to 4 m/s^2)
    vibration_norm = np.clip(vibration / 3.0, 0.0, 1.5)

    # 4. Multi-factor interaction:
    # A flat slope rarely fails regardless of rain, but a steep wet slope fails easily.
    # Base risk combines hydraulic loading scaled by slope vulnerability
    base_risk = 58.0 * (hydraulic_factor * (0.3 + 0.7 * slope_weight))
    
    # Direct slope steepness contribution
    slope_contrib = 18.0 * slope_norm

    # Vibration destabilizing contribution (multiplies if slope is already wet/steep)
    vib_contrib = 16.0 * vibration_norm * (0.5 + 0.5 * hydraulic_factor)

    # Temperature influence: high heat with high rain/moisture creates tropical monsoon instability
    temp_contrib = np.where(
        (temperature > 28) & (rainfall > 30), 
        4.0, 
        np.where(temperature < 15, -2.0, 0.0)
    )

    # Sum total score with saturation ceiling and floor
    total_score = base_risk + slope_contrib + vib_contrib + temp_contrib
    total_score = np.clip(total_score, 0.0, 100.0)
    return total_score

def determine_risk_category(risk_score):
    if risk_score < 35.0:
        return "Safe"
    elif risk_score < 60.0:
        return "Watch"
    elif risk_score < 80.0:
        return "Warning"
    else:
        return "Critical"

def generate_synthetic_dataset(n_samples=10000, random_seed=42):
    """
    Generates a realistic synthetic dataset of sensor readings and labels
    spanning normal conditions, seasonal monsoons, and extreme disaster events.
    """
    np.random.seed(random_seed)

    # 1. Generate realistic multi-regime distributions:
    # Regime 1: Calm/Normal conditions (50%)
    # Regime 2: Monsoon/Moderate rain conditions (25%)
    # Regime 3: High-risk torrential rain & steep terrain (15%)
    # Regime 4: Extreme critical conditions with seismic tremors (10%)

    n_calm = int(n_samples * 0.50)
    n_monsoon = int(n_samples * 0.25)
    n_high = int(n_samples * 0.15)
    n_critical = n_samples - n_calm - n_monsoon - n_high

    # Calm regime
    rain_calm = np.random.exponential(scale=5.0, size=n_calm)
    moist_calm = np.random.normal(loc=35.0, scale=10.0, size=n_calm)
    slope_calm = np.random.uniform(15.0, 48.0, size=n_calm)
    vib_calm = np.random.exponential(scale=0.15, size=n_calm)
    pwp_calm = np.random.exponential(scale=4.0, size=n_calm)
    temp_calm = np.random.normal(loc=26.0, scale=4.0, size=n_calm)

    # Monsoon regime
    rain_monsoon = np.random.normal(loc=35.0, scale=15.0, size=n_monsoon)
    moist_monsoon = np.random.normal(loc=65.0, scale=8.0, size=n_monsoon)
    slope_monsoon = np.random.uniform(20.0, 50.0, size=n_monsoon)
    vib_monsoon = np.random.exponential(scale=0.35, size=n_monsoon)
    pwp_monsoon = np.random.normal(loc=18.0, scale=6.0, size=n_monsoon)
    temp_monsoon = np.random.normal(loc=23.0, scale=3.0, size=n_monsoon)

    # High risk regime
    rain_high = np.random.normal(loc=70.0, scale=20.0, size=n_high)
    moist_high = np.random.normal(loc=82.0, scale=6.0, size=n_high)
    slope_high = np.random.uniform(30.0, 52.0, size=n_high)
    vib_high = np.random.exponential(scale=0.8, size=n_high)
    pwp_high = np.random.normal(loc=32.0, scale=7.0, size=n_high)
    temp_high = np.random.normal(loc=22.0, scale=3.0, size=n_high)

    # Critical regime
    rain_crit = np.random.normal(loc=110.0, scale=25.0, size=n_critical)
    moist_crit = np.random.normal(loc=93.0, scale=4.0, size=n_critical)
    slope_crit = np.random.uniform(35.0, 55.0, size=n_critical)
    vib_crit = np.random.normal(loc=2.2, scale=0.8, size=n_critical)
    pwp_crit = np.random.normal(loc=46.0, scale=6.0, size=n_critical)
    temp_crit = np.random.normal(loc=21.0, scale=3.0, size=n_critical)

    # Concatenate regimes
    rainfall = np.concatenate([rain_calm, rain_monsoon, rain_high, rain_crit])
    soil_moisture = np.concatenate([moist_calm, moist_monsoon, moist_high, moist_crit])
    slope_angle = np.concatenate([slope_calm, slope_monsoon, slope_high, slope_crit])
    vibration = np.concatenate([vib_calm, vib_monsoon, vib_high, vib_crit])
    pore_water_pressure = np.concatenate([pwp_calm, pwp_monsoon, pwp_high, pwp_crit])
    temperature = np.concatenate([temp_calm, temp_monsoon, temp_high, temp_crit])

    # Clip values to physically realistic ranges
    rainfall = np.clip(rainfall, 0.0, 200.0)
    soil_moisture = np.clip(soil_moisture, 10.0, 100.0)
    slope_angle = np.clip(slope_angle, 10.0, 55.0)
    vibration = np.clip(vibration, 0.01, 6.0)
    pore_water_pressure = np.clip(pore_water_pressure, 0.0, 65.0)
    temperature = np.clip(temperature, 12.0, 40.0)

    # Calculate true geotechnical risk score
    risk_scores = calculate_physics_risk(
        rainfall, soil_moisture, slope_angle, vibration, pore_water_pressure, temperature
    )

    # Add realistic sensor noise (±3 points)
    noise = np.random.normal(0.0, 2.5, size=n_samples)
    risk_scores = np.clip(risk_scores + noise, 0.0, 100.0)

    # Determine discrete category
    categories = [determine_risk_category(score) for score in risk_scores]

    df = pd.DataFrame({
        "rainfall": np.round(rainfall, 2),
        "soil_moisture": np.round(soil_moisture, 2),
        "slope_angle": np.round(slope_angle, 2),
        "vibration": np.round(vibration, 3),
        "pore_water_pressure": np.round(pore_water_pressure, 2),
        "temperature": np.round(temperature, 1),
        "risk_score": np.round(risk_scores, 1),
        "risk_level": categories
    })

    return df

if __name__ == "__main__":
    df = generate_synthetic_dataset(10000)
    out_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(out_dir, "synthetic_landslide_dataset.csv")
    df.to_csv(csv_path, index=False)
    print(f"Generated {len(df)} synthetic samples at {csv_path}")
    print("\nClass distribution:")
    print(df["risk_level"].value_counts())
    print("\nFeature Summary:")
    print(df.describe().round(2))

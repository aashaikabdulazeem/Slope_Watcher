import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, r2_score, mean_squared_error
try:
    from .dataset_generator import generate_synthetic_dataset, FEATURE_NAMES
except ImportError:
    from dataset_generator import generate_synthetic_dataset, FEATURE_NAMES

def train_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    saved_models_dir = os.path.join(base_dir, "saved_models")
    os.makedirs(saved_models_dir, exist_ok=True)

    print("Step 1: Generating synthetic geotechnical dataset (10,000 samples)...")
    df = generate_synthetic_dataset(n_samples=10000, random_seed=42)
    csv_path = os.path.join(base_dir, "synthetic_landslide_dataset.csv")
    df.to_csv(csv_path, index=False)
    print(f"Dataset saved to {csv_path}")

    X = df[FEATURE_NAMES]
    y_cat = df["risk_level"]
    y_score = df["risk_score"]

    X_train, X_test, y_cat_train, y_cat_test, y_score_train, y_score_test = train_test_split(
        X, y_cat, y_score, test_size=0.2, random_state=42, stratify=y_cat
    )

    print("Step 2: Training Random Forest Risk Classifier...")
    clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=14,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train, y_cat_train)

    print("Step 3: Training Gradient Boosting Score Regressor...")
    reg = GradientBoostingRegressor(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42
    )
    reg.fit(X_train, y_score_train)

    # Predictions & Evaluations
    y_cat_pred = clf.predict(X_test)
    y_score_pred = reg.predict(X_test)

    acc = float(accuracy_score(y_cat_test, y_cat_pred))
    report = classification_report(y_cat_test, y_cat_pred, output_dict=True)
    labels = ["Safe", "Watch", "Warning", "Critical"]
    cm = confusion_matrix(y_cat_test, y_cat_pred, labels=labels).tolist()

    r2 = float(r2_score(y_score_test, y_score_pred))
    rmse = float(np.sqrt(mean_squared_error(y_score_test, y_score_pred)))

    # Feature Importances (Classifier)
    raw_importances = clf.feature_importances_
    feature_importances = [
        {"feature": feat, "importance": round(float(imp) * 100, 2)}
        for feat, imp in zip(FEATURE_NAMES, raw_importances)
    ]
    feature_importances.sort(key=lambda x: x["importance"], reverse=True)

    print(f"\n--- Model Training Results ---")
    print(f"Classification Accuracy: {acc * 100:.2f}%")
    print(f"Continuous Score R2:     {r2:.4f}, RMSE: {rmse:.2f}")
    print("\nFeature Importances:")
    for f in feature_importances:
        print(f"  {f['feature']:<20}: {f['importance']:.2f}%")

    # Packaging Model Pipeline
    model_payload = {
        "classifier": clf,
        "regressor": reg,
        "feature_names": FEATURE_NAMES,
        "classes": clf.classes_.tolist()
    }

    model_path = os.path.join(saved_models_dir, "landslide_model.joblib")
    joblib.dump(model_payload, model_path)
    print(f"\nSaved model payload to {model_path}")

    # Metadata for API & Frontend
    metadata = {
        "model_type": "Random Forest Classifier + Gradient Boosting Regressor",
        "training_samples": len(df),
        "test_samples": len(X_test),
        "features": FEATURE_NAMES,
        "accuracy": round(acc, 4),
        "r2_score": round(r2, 4),
        "rmse": round(rmse, 2),
        "classification_report": report,
        "confusion_matrix": {
            "labels": labels,
            "matrix": cm
        },
        "feature_importances": feature_importances,
        "classes": labels
    }

    metadata_path = os.path.join(saved_models_dir, "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved model metadata to {metadata_path}")

    return metadata

if __name__ == "__main__":
    train_model()

# LandSlide Sentinel 🏔️

**AI-Based Early Warning & Landslide Risk Monitoring System**

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-teal.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.2-purple.svg)](https://vitejs.dev/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4%2B-orange.svg)](https://scikit-learn.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An end-to-end full-stack web application designed for real-time landslide risk monitoring, early disaster warnings, and geotechnical hazard mitigation. The system simulates IoT sensor stations deployed across landslide-prone mountainous slopes, predicts multi-factor geotechnical risk using a trained machine learning model, exposes real-time telemetry over REST and WebSockets, and provides an interactive command center dashboard with terrain hillshading, sensor trend charts, automated tiered alerts, and an admin scenario injector.

---

## 📌 Table of Contents

- [System Architecture](#system-architecture)
- [How the System Works](#how-the-system-works)
- [Tech Stack](#tech-stack)
- [Geotechnical Physics & ML Model](#geotechnical-physics--ml-model)
- [Core Features](#core-features)
- [Project Structure](#project-structure)
- [Local Installation & Setup](#local-installation--setup)
- [Running the Application](#running-the-application)
- [API & WebSocket Documentation](#api--websocket-documentation)
- [Deployment Guide (Render & Vercel)](#deployment-guide-render--vercel)

---

## 🏗️ System Architecture

```
                                  [IoT Sensor Stations]
                         (Simulated 6 Geotechnical Stations)
                   Rainfall, Soil Moisture, Slope, Vibration, PWP, Temp
                                            │
                                            ▼ (Async background loop: 3s tick)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FASTAPI BACKEND SERVICE                                │
│                                                                                        │
│  ┌─────────────────────────┐   ┌──────────────────────────┐   ┌─────────────────────┐  │
│  │   Geotechnical ML Model │   │     SQLite Database      │   │  Alert Evaluation   │  │
│  │  (Random Forest & GBDT) │   │ (SQLAlchemy ORM Models)  │   │       Engine        │  │
│  │  • 94.85% Accuracy      │   │ • Stations               │   │ • Smart Deduplic.   │  │
│  │  • Multi-Factor Risk    │   │ • SensorReadings History │   │ • Factor Attribution│  │
│  │  • 0-100 Score + Class  │   │ • Tiered Alerts & Logs   │   │ • Action Protocol   │  │
│  └───────────┬─────────────┘   └────────────┬─────────────┘   └──────────┬──────────┘  │
│              │                              │                            │             │
│              └──────────────────────┬───────┴────────────────────────────┘             │
│                                     ▼                                                  │
│                     REST API & WebSocket Broadcast Manager                             │
└─────────────────────────────────────┬──────────────────────────────────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼ (REST Endpoints)                              ▼ (Bi-directional WebSocket /ws)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              REACT + VITE FRONTEND DASHBOARD                           │
│                                                                                        │
│  ┌────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │    Station Cards       │  │   Interactive Terrain   │  │   Multi-Sensor Recharts │  │
│  │ • Risk gauges (0-100)  │  │        Leaflet Map      │  │ • Risk vs Thresholds    │  │
│  │ • 6 sensor indicators  │  │ • Hillshading relief    │  │ • Rainfall vs Moisture  │  │
│  │ • Scenario injection   │  │ • Satellite layer toggle│  │ • PWP vs Vibration      │  │
│  └────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────┐  ┌─────────────────────────┐  │
│  │                 Alert & Incident Feed               │  │   Admin & ML Playground │  │
│  │ • Acknowledge / Resolve state                       │  │ • Custom station limits │  │
│  │ • SMS & Email emergency dispatch receipts           │  │ • Interactive inference │  │
│  │ • Contributing risk factor breakdown                │  │ • Retrain & diagnostics │  │
│  └─────────────────────────────────────────────────────┘  └─────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ How the System Works

1. **Sensor Simulation Engine**: 6 geotechnical monitoring stations in the mountainous Western Ghats (Wayanad / Idukki) continuously generate correlated time-series readings:
   - **Rainfall intensity** ($mm/h$)
   - **Volumetric soil moisture** ($\%$)
   - **Slope inclination angle** ($^\circ$)
   - **Bedrock ground vibration / seismic acceleration** ($m/s^2$)
   - **Pore water pressure** ($kPa$)
   - **Ambient temperature** ($^\circ C$)
2. **Designated Escalating Demo Station**: Station 3 (**Meppadi Escarpment**) is pre-configured with a gradual escalation cycle that transitions naturally from **Safe &rarr; Watch &rarr; Warning &rarr; Critical** over 3–4 minutes for demo and evaluation purposes.
3. **ML Risk Inference**: For every sensor tick, the trained Random Forest and Gradient Boosting models evaluate the 6 multi-factor inputs simultaneously, outputting:
   - A continuous **Risk Index** ($0.0 - 100.0$)
   - A categorical **Risk Tier** (`Safe`, `Watch`, `Warning`, `Critical`)
   - **Factor Attribution** (identifying which sensor triggered the hazard)
4. **Database Persistence**: Readings and predictions are persisted into SQLite for trend analytics and historical incident audits.
5. **Instant Live WebSocket Push**: The backend broadcasts data immediately over `/ws`. The React dashboard updates dynamically without manual refreshes or polling.
6. **Automated Tiered Alerts**: When risk crosses station thresholds, the alert engine evaluates severity, generates actionable geotechnical evacuation protocols, and dispatches mock SMS and email alerts to emergency response agencies.

---

## 💻 Tech Stack

### Backend
- **Python 3.10+**
- **FastAPI**: Asynchronous high-performance REST API and WebSocket framework
- **Uvicorn**: ASGI web server
- **SQLAlchemy & SQLite**: Relational database ORM
- **Scikit-Learn, NumPy, Pandas, Joblib**: ML modeling, synthetic data generation, and serialized pipeline inference

### Frontend
- **React 18 & Vite**: Fast modular frontend framework and build tool
- **Tailwind CSS**: Modern responsive dark-mode styling
- **Leaflet.js**: Geospatial mapping with custom pulsing risk markers and popups
- **Map Layers**: OpenTopoMap topographic hillshading with contour relief, Esri World Imagery high-resolution satellite layer, and MapTiler Outdoor support
- **Recharts**: Synchronized multi-metric time-series trend graphs
- **Lucide React**: Clean iconography for telemetry and status alerts

---

## 🔬 Geotechnical Physics & ML Model

Landslide slope stability is governed by the **Mohr-Coulomb failure criterion** and the **infinite slope limit equilibrium model**:

$$\tau_f = c' + (\sigma_n - u) \tan\phi'$$

- When rainfall infiltrates steep slopes, pore water pressure $u$ builds up in soil voids.
- Elevated pore pressure directly reduces effective normal stress $(\sigma_n - u)$, causing sudden loss of internal shear resistance and soil liquefaction.
- Steep slope angles $\beta > 30^\circ$ amplify the driving shear stress: $\tau_d = \gamma \cdot z \cdot \sin\beta \cos\beta$.
- Dynamic seismic tremors ($m/s^2$) exert destabilizing cyclic accelerations.

### Model Performance
- **Trained Model**: Calibrated Random Forest Classifier (120 estimators, depth 14) + Gradient Boosting Regressor (100 estimators).
- **Dataset**: 10,000 synthetic samples across normal calm, monsoon downpour, high-risk liquefaction, and extreme seismic crisis regimes.
- **Classification Accuracy**: **94.85%**
- **Score Regression $R^2$**: **0.9878**, **RMSE**: **2.87 points**
- **Feature Importances**:
  1. `slope_angle`: **25.76%**
  2. `soil_moisture`: **25.67%**
  3. `pore_water_pressure`: **19.16%**
  4. `rainfall`: **17.46%**
  5. `vibration`: **9.91%**
  6. `temperature`: **2.04%**

---

## 🚀 Core Features

- **Real-Time Telemetry Dashboard**: High-density station cards featuring continuous 0–100 risk gauges, color-coded badges, 6 live sensor metrics, and trend indicators.
- **Interactive Terrain Map**: Leaflet map centered over mountain stations with hillshaded topography (visualizing steep terrain relative to hazard color) and toggleable high-resolution satellite imagery.
- **Sensor Trend Analytics**: Synchronized Recharts displaying Risk Index vs. Thresholds, Rainfall vs. Soil Moisture, and Pore Water Pressure vs. Seismic Vibration.
- **Automated Alert & Dispatch Log**: Real-time incident feed with deduplication, factor attribution breakdown, actionable civil defense instructions, and mock SMS/email dispatch receipts.
- **Scenario Injection Console**: Trigger torrential downpours, seismic tremors, fast-forward escalations, or sunshine drainage on any station with instant live feedback.
- **Threshold Calibration**: Adjust Warning and Critical limits per station with instant database persistence.
- **Interactive ML Playground**: Custom sliders to test arbitrary sensor values against the trained classifier in real-time.

---

## 📁 Project Structure

```
landslide-sentinel/
├── backend/
│   ├── app/
│   │   ├── config.py             # Settings & environment variables
│   │   ├── main.py               # FastAPI entrypoint, lifespan, CORS, /ws
│   │   ├── websocket_manager.py  # WebSocket connection & broadcast manager
│   │   ├── schemas.py            # Pydantic schemas
│   │   ├── alerts_engine.py      # Alert rules & disaster protocols
│   │   ├── mock_notifier.py      # Mock SMS & Email dispatcher
│   │   └── routes/
│   │       ├── stations.py       # /api/stations
│   │       ├── readings.py       # /api/readings
│   │       ├── alerts.py         # /api/alerts
│   │       ├── ml.py             # /api/ml/predict, /metrics, /train
│   │       └── simulation.py     # /api/simulation
│   ├── database/
│   │   ├── connection.py         # SQLite engine & session factory
│   │   ├── models.py             # SQLAlchemy ORM models
│   │   └── seed.py               # 6 default stations & baseline seed
│   ├── ml/
│   │   ├── dataset_generator.py  # Geotechnical physics dataset generator
│   │   ├── train.py              # Model training script
│   │   ├── predictor.py          # Real-time ML inference service
│   │   └── saved_models/         # Serialized model (.joblib) & metadata
│   ├── simulation/
│   │   ├── sensor_generator.py   # Physical time-series simulator
│   │   └── simulation_service.py # Async background loop
│   ├── requirements.txt
│   └── test_backend.py          # Backend test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Header with emergency banner & status
│   │   │   ├── StationCard.jsx   # Station card with risk gauge
│   │   │   ├── MapView.jsx       # Leaflet terrain & satellite map
│   │   │   ├── TrendCharts.jsx   # Recharts trend graphs
│   │   │   ├── AlertFeed.jsx     # Incident feed & response
│   │   │   └── AdminPanel.jsx    # Scenarios, thresholds & ML playground
│   │   ├── services/
│   │   │   ├── api.js            # REST API client
│   │   │   └── websocket.js      # Reconnecting WebSocket client
│   │   ├── utils/
│   │   │   └── riskHelpers.js    # Colors, formatters & constants
│   │   ├── App.jsx               # Main state & view controller
│   │   ├── index.css             # Tailwind & custom CSS
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── index.html
├── .gitignore
├── start.bat                     # Windows one-click local startup script
└── README.md
```

---

## 🛠️ Local Installation & Setup

### Prerequisites
- **Python 3.10+** (Tested on Python 3.10, 3.11, 3.12, 3.14)
- **Node.js 18+** and **npm**

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/landslide-sentinel.git
cd landslide-sentinel
```

### Step 2: Set Up Backend
```bash
# Optional: create virtual environment
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Train the ML model (generates synthetic dataset and saves model artifacts)
python backend/ml/train.py

# Initialize database and seed initial stations
python -m backend.database.seed
```

### Step 3: Set Up Frontend
```bash
cd frontend
npm install
cd ..
```

---

## 🏃 Running the Application

### Option A: One-Click Startup (Windows)
Double-click `start.bat` in the project root. This will automatically train the model (if needed) and launch both backend and frontend servers.

### Option B: Manual Startup

**Terminal 1 — FastAPI Backend:**
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Root: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Interactive OpenAPI Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- WebSocket Endpoint: `ws://127.0.0.1:8000/ws`

**Terminal 2 — React Frontend:**
```bash
cd frontend
npm run dev
```
- Dashboard UI: [http://localhost:5173](http://localhost:5173)

---

## 📡 API & WebSocket Documentation

### REST Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stations` | List all stations with latest telemetry and status |
| `GET` | `/api/stations/{id}` | Detailed station profile |
| `PUT` | `/api/stations/{id}/thresholds` | Update warning and critical score limits |
| `GET` | `/api/readings` | Historical readings (query: `station_id`, `limit`) |
| `POST` | `/api/readings` | Ingest external sensor telemetry |
| `GET` | `/api/alerts` | Incident feed (query: `status`, `limit`) |
| `POST` | `/api/alerts/{id}/acknowledge` | Mark an active alert as acknowledged |
| `POST` | `/api/alerts/{id}/resolve` | Mark an alert as resolved |
| `POST` | `/api/ml/predict` | Predict risk score and categories on custom inputs |
| `GET` | `/api/ml/metrics` | Model performance diagnostics and feature weights |
| `POST` | `/api/simulation/scenario` | Inject event scenario (`flash_flood`, `seismic_shock`, etc.) |
| `POST` | `/api/simulation/control` | Play, pause, or change simulation speed |
| `POST` | `/api/simulation/reset` | Reset all stations to calm baseline |

### WebSocket Protocol (`/ws`)
- **Connect**: Connect to `ws://localhost:8000/ws`
- **Initial Snapshot**:
  ```json
  {
    "type": "INITIAL_SNAPSHOT",
    "stations": [...],
    "alerts": [...],
    "simulation_status": { "is_running": true, "interval_seconds": 3.0 }
  }
  ```
- **Real-Time Update** (broadcast every 3s):
  ```json
  {
    "type": "SIMULATION_UPDATE",
    "timestamp": "2026-09-11T16:20:00Z",
    "stations": [...],
    "alerts": [...]
  }
  ```

---

## ☁️ Deployment Guide (Render & Vercel)

### Deploy Backend on Render (Web Service)
1. Push this repository to GitHub.
2. Log into [Render Dashboard](https://dashboard.render.com/) &rarr; **New Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt && python backend/ml/train.py`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
5. Click **Create Web Service**. Your API and WebSockets will now be live at `https://your-backend.onrender.com`.

### Deploy Frontend on Render (Static Site) or Vercel
1. In Render &rarr; **New Static Site** (or Vercel &rarr; **New Project**).
2. Configure settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. Add Environment Variables:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
   - `VITE_WS_URL`: `wss://your-backend.onrender.com/ws`
4. Click **Deploy**. Your dashboard will be live at `https://your-sentinel.vercel.app`.

---

## 📄 License
MIT License. Built for the Smart India Hackathon (SIH) Disaster Management & Early Warning Challenge.

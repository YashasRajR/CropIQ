# CropIQ: AI-Powered Crop Yield Intelligence
> **Predict. Understand. Optimize.**

CropIQ is an end-to-end artificial intelligence and machine learning system engineered to deliver trusted, explainable, and actionable crop yield predictions, multi-factor risk diagnostics, agronomic recommendations, and interactive what-if scenario simulations with a modern React web dashboard.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CROPIQ COMPLETE PIPELINE                                      │
│                                                                                                  │
│  Farm & Satellite Data ──► ML Yield Regression ──► TreeSHAP Factors ──► Multi-Factor Risk       │
│                                                                              │                   │
│  Audit Drawer ◄── Dashboard UI ◄── React App ◄── FastAPI REST API ◄── Agronomic Recommendations  │
│                                           │                                                      │
│                                           └──► What-If Simulator & 1D Sensitivity Curve          │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete System Architecture (Phases 1–7)

1. **Phase 1: Data Foundation (`src/data/`)**
   - 1,625 field observations, 30 predictive features across remote sensing (NDVI, GNDVI, NDWI, SAVI), soil moisture, weather, and temporal cyclical features.
   - Clean group-aware field-level partition preventing data leakage across 75 unique fields.
2. **Phase 2: Machine Learning Prediction Engine (`src/ml/`)**
   - Random Forest Regressor (`models/cropiq_yield_model.joblib`) with 300 estimators.
   - Validation MAE: **0.9765** | Test MAE: **1.1438** | Test $R^2$: **0.9169**. Target unit: strictly **`unconfirmed`**.
3. **Phase 3: Explainability & Risk Intelligence (`src/intelligence/`)**
   - TreeSHAP feature attributions + deterministic feature ablation fallback.
   - Ensemble tree dispersion prediction uncertainty and 4-factor risk score (0–100).
4. **Phase 4: Actionable Agricultural Recommendation Engine (`src/recommendations/`)**
   - 19 deterministic agronomic rules spanning water, soil, weather, canopy, and crop-specific guidance.
   - Conflict resolution, deduplication, and auditable evidence.
5. **Phase 5: What-If Scenario Simulator (`src/simulator/`)**
   - Multi-variable what-if simulation on the SAME trained model.
   - Delta SHAP shifts, empirical quantile presets, and 1D feature sensitivity curves.
6. **Phase 6: FastAPI Backend Integration & API Layer (`backend/app/`)**
   - Production-grade REST API connecting all intelligence layers.
   - Singleton model caching, Pydantic validation, CORS, and full Swagger/OpenAPI documentation.
7. **Phase 7: React Frontend, Dashboard & Product Integration (`frontend/`)**
   - React 18, TypeScript, Vite, Tailwind CSS, Recharts, and Lucide-React.
   - 5 authentic dataset presets, 1-click scenario links from recommendations, live backend health monitoring, and a raw API audit drawer for hackathon judges.

---

## Quickstart Guide

### 1. Prerequisites
- **Python:** 3.10+ (tested on Python 3.12)
- **Node.js:** 18+ (tested on Node v24)

### 2. Backend Setup & Startup
```bash
# Clone the repository
git clone https://github.com/YashasRajR/CropIQ.git
cd CropIQ

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI backend server on port 8000
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will be live at:
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`
- **Health Check:** `http://localhost:8000/health`

### 3. Frontend Setup & Startup
Open a second terminal:
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser to: **`http://localhost:5173`**

### 4. Production Build Verification
```bash
cd frontend
npm run typecheck    # 0 errors
npm run build        # Generates production bundle in dist/
```

---

## Interactive Dashboard Tour & User Flow

```text
┌────────────────────────────────────────────────────────┐
│                        NAVBAR                          │
│ [CropIQ Logo]        [Status: FastAPI Ready ●] [Specs] │
├────────────────────────────────────────────────────────┤
│                     HERO SECTION                       │
│ AI-Powered Crop Yield Intelligence                     │
│ Predict. Understand. Optimize.                         │
│ [ Analyze Farm ]       [ Load Example Farm ▼ ]         │
│ Pipeline: Input → Predict → Understand → Act → Simulate│
├────────────────────────────────────────────────────────┤
│                   FARM INPUT FORM                      │
│ ┌──────────────┬──────────────┬──────────────────────┐ │
│ │ Crop & Geo   │ Weather      │ Soil & Vegetation    │ │
│ │ Crop: Rice   │ Temp: 14.6°C │ Soil Moisture: 21.98 │ │
│ │ Lat: 22.625  │ Rain: 17.5mm │ NDVI: 0.51, SAVI:... │ │
│ └──────────────┴──────────────┴──────────────────────┘ │
│                  [ Analyze Farm ]                      │
├────────────────────────────────────────────────────────┤
│                 ANALYSIS DASHBOARD                     │
│ ┌───────────────────────────┬────────────────────────┐ │
│ │ ESTIMATED YIELD           │ RISK ASSESSMENT        │ │
│ │ 52.59 unconfirmed         │ LOW RISK (Score: 16)   │ │
│ │ Benchmark: High Potential │ Protective: Good vigor │ │
│ ├───────────────────────────┼────────────────────────┤ │
│ │ KEY MODEL FACTORS (SHAP)  │ MODEL RELIABILITY      │ │
│ │ Rainfall      █████████   │ HIGH                   │ │
│ │ Soil Moisture ██████      │ In-distribution        │ │
│ └───────────────────────────┴────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│              ACTIONABLE RECOMMENDATIONS                │
│ [Farmer Mode / Technical Audit Toggle]                 │
│ ┌────────────────────────────────────────────────────┐ │
│ │ WATER (MEDIUM) • Maintain Current Irrigation       │ │
│ │ Action: Continue scheduled moisture monitoring     │ │
│ │ Evidence: Moisture within favorable zone           │ │
│ │ [ Explore Scenario ]                               │ │
│ └────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│              WHAT-IF SCENARIO SIMULATOR                │
│ Non-Causal Model Disclaimer Banner                     │
│ Variable: [ Soil Moisture ▼ ] (Farm-Manageable)        │
│ Slider: 10.0 ────────●────────── 60.0 (Current: 21.98) │
│ Presets: [ Improve Moisture ] [ Drought Stress ]       │
│                  [ Run Scenario ]                      │
│                                                        │
│ Baseline: 52.59  →  Scenario: 52.61  (Diff: +0.02)     │
│ Materiality: Below Model Noise Threshold (< MAE: 0.98) │
│ ┌───────────────────────────┬────────────────────────┐ │
│ │ 1D Sensitivity Curve      │ Trial Comparison Table │ │
│ └───────────────────────────┴────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│       MODEL TRANSPARENCY & DATA DICTIONARY             │
│ Random Forest (300 trees), Val MAE: 0.9765, R²: 0.9169 │
├────────────────────────────────────────────────────────┤
│                        FOOTER                          │
│ Model-based insights. Not a guarantee of crop yield.   │
└────────────────────────────────────────────────────────┘
```

---

## Hackathon Judge Presentation Script (3 Minutes)

1. **Live Backend Connectivity (Navbar)**:
   - Point out the `"FastAPI Ready ●"` green indicator in the navbar.
   - Click **"Model Specs"** to open the Model Card modal showing the Random Forest architecture, evaluation metrics (Val MAE: 0.9765, Test $R^2$: 0.9169), and candidate model benchmarks.
2. **Auto-Loaded Real Dataset Observation**:
   - The app loads with Sample 1 (Rice, West Bengal).
   - Point out the Predicted Yield card displaying `52.59 unconfirmed` alongside historical percentile context.
   - Show the Risk Assessment card (`LOW RISK`, score: 16) and 300-tree ensemble uncertainty.
3. **Local TreeSHAP Explainability**:
   - Scroll down to the Recharts horizontal bar chart showing exactly which observed features pushed yield higher or lower relative to the baseline.
4. **Agronomic Recommendations & Scenario Transition**:
   - Toggle between **Farmer Mode** and **Technical Audit Mode**.
   - Click **"Explore Scenario"** on the Soil Moisture card to automatically jump to the What-If Simulator with `soil_moisture` pre-selected.
5. **Interactive What-If Simulation**:
   - Drag the slider to test hypothetical irrigation changes and click **"Run Scenario"**.
   - Show the live $\Delta Y$ delta, delta SHAP shifts, and the **Materiality Warning** ($|\Delta Y| < 0.9765$), which prevents farmers from acting on minor statistical fluctuations.
6. **Live Technical Audit Drawer**:
   - Click **"Audit Data"** in the top navbar.
   - Inspect the live JSON payloads directly from FastAPI to prove **zero client-side fabrication**.

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Lightweight service and model loading status |
| `GET` | `/model-info` | Verified model specifications, features, and metrics |
| `GET` | `/metadata/scenario-features` | Scenario feature catalog and slider bounds |
| `POST` | `/predict` | Full pipeline: Prediction + Context + SHAP + Risk + Recommendations |
| `POST` | `/explain` | Standalone local feature contributions (TreeSHAP) |
| `POST` | `/risk` | Standalone multi-factor yield risk assessment |
| `POST` | `/recommendations` | Prioritized agricultural recommendations (`mode=farmer` or `technical`) |
| `POST` | `/scenario` | What-if scenario simulation comparing against baseline |
| `POST` | `/scenario/sensitivity` | 1D feature sensitivity analysis curve |
| `POST` | `/scenario/presets` | Standardized empirical scenario presets |

*All endpoints are also available with `/api/v1` prefix (e.g. `/api/v1/predict`).*

---

## Automated Test Suite

Run the full automated backend test suite:
```bash
python -m unittest discover -s tests -p "test_*.py"
```
**Test Status:** **115 / 115 tests passing** (100% pass rate).

---

## Scientific Rigor & Non-Causal Framing

All predictive outputs and scenario differences represent **model-based statistical associations** learned from historical observational data. CropIQ explicitly enforces non-causal language and disclaims physical guarantees.
Target `yield` is strictly designated with the unit **`unconfirmed`** (never falsely presented as tons or kilograms per hectare).

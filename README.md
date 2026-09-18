# CropIQ: AI-Powered Crop Yield Intelligence
> **Predict. Understand. Optimize.**

CropIQ is an end-to-end artificial intelligence and machine learning system engineered to deliver trusted, explainable, and actionable crop yield predictions, multi-factor risk diagnostics, agronomic recommendations, and interactive what-if scenario simulations.

```text
Farm Data → ML Yield Prediction → Explainability → Risk Assessment → Agronomic Recommendations → What-If Scenario Simulation → REST API → Dashboard
```

---

## Key System Components (Phases 1–6 Complete)

1. **Phase 1: Data Foundation (`src/data/`)**
   - 1,625 field observations, 30 predictive features across remote sensing (NDVI, GNDVI, NDWI, SAVI), soil moisture, weather, and temporal cyclical features.
   - Clean group-aware field-level partition preventing data leakage.
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

---

## Backend Installation & Quickstart

### 1. Environment Setup
```bash
# Clone and enter directory
cd CropIQ-main

# Install dependencies
pip install -r requirements.txt
```

### 2. Start FastAPI Server
```bash
# Start backend server on port 8000 with auto-reload
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be accessible at:
- **Root:** `http://localhost:8000/`
- **Interactive Swagger Documentation:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`
- **Health Check:** `http://localhost:8000/health`

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

## cURL Usage Examples

### Health Probe
```bash
curl http://localhost:8000/health
```

### Model Information
```bash
curl http://localhost:8000/model-info
```

### Unified Prediction & Recommendations
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "crop_type": "Rice",
    "latitude": 22.625,
    "longitude": 88.498,
    "NDVI": 0.511,
    "GNDVI": 0.467,
    "NDWI": -0.467,
    "SAVI": 0.767,
    "soil_moisture": 21.98,
    "temperature": 14.6,
    "rainfall": 17.5
  }'
```

### What-If Scenario Simulation
```bash
curl -X POST http://localhost:8000/scenario \
  -H "Content-Type: application/json" \
  -d '{
    "current_input": {
      "crop_type": "Rice",
      "latitude": 22.625,
      "longitude": 88.498,
      "NDVI": 0.511,
      "GNDVI": 0.467,
      "NDWI": -0.467,
      "SAVI": 0.767,
      "soil_moisture": 21.98,
      "temperature": 14.6,
      "rainfall": 17.5
    },
    "changes": {
      "soil_moisture": 32.0
    },
    "scenario_name": "Supplemental Irrigation"
  }'
```

---

## Running the Automated Test Suite

Run the full automated test suite covering ML, Intelligence, Recommendations, Simulator, API Routes, and Integration:
```bash
python -m unittest discover -s tests -p "test_*.py"
```
**Test Status:** 115 / 115 tests passing (100% pass rate).

---

## Non-Causal Framing & Governance

All predictive outputs and scenario differences represent **model-based statistical associations** learned from historical data. The backend explicitly enforces non-causal language and disclaims physical guarantees.
Target `yield` is strictly designated with unit `unconfirmed`.

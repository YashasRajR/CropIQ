# CropIQ API Contract Specification (Phase 7 Frontend Handoff)

**API Version:** 1.0.0  
**Base URL:** `http://localhost:8000` (and `http://localhost:8000/api/v1`)  
**Documentation:** `http://localhost:8000/docs` (Swagger UI) / `http://localhost:8000/redoc` (ReDoc)  
**Target Variable:** `yield` (unit: strictly `unconfirmed`)

---

## 1. Global API Standards

### Response Envelopes & Headers
- **`X-Request-ID`**: Unique UUID assigned to every request (or propagated from client).
- **`X-Process-Time-Ms`**: Server-side processing duration in milliseconds.
- **CORS**: Pre-configured for `http://localhost:5173`, `http://localhost:3000`, `http://127.0.0.1:5173`, `http://127.0.0.1:3000`.
- **Content-Type**: `application/json; charset=utf-8`.

### Standard Error Schema
All HTTP 4xx / 5xx error responses conform to this structured JSON schema:
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation failed for body -> rainfall: rainfall must be non-negative.",
    "details": {
      "validation_errors": [
        {
          "field": "body -> rainfall",
          "message": "rainfall must be non-negative.",
          "type": "value_error"
        }
      ]
    }
  }
}
```

Standard Error Codes:
- `INVALID_INPUT` (HTTP 400 / 422): Malformed payload, invalid types, negative physical bounds, or missing features.
- `UNSUPPORTED_SCENARIO` (HTTP 400): Attempting to mutate target `yield`, metadata IDs, or unsupported features.
- `MODEL_NOT_LOADED` (HTTP 503): Backend model artifact unavailable.
- `INTERNAL_ERROR` (HTTP 500): Server-side unexpected exception (stack traces safely hidden from client).

---

## 2. Common Data Model: `FarmInput`

All predictive and simulation endpoints accept farm observations formatted as `FarmInput`:

| Field | Type | Required | Range / Example | Description |
|---|---|---|---|---|
| `crop_type` | string | **Yes** | e.g. `"Rice"`, `"Maize"`, `"Wheat"` | Target crop variety |
| `latitude` | float | **Yes** | `-90.0` to `90.0` (e.g. `22.625`) | Geographic latitude |
| `longitude` | float | **Yes** | `-180.0` to `180.0` (e.g. `88.498`) | Geographic longitude |
| `NDVI` | float | **Yes** | `-1.0` to `1.0` (e.g. `0.511`) | Normalized Difference Vegetation Index |
| `GNDVI` | float | **Yes** | `-1.0` to `1.0` (e.g. `0.467`) | Green NDVI |
| `NDWI` | float | **Yes** | `-1.0` to `1.0` (e.g. `-0.467`) | Normalized Difference Water Index |
| `SAVI` | float | **Yes** | `-1.0` to `1.5` (e.g. `0.767`) | Soil Adjusted Vegetation Index |
| `soil_moisture` | float | **Yes** | `0.0` to `105.0` (e.g. `21.98`) | Soil moisture measurement |
| `temperature` | float | **Yes** | `-50.0` to `65.0` (e.g. `14.6`) | Ambient temperature (°C approx) |
| `rainfall` | float | **Yes** | `0.0` to `500.0` (e.g. `17.5`) | Cumulative precipitation |
| `field_id` | string | Optional | e.g. `"Field_101"` | Identifier (excluded from model) |
| `date_of_image` | string | Optional | `"YYYY-MM-DD"` (e.g. `"2023-01-04"`) | Observation date |

---

## 3. Endpoints Specification

### 3.1 Health Check
- **Endpoint:** `GET /health` (also `GET /api/v1/health`)
- **Purpose:** Fast operational probe verifying server and model pipeline availability.
- **Response Example (200 OK):**
```json
{
  "status": "ok",
  "service": "CropIQ API",
  "model_loaded": true,
  "model_version": "1.0.0",
  "environment": "development"
}
```

---

### 3.2 Model Metadata & Specifications
- **Endpoint:** `GET /model-info`
- **Purpose:** Public inspection of model architecture, features, and validated accuracy metrics.
- **Response Example (200 OK):**
```json
{
  "project": "CropIQ",
  "model_name": "Random Forest",
  "model_type": "RandomForestRegressor",
  "model_version": "1.0.0",
  "target": "yield",
  "target_unit": "unconfirmed",
  "features": [
    "crop_type", "latitude", "longitude", "NDVI", "GNDVI", "NDWI", "SAVI",
    "soil_moisture", "temperature", "rainfall", "year", "month", "day_of_year",
    "month_sin", "month_cos", "doy_sin", "doy_cos", "field_obs_number",
    "NDVI_field_expanding_mean", "GNDVI_field_expanding_mean", "SAVI_field_expanding_mean",
    "soil_moisture_field_expanding_mean", "rainfall_field_expanding_mean", "temperature_field_expanding_mean",
    "NDVI_field_expanding_std", "GNDVI_field_expanding_std", "SAVI_field_expanding_std",
    "soil_moisture_field_expanding_std", "rainfall_field_expanding_std", "temperature_field_expanding_std"
  ],
  "categorical_features": ["crop_type"],
  "numerical_features": ["latitude", "longitude", "NDVI", "..."],
  "metrics": {
    "test_mae": 1.1438,
    "test_rmse": 2.3326,
    "test_r2": 0.9169,
    "val_mae": 0.9765,
    "val_r2": 0.932
  }
}
```

---

### 3.3 Scenario Feature Catalog (UI Sliders Configuration)
- **Endpoint:** `GET /metadata/scenario-features`
- **Purpose:** Exposes dynamic slider configurations, physical limits, step sizes, and modifiability classifications for Phase 7 UI sliders.
- **Response Example (200 OK):**
```json
{
  "features": {
    "soil_moisture": {
      "display_name": "Soil Moisture",
      "classification": "ACTIONABLE_SIMULATABLE",
      "slider": { "min": 10.0, "max": 60.0, "step": 0.5, "default": 27.28 }
    },
    "rainfall": {
      "display_name": "Rainfall",
      "classification": "CONTEXTUAL_SIMULATABLE",
      "slider": { "min": 0.0, "max": 30.0, "step": 0.5, "default": 8.02 }
    }
  }
}
```

---

### 3.4 Unified Yield Prediction Pipeline
- **Endpoint:** `POST /predict`
- **Query Parameters:**
  - `mode` (string, default `"farmer"`): `"farmer"` (accessible text) or `"technical"` (auditable rules).
  - `top_n` (int, default `5`): Maximum number of prioritized recommendations.
- **Request Body:** `FarmInput` object.
- **Response Structure (200 OK):**
```json
{
  "prediction": {
    "yield": 52.5904,
    "unit": "unconfirmed"
  },
  "context": {
    "crop": "Rice",
    "historical_mean": 41.52,
    "historical_median": 40.22,
    "percentile_rank": 88.4,
    "comparison_label": "High Yield Potential"
  },
  "risk": {
    "level": "LOW",
    "score": 16,
    "drivers": [],
    "protective_factors": ["High vegetation vigor", "Optimal moisture range"]
  },
  "uncertainty": {
    "classification": "LOW",
    "std_yield": 0.42,
    "lower_bound": 51.75,
    "upper_bound": 53.43,
    "relative_uncertainty": 0.8,
    "n_trees": 300
  },
  "explanation": {
    "baseline": 40.1652,
    "method": "SHAP (TreeExplainer)",
    "top_overall_factors": [
      {
        "feature": "rainfall",
        "display_name": "Rainfall",
        "contribution": 3.82,
        "direction": "positive",
        "interpretation": "Rainfall pulled up the model yield estimate."
      }
    ]
  },
  "recommendations": [
    {
      "id": "REC_WATER_MAINTAIN_01",
      "title": "Maintain Current Irrigation Schedule",
      "category": "WATER",
      "priority": "MEDIUM",
      "actionability": "ACTIONABLE",
      "summary": "Soil moisture is in the favorable zone.",
      "action": "Continue scheduled moisture monitoring.",
      "evidence": ["Soil moisture is within historical interquartile range."],
      "confidence": "HIGH",
      "limitations": "Model-based association; field evaporation may vary.",
      "what_if_supported": true
    }
  ],
  "data_quality": {
    "warnings": [],
    "out_of_distribution": false
  },
  "metadata": {
    "model_name": "Random Forest",
    "model_version": "1.0.0",
    "target_unit": "unconfirmed"
  }
}
```

---

### 3.5 Local Explainability
- **Endpoint:** `POST /explain`
- **Query Parameters:** `force_fallback` (bool, default `false`)
- **Request Body:** `FarmInput`
- **Response Example (200 OK):**
```json
{
  "baseline_yield": 40.1652,
  "predicted_yield": 52.5904,
  "method": "SHAP (TreeExplainer)",
  "top_positive_factors": [...],
  "top_negative_factors": [...],
  "top_overall_factors": [...],
  "non_causal_statement": "Feature contributions describe mathematical model importance under the trained regressor and do not imply real-world causal mechanisms."
}
```

---

### 3.6 Risk Assessment
- **Endpoint:** `POST /risk`
- **Request Body:** `FarmInput`
- **Response Example (200 OK):**
```json
{
  "level": "LOW",
  "score": 16,
  "drivers": [],
  "protective_factors": ["High vegetation vigor", "Optimal moisture range"],
  "component_scores": {
    "yield_deficit": 0.0,
    "unfavorable_factors": 8.5,
    "uncertainty_penalty": 7.5,
    "data_quality_penalty": 0.0
  }
}
```

---

### 3.7 Agronomic Recommendations
- **Endpoint:** `POST /recommendations`
- **Query Parameters:** `mode="farmer" | "technical"`, `top_n=5`
- **Request Body:** `FarmInput`
- **Response Example (200 OK):**
```json
{
  "summary": {
    "total_generated": 2,
    "displayed": 2,
    "high_priority": 0,
    "medium_priority": 2,
    "low_priority": 0,
    "crop_specific_recommendations_available": true,
    "executive_summary": "Soil moisture and vegetation indicators are in favorable zones. Prioritize maintaining current irrigation."
  },
  "recommendations": [...]
}
```

---

### 3.8 What-If Scenario Simulation
- **Endpoint:** `POST /scenario`
- **Purpose:** Interactive what-if simulation comparing baseline vs hypothetical changes on the **SAME** trained model.
- **Request Body:**
```json
{
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
  "scenario_name": "Moisture Enhancement"
}
```
- **Response Example (200 OK):**
```json
{
  "baseline": {
    "predicted_yield": 52.5904,
    "unit": "unconfirmed",
    "risk": { "level": "LOW", "score": 16 },
    "uncertainty": { "classification": "LOW" }
  },
  "scenario": {
    "name": "Moisture Enhancement",
    "changes": { "soil_moisture": 32.0 },
    "predicted_yield": 52.6064,
    "unit": "unconfirmed",
    "risk": { "level": "LOW", "score": 16 },
    "uncertainty": { "classification": "LOW" }
  },
  "comparison": {
    "absolute_change": 0.016,
    "percentage_change": 0.03,
    "direction": "no_material_change",
    "is_material": false,
    "materiality_label": "small model-estimated difference",
    "material_threshold": 0.9765,
    "feature_diffs": {
      "soil_moisture": {
        "baseline": 21.98,
        "scenario": 32.0,
        "difference": 10.02
      }
    }
  },
  "progression": {
    "risk": { "baseline_level": "LOW", "scenario_level": "LOW", "risk_changed": false },
    "uncertainty": { "baseline_level": "LOW", "scenario_level": "LOW", "uncertainty_changed": false }
  },
  "explanation": {
    "changed_features": ["soil_moisture"],
    "delta_contributors": [...]
  },
  "validation": {
    "within_training_range": true,
    "warnings": []
  },
  "interpretation": {
    "summary": "Under 'Moisture Enhancement', the model estimates a yield of 52.61 unconfirmed compared to baseline 52.59 unconfirmed (+0.02 unconfirmed). This difference is smaller than validation MAE (0.98 unconfirmed) and represents a small model fluctuation. Non-causal disclaimer: model estimate != physical yield guarantee.",
    "scenario_reliability": "HIGH",
    "causal_claim": false
  }
}
```

---

### 3.9 1D Feature Sensitivity Analysis
- **Endpoint:** `POST /scenario/sensitivity`
- **Purpose:** Sweeps a feature across empirical training bounds holding other variables fixed.
- **Request Body:**
```json
{
  "current_input": { ... },
  "feature": "soil_moisture",
  "num_points": 10
}
```
- **Response Structure (200 OK):**
```json
{
  "feature": "soil_moisture",
  "display_name": "Soil Moisture",
  "unit": "unconfirmed",
  "baseline_value": 21.98,
  "baseline_yield": 52.5904,
  "points": [
    { "feature_value": 4.79, "predicted_yield": 48.21, "difference": -4.38 },
    { "feature_value": 27.28, "predicted_yield": 52.61, "difference": 0.02 }
  ],
  "disclaimer": "This curve depicts model sensitivity holding other features constant. It represents learned statistical associations, not a physical crop response curve."
}
```

---

### 3.10 Empirical Scenario Presets
- **Endpoint:** `POST /scenario/presets`
- **Request Body:** `{"current_input": { ... }}`
- **Response Example (200 OK):**
```json
{
  "presets": {
    "improve_moisture": { "soil_moisture": 34.01 },
    "historical_median_moisture": { "soil_moisture": 27.28 },
    "drought_stress": { "soil_moisture": 14.85 },
    "higher_rainfall": { "rainfall": 13.03 },
    "lower_rainfall": { "rainfall": 3.85 },
    "cooler_temperature": { "temperature": 15.22 }
  }
}
```

---

## 4. Frontend Integration Guidelines for Phase 7 (React)

1. **Debounce Sliders:**
   - Slider updates for what-if scenarios and sensitivity should be debounced by 250–300 ms to avoid firing duplicate requests during drag interactions.
2. **Display Non-Causal Badges:**
   - All scenario estimate cards must display the badge: `Model Scenario Estimate — Not a Causal Guarantee`.
3. **Handle Materiality Appropriately:**
   - When `comparison.is_material === false`, indicate to the user: *"Small model fluctuation (below validation error threshold of ±0.98)"*.
4. **Target Unit Display:**
   - Always display `yield` with unit label `unconfirmed`. Never assume or invent `t/ha` or `kg/ha`.

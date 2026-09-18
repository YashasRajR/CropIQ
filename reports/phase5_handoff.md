# CropIQ Phase 5 Handoff

**Project:** CropIQ (AI-Powered Crop Yield Intelligence)  
**Phase Completed:** Phase 5 — What-If Crop Yield Scenario Simulator  
**Next Phase:** Phase 6 — FastAPI Production Backend Integration  

---

## Simulator
- **Name:** CropIQ Interactive What-If Scenario Simulator
- **Version:** 1.0.0
- **Package Path:** `src/simulator/`
- **Primary Entry Points:**
  - `simulate_scenario(current_input, scenario_changes, scenario_name, pipeline, run_explanation)`
  - `simulate_multiple_scenarios(current_input, scenarios, pipeline)`
  - `compute_feature_sensitivity(current_input, feature_name, num_points, pipeline)`
  - `create_preset_scenario(current_input, preset_type)`
  - `reset_scenario(current_input)`

---

## Model
- **Model:** Random Forest Regressor Pipeline (`models/cropiq_yield_model.joblib`)
- **Model Version:** 1.0.0 (from `models/model_metadata.json`)
- **Pipeline Structure:** `ColumnTransformer` (median imputer for numericals, most frequent + OneHotEncoder for categoricals) + `RandomForestRegressor(300 trees)`.
- **Target Variable:** `yield` (unit: strictly `unconfirmed`).
- **Validation Error Scale:** MAE = 0.9765 unconfirmed.

---

## Supported Variables
1. **`soil_moisture` (`ACTIONABLE_SIMULATABLE`):**
   - Direct farm water intervention (irrigation / drainage).
   - Training quantiles: Min = 4.79, 25% = 20.28, Median = 27.28, 75% = 34.01, Max = 102.13.
   - Recommended Slider Range: 10.0 to 60.0 (step: 0.5).
2. **`rainfall` (`CONTEXTUAL_SIMULATABLE`):**
   - Contextual precipitation scenario (not directly controllable by farmer).
   - Training quantiles: Min = 0.87, Median = 8.02, 75% = 13.03, Max = 93.37.
   - Recommended Slider Range: 0.0 to 30.0 (step: 0.5).
3. **`temperature` (`CONTEXTUAL_SIMULATABLE`):**
   - Contextual thermal scenario (ambient heat / cold wave).
   - Training quantiles: Min = -4.75, Median = 19.81, 75% = 26.26, Max = 44.69.
   - Recommended Slider Range: 0.0 to 45.0 (step: 0.5).
4. **`NDVI`, `GNDVI`, `NDWI`, `SAVI` (`MONITORING_ONLY`):**
   - Satellite vegetation indices; simulated for model sensitivity exploration only.

**Strictly Blocked:** Target `yield`, identifiers (`field_id`, etc.), and categorical swaps (`crop_type`).

---

## Scenario Validation
- **Range:** Evaluated against physical plausibility bounds (e.g. `rainfall >= 0`, `soil_moisture in [0, 105]`, `NDVI in [-1, 1]`). Violations raise `ScenarioValidationError`.
- **Out-of-Distribution:** Flagged when values exceed historical training extremes $[P_{01}, P_{99}]$ or $[\min, \max]$. Extrapolative inputs trigger reliability downgrades rather than silent failures.
- **Feature Dependencies:** Inputs are deep-copied (`scenario_input = copy.deepcopy(current_input)`). Multi-variable changes emit joint-interaction warnings; partial vegetation changes emit canopy co-variation warnings.

---

## Comparison
- **Absolute Difference:** $\Delta Y = \hat{Y}_{\text{scenario}} - \hat{Y}_{\text{baseline}}$
- **Percentage Difference:** $(\frac{\Delta Y}{\hat{Y}_{\text{baseline}}}) \times 100$, with zero baseline safeguard (returns `None` when baseline $\approx 0$).
- **Material-Change Threshold:** 0.9765 unconfirmed (Phase 2 Validation MAE). Differences smaller than MAE are categorized as `no_material_change` (*"small model-estimated difference"*).

---

## Scenario Explainability
- **Baseline Explanation:** Top positive and negative contributors from Phase 3 SHAP/ablation.
- **Scenario Explanation:** Recomputed feature contributions under modified scenario.
- **Delta Explanation:** Shift in contribution ($\Delta C_j = C_{j,\text{scenario}} - C_{j,\text{baseline}}$) isolating which modified features drove the output adjustment.

---

## Risk
- **Baseline Risk:** Phase 3 4-component risk score ($0-100$) and level (`LOW`, `MODERATE`, `HIGH`).
- **Scenario Risk:** Re-evaluated on the scenario vector.
- **Risk Changed:** Boolean flag indicating whether the risk classification shifted.

---

## Uncertainty
- **Baseline Uncertainty:** Dispersion across 300 ensemble trees (`LOW`, `MODERATE`, `HIGH`).
- **Scenario Uncertainty:** Recalculated tree variance under modified conditions.

---

## Reliability
- **Method:** Evaluates standardized distance ($Z$-score space) from training distribution, presence of extrapolation warnings, and ensemble uncertainty.
- **Classification:** `HIGH`, `MEDIUM`, `LOW`.

---

## Warnings
- `outside_training_range`: Input requires model extrapolation.
- `multiple_inputs_changed`: Joint interaction caveat.
- `contextual_variable_warning`: Flags that rainfall/temperature are non-controllable.
- `monitoring_only_warning`: Flags that vegetation indices are observational.

---

## API Contract (Ready for Phase 6 FastAPI)

### Endpoint: `POST /scenario`
#### Request Payload:
```json
{
  "current_input": {
    "crop_type": "Rice",
    "soil_moisture": 26.24,
    "rainfall": 8.02,
    "temperature": 19.81,
    "NDVI": 0.35,
    "latitude": 18.52,
    "longitude": 73.85
  },
  "changes": {
    "soil_moisture": 34.0
  },
  "scenario_name": "Increased Moisture"
}
```

#### Response Payload:
```json
{
  "baseline": {
    "predicted_yield": 36.43,
    "unit": "unconfirmed",
    "risk": { "level": "MODERATE", "score": 59 },
    "uncertainty": { "classification": "HIGH" }
  },
  "scenario": {
    "name": "Increased Moisture",
    "predicted_yield": 36.46,
    "unit": "unconfirmed",
    "risk": { "level": "MODERATE", "score": 59 },
    "uncertainty": { "classification": "HIGH" }
  },
  "comparison": {
    "absolute_change": 0.04,
    "percentage_change": 0.1,
    "direction": "no_material_change",
    "is_material": false,
    "materiality_label": "small model-estimated difference",
    "material_threshold": 0.9765,
    "feature_diffs": {
      "soil_moisture": {
        "baseline": 26.24,
        "scenario": 34.0,
        "difference": 7.76
      }
    }
  },
  "progression": {
    "risk": { "baseline_level": "MODERATE", "scenario_level": "MODERATE", "risk_changed": false },
    "uncertainty": { "baseline_level": "HIGH", "scenario_level": "HIGH", "uncertainty_changed": false }
  },
  "explanation": {
    "changed_features": ["soil_moisture"],
    "delta_contributors": [...]
  },
  "validation": {
    "within_training_range": true,
    "distance": 0.55,
    "distance_class": "NORMAL",
    "warnings": []
  },
  "interpretation": {
    "summary": "Under 'Increased Moisture', the model estimates a yield of 36.46 unconfirmed compared to the baseline estimate of 36.43 unconfirmed, representing an estimated difference of +0.04 unconfirmed (+0.1%). Note: This estimated difference is smaller than the model's validation MAE (0.98 unconfirmed) and is classified as a small model fluctuation. Scenario reliability is assessed as HIGH. Important: This result represents a model-based scenario estimate and does not guarantee a physical causal response or real-world yield outcome.",
    "scenario_reliability": "HIGH",
    "causal_claim": false
  }
}
```

### Endpoint: `POST /scenario/sensitivity`
#### Request Payload:
```json
{
  "current_input": { ... },
  "feature": "soil_moisture",
  "num_points": 10
}
```

---

## Frontend Requirements (Phase 7 Preparation)
1. **Slider Bounds & Steps:** Frontends should pull slider bounds (`slider.min`, `slider.max`, `slider.step`) directly from `knowledge/scenario_features.json`.
2. **Debouncing:** Rapid slider changes in the React frontend must be debounced (e.g. 250 ms) to avoid overwhelming inference execution.
3. **Non-Causal Badging:** The UI must display a clear visual badge: *"Model Scenario Estimate — Not a Causal Guarantee"*.

---

## Known Limitations
1. **Model Explanation $\neq$ Agronomic Causation**: The model calculates $f(X_{\text{modified}})$, which reflects associative patterns in historical data rather than experimental agronomic trials.
2. **Unconfirmed Target and Feature Units**: Target `yield` and `soil_moisture` units are unconfirmed from source metadata.
3. **Static Phenology**: The model does not include crop growth stage; water response is assumed stationary across the observation season.

---

## Phase 6 Requirements (FastAPI Backend Integration)
1. **Orchestrate Pipelines**: Connect Phase 2 (Predict), Phase 3 (Explain & Risk), Phase 4 (Recommendations), and Phase 5 (What-If Simulator) under unified FastAPI endpoints.
2. **Expose Endpoints**:
   - `POST /predict`: Unified inference + explanation + risk + recommendations.
   - `POST /scenario`: Single/multi-variable what-if simulation.
   - `POST /scenario/presets`: Generate empirical preset changes.
   - `POST /scenario/sensitivity`: 1D feature sensitivity curves.
   - `GET /metadata/scenario-features`: Expose slider ranges and modifiability metadata.
3. **Pydantic Validation**: Implement strict Pydantic schemas mirroring `ScenarioValidationError` rules.

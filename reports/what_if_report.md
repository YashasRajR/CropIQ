# CropIQ What-If Simulator Report

**Project:** CropIQ (AI-Powered Crop Yield Intelligence)  
**Subtitle:** Predict. Understand. Optimize.  
**Phase:** Phase 5 — What-If Crop Yield Scenario Simulator  
**Version:** 1.0.0  
**Status:** Completed & Validated  

---

## 1. Objective
The primary objective of Phase 5 is to build an interactive, scientifically grounded **What-If Scenario Simulation Engine** on top of the trained CropIQ Machine Learning prediction pipeline. The simulator enables users (farmers, agronomists, and analysts) to explore:

> *"What happens to the model's estimated crop yield if one or more farm conditions change?"*

CropIQ models the scenario response as $f(X_{\text{scenario}})$ compared against the baseline $f(X_{\text{current}})$. The system strictly enforces non-causal language safeguards: it models statistical associations learned by the machine learning algorithm, without claiming that the change guarantees physical or biological causality.

```text
Current Farm Conditions
        ↓
Current Model Prediction
        ↓
User Modifies Selected Variable
        ↓
Scenario Input (Deep Copied)
        ↓
SAME CropIQ ML Model
        ↓
Scenario Prediction & Delta Explanation
        ↓
Compare Current vs Scenario (MAE Materiality)
        ↓
Non-Causal Insights & Caveats
```

---

## 2. Architecture
The What-If Simulator is implemented as a decoupled, modular subpackage (`src/simulator/`):

```text
                      FARM INPUT (Current Observation)
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │                 VALIDATION LAYER                        │
       │  - src/simulator/validator.py                           │
       │  - Target 'yield' mutation protection (Rule 65)         │
       │  - Metadata identifier protection (Rule 66)             │
       │  - Physical plausibility checks                         │
       │  - Empirical training range checks (p01-p99, min-max)   │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │             CONSTRAINTS & DEPENDENCY LAYER              │
       │  - src/simulator/constraints.py                         │
       │  - Deep-copy immutability (scenario_input = copy())     │
       │  - Co-variation warnings (vegetation indices)           │
       │  - Multi-variable joint interaction warnings            │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │                 INFERENCE EXECUTION                     │
       │  - src/simulator/simulator.py                           │
       │  - Single model reuse: models/cropiq_yield_model.joblib │
       │  - Baseline prediction & Phase 3 intelligence           │
       │  - Scenario prediction on identical pipeline            │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │           COMPARISON & EXPLANATION LAYER                │
       │  - src/simulator/comparison.py & explanation.py         │
       │  - Absolute (ΔY) and % change (zero-baseline safe)      │
       │  - Materiality check against Phase 2 MAE (0.9765)       │
       │  - Delta feature attribution (SHAP/ablation shifts)     │
       │  - Risk progression (score & level)                     │
       │  - Ensemble tree uncertainty progression                │
       │  - Scenario reliability scoring (HIGH / MEDIUM / LOW)   │
       │  - Deterministic non-causal natural language summary    │
       └─────────────────────────────────────────────────────────┘
```

---

## 3. Supported Scenario Variables
Variables are strictly classified based on agronomic modifiability and observational role (`knowledge/scenario_features.json`):

| Feature | Display Name | Classification | Controllability | Slider Range | Step | Phase 4 Trigger Link |
|---|---|---|---|---|---|---|
| `soil_moisture` | Soil Moisture | `ACTIONABLE_SIMULATABLE` | Partial (Irrigation) | [10.0, 60.0] | 0.5 | `water_001`, `water_003`, `crop_rice_001` |
| `rainfall` | Precipitation | `CONTEXTUAL_SIMULATABLE` | None (Weather) | [0.0, 30.0] | 0.5 | `water_003`, `water_004`, `weather_002` |
| `temperature` | Ambient Temperature | `CONTEXTUAL_SIMULATABLE` | None (Weather) | [0.0, 45.0] | 0.5 | `weather_001`, `crop_wheat_001` |
| `NDVI` | Vegetation Health | `MONITORING_ONLY` | None (Canopy Index) | [-0.2, 0.85] | 0.01 | `veg_001`, `veg_002` |
| `GNDVI` | Green Vegetation Index | `MONITORING_ONLY` | None (Canopy Index) | [-0.3, 0.75] | 0.01 | Contextual canopy tracking |
| `NDWI` | Canopy Water Index | `MONITORING_ONLY` | None (Canopy Index) | [-0.75, 0.5] | 0.01 | `veg_003` |
| `SAVI` | Soil-Adjusted Index | `MONITORING_ONLY` | None (Canopy Index) | [-0.3, 1.2] | 0.01 | Stand density tracking |

**Blocked Variables:**
- Target `yield`: Strictly prohibited from user modification. Yield is the model-estimated output.
- Identifiers: `field_id`, `date_of_image`, `source_dataset`, `raw_row_index`, `soil_moisture_flag` are immutable.
- Systemic Categoricals: `crop_type` modification inside an environmental what-if is rejected (crop swaps represent complete cropping system transitions).

---

## 4. Feature Constraints & Immutability
1. **Strict Immutability**:
   Baseline inputs are deep-copied (`copy.deepcopy(current_input)`). Original input dictionaries are never modified in memory, preventing state leakage across simulations.
2. **Derived Temporal Features**:
   In CropIQ, engineered expanding statistics (`_field_expanding_mean`, `_field_expanding_std`) reflect strictly prior observation points (`shift(1).expanding()`). Modifying current soil moisture or weather does not alter historical statistics from earlier dates.
3. **Multi-Variable Interaction Warnings**:
   When multiple variables are changed simultaneously, the engine automatically flags:
   > *"Because multiple inputs were changed together, the estimated difference cannot be attributed to one variable alone; joint interactions may influence the model."*
4. **Vegetation Co-Variation Warnings**:
   If a single vegetation index (`NDVI`) is modified while holding correlated indices (`GNDVI`, `SAVI`) fixed, the engine emits a synthetic exploration warning.

---

## 5. Scenario Validation Methodology
Input validation is performed hierarchically (`src/simulator/validator.py`):
1. **Schema Integrity**: Verifies non-null numerical values and rejects infinite values. Expanding features are permitted to be NaN for initial field observations per Phase 1 design.
2. **Target & ID Protection**: Attempts to modify `yield` or metadata IDs immediately raise `ScenarioValidationError`.
3. **Physical Plausibility**:
   - `rainfall >= 0.0`
   - `soil_moisture` within $[0.0, 105.0]$
   - Vegetation indices within $[-1.0, 1.0]$ or $[-1.5, 1.5]$ for SAVI
   - `temperature` within $[-15.0^\circ\text{C}, 55.0^\circ\text{C}]$
   Values violating physical laws are strictly rejected.
4. **Empirical Distribution Categorization**:
   - `NORMAL`: Value falls within the training distribution 5th–95th percentiles ($[P_{05}, P_{95}]$).
   - `UNUSUAL`: Value falls in historical tails ($[P_{01}, P_{05})$ or $(P_{95}, P_{99}]$).
   - `OUTSIDE_TRAINING_RANGE`: Value exceeds historical training extremes ($< \min$ or $> \max$). Permitted physically, but triggers an extrapolation warning and reduces reliability.

---

## 6. Baseline Prediction
Every scenario simulation establishes an explicit baseline using the Phase 2 pipeline:
- Baseline point prediction ($\hat{Y}_{\text{base}}$).
- Baseline context (crop reference median, $Q_1, Q_3$, and quartile position).
- Baseline ensemble uncertainty (spread across 300 Random Forest trees).
- Baseline 4-factor risk score ($0-100$) and risk level (`LOW`, `MODERATE`, `HIGH`).

---

## 7. Scenario Prediction
The modified scenario vector $X_{\text{scenario}}$ is passed into the exact same pipeline:
$$\hat{Y}_{\text{scenario}} = \text{ModelPipeline.predict}(X_{\text{scenario}})$$
The model weights, preprocessing transformers, and imputer statistics remain 100% frozen. No surrogate models or secondary approximations are used.

---

## 8. Prediction Difference & Materiality (MAE Scale)
The engine computes:
- Absolute Difference: $\Delta Y = \hat{Y}_{\text{scenario}} - \hat{Y}_{\text{base}}$
- Percentage Difference:
  $$\% \Delta = \begin{cases} \left(\frac{\Delta Y}{\hat{Y}_{\text{base}}}\right) \times 100 & \text{if } |\hat{Y}_{\text{base}}| \ge 10^{-4} \\ \text{null} & \text{if } |\hat{Y}_{\text{base}}| < 10^{-4} \end{cases}$$

### Grounding in Model Error:
CropIQ uses the Phase 2 validation MAE ($0.9765$ unconfirmed) as an empirical materiality threshold:
- If $|\Delta Y| < 0.9765$: Classified as `no_material_change` (*"small model-estimated difference"*). The system explicitly cautions that the difference is smaller than the model's average validation error.
- If $|\Delta Y| \ge 0.9765$: Classified as a material `increase` or `decrease`.

---

## 9. Scenario Explainability & Delta Contributions
When `run_explanation=True`, the engine computes local feature contributions for both baseline and scenario, calculating the delta shift:
$$\Delta \text{Contribution}_j = \text{Contribution}_{j,\text{scenario}} - \text{Contribution}_{j,\text{baseline}}$$
This provides transparent auditability: exactly which modified variables accounted for the upward or downward adjustment in the model's output.

---

## 10. Scenario Risk Progression
The engine evaluates the Phase 3 risk engine on the scenario vector and reports:
- Baseline Risk Score vs. Scenario Risk Score.
- Baseline Level vs. Scenario Level (`LOW`, `MODERATE`, `HIGH`).
- Boolean flag `risk_changed`.

Non-causal phrasing is strictly enforced: *"The model's risk indicator changes from HIGH to MODERATE under this scenario"* rather than *"This action reduces crop risk."*

---

## 11. Scenario Uncertainty Progression
Recalculates ensemble dispersion across all 300 decision trees under the scenario input:
- Relative uncertainty spread: $\frac{\text{Upper}_{90} - \text{Lower}_{10}}{\text{Estimate}}$.
- Classification: `LOW` ($< 12\%$), `MODERATE` ($12\%-25\%$), `HIGH` ($\ge 25\%$).
- Detects if modified inputs lead to higher tree disagreement.

---

## 12. Out-of-Distribution Handling & Standardized Distance
To prevent false confidence when evaluating extrapolative conditions, the simulator calculates the standardized Euclidean distance in $Z$-score space:
$$d = \sqrt{\frac{1}{K} \sum_{k=1}^K \left(\frac{x_{k,\text{scenario}} - \mu_{k,\text{train}}}{\sigma_{k,\text{train}}}\right)^2}$$
- `NORMAL` ($d < 1.5$): Scenario closely resembles observed training combinations.
- `UNUSUAL` ($1.5 \le d < 3.0$): Tail observation; marked with moderate reliability.
- `EXTRAPOLATIVE` ($d \ge 3.0$ or value outside $[\min, \max]$): Generates extrapolation warning; scenario reliability downgraded to `LOW`.

---

## 13. Sensitivity Analysis (1D Grid)
The function `compute_feature_sensitivity(current_input, feature_name, num_points)` sweeps an individual feature across its empirical range $[P_{01}, P_{99}]$ while holding all other 29 features fixed.

This produces a response curve showing how the model's predictions vary across the feature space. Each curve carries an explicit disclaimer:
> *"This curve depicts model sensitivity for [feature] holding other features constant. It represents learned statistical associations, not a physical crop response curve."*

---

## 14. Example Scenarios & Presets

| Scenario Name | Feature Modifications | Baseline Yield | Scenario Yield | Estimated Diff | Direction | Material? | Reliability |
|---|---|---|---|---|---|---|---|
| **Increased Moisture** | `soil_moisture`: $26.24 \to 34.0$ | 36.43 | 36.46 | +0.04 | `no_material_change` | No (< MAE) | `HIGH` |
| **Drought Stress** | `soil_moisture`: $26.24 \to 10.83$ | 36.43 | 36.31 | -0.12 | `no_material_change` | No (< MAE) | `HIGH` |
| **Multi-Weather Shift** | `moisture`: 32.0, `rain`: 14.0, `temp`: 22.0 | 36.43 | 36.48 | +0.05 | `no_material_change` | No (< MAE) | `MEDIUM` |
| **Extreme Rainfall (OOD)** | `rainfall`: $8.0 \to 110.0$ | 36.43 | 38.64 | +2.21 | `increase` | Yes (> MAE) | `LOW` (Extrapolative) |

---

## 15. Limitations
1. **Target and Feature Units**: Target `yield` and `soil_moisture` units are unconfirmed from source metadata.
2. **Correlation $\neq$ Causation**: A positive scenario delta does not prove that irrigating the field will produce higher yields; it indicates that the machine learning model associates that feature profile with higher yield observations in the historical data.
3. **Absence of Phenological Constraints**: The model does not include crop growth stage; water needs vary drastically between germination, vegetative, flowering, and ripening stages.

---

## 16. Causal Interpretation Warning
Every simulation output embeds the strict safeguard:
```json
{
  "interpretation": {
    "causal_claim": false,
    "disclaimer": "Model scenario estimates reflect learned associations, not guaranteed physical causal responses."
  }
}
```
All summary text uses probabilistic decision-support phrasing:
> *"Under the selected scenario, the model estimates a yield of X unconfirmed compared to the baseline estimate of Y unconfirmed... This result represents a model-based scenario estimate and does not guarantee a physical causal response or real-world yield outcome."*

---

## 17. Testing & Verification
The Phase 5 test suite consists of 23 dedicated unit tests across 6 modules:
- `tests/test_simulator.py`: Baseline consistency, single/multi-variable changes, session history, reproducibility.
- `tests/test_scenario.py`: Dynamic empirical presets, batch simulation, scenario reset.
- `tests/test_constraints.py`: Deep-copy immutability, interaction warnings, vegetation co-variation.
- `tests/test_comparison.py`: Absolute & percentage difference, zero-baseline safety, MAE materiality.
- `tests/test_simulator_validation.py`: Target protection, ID protection, physical bounds, OOD handling.
- `tests/test_sensitivity.py`: 1D sensitivity curves, holding other inputs fixed, disclaimers.

**Test Run Result:** All 80 unit tests across Phase 2, Phase 3, Phase 4, and Phase 5 passed in 21.16 seconds (`80/80 OK`).

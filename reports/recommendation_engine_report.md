# CropIQ Recommendation Engine Report

**Project:** CropIQ (AI-Powered Crop Yield Intelligence)  
**Subtitle:** Predict. Understand. Optimize.  
**Phase:** Phase 4 — Actionable Agricultural Recommendation Engine  
**Version:** 1.0.0  
**Status:** Completed & Validated  

---

## 1. Objective
The primary objective of Phase 4 is to translate the statistical predictions of Phase 2 (Random Forest regression) and the multi-layered intelligence of Phase 3 (SHAP local contributions, ensemble uncertainty, 4-factor risk scoring, and data quality diagnostics) into structured, prioritized, actionable, and non-causal agricultural recommendations.

CropIQ rejects the black-box approach of passing arbitrary inputs into an unconstrained large language model (LLM). Instead, Phase 4 operates as a **100% deterministic, explainable, and audit-friendly rule engine** anchored in external agricultural knowledge bases, empirical model signals, and strict safety validation.

```text
Farm Input
    ↓
Phase 2 — Yield Prediction
    ↓
Phase 3 — Explainability + Risk + Uncertainty
    ↓
Phase 4 — Recommendation Engine
    ↓
Prioritized Actions & Monitoring Suggestions
    ↓
Phase 5 — What-If Simulation
```

---

## 2. Architecture
The recommendation engine follows a decoupled, layered pipeline:

```text
                      PHASE 3 INTELLIGENCE PAYLOAD
         (Prediction, Explanations, Uncertainty, Risk, Data Quality)
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │             KNOWLEDGE BASE & RULE CATALOG               │
       │  - knowledge/agricultural_rules.json (19 Rules)         │
       │  - knowledge/crop_profiles.json (10 Supported Profiles) │
       │  - knowledge/recommendation_metadata.json (Taxonomies)  │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │               TRIGGER & RULE EVALUATOR                  │
       │  - Feature availability & non-null validation           │
       │  - Crop applicability filtering                         │
       │  - Atomic & composite boolean evaluators (AND/OR/NOT)   │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │               PRIORITIZATION & RESOLUTION               │
       │  - Priority Scoring (0-100: Trigger × Evidence × Action)│
       │  - Evidence Strength & Confidence Formulation           │
       │  - Deduplication (Action-based consolidation)           │
       │  - Conflict Resolution (Crop > Environment > General)   │
       │  - Top 3-5 Selection (Full candidate audit retained)    │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │             FORMATTER & SAFETY VALIDATOR                │
       │  - Farmer-Facing View (Action-oriented, non-technical)  │
       │  - Technical View (Audit attribution, SHAP, percentiles)│
       │  - Executive Summary Synthesis                          │
       │  - Prohibited Language & Dosage Enforcement Scanner     │
       └─────────────────────────────────────────────────────────┘
```

---

## 3. Knowledge Sources
Every rule in CropIQ maintains strict source provenance to avoid disguising heuristic assumptions as established agronomy:
1. **Authoritative Agricultural Organizations**:
   - Food and Agriculture Organization of the United Nations (FAO): *Irrigation and Drainage Paper 56 (Crop Evapotranspiration)*, *Paper 33 (Yield Response to Water)*.
   - Indian Council of Agricultural Research (ICAR): National Rice Research Institute (NRRI), Indian Institute of Wheat and Barley Research (IIWBR), Indian Institute of Maize Research (IIMR).
   - CIMMYT: *International Maize and Wheat Improvement Center Crop Physiology Manuals*.
   - USDA ARS: *Remote Sensing in Agriculture Guidelines*.
2. **Empirical Dataset Evidence**:
   - Model-derived boundaries: Historical distribution percentiles ($P_{01}, Q_1, \text{Median}, Q_3, P_{99}$) derived from 1,625 observations across 90 fields in India.
3. **Prototype Heuristics**:
   - Rules addressing data quality, sensor latency checks, or generalized soil testing are explicitly tagged as `"source_type": "prototype_heuristic"` with `"source": null`.

---

## 4. Rule Design
Domain rules are separated from engine source code and persisted in `knowledge/agricultural_rules.json`. Each rule adheres to a strict schema:
```json
{
  "id": "water_001",
  "version": "1.0",
  "enabled": true,
  "category": "WATER",
  "priority": "HIGH",
  "actionability": "ACTIONABLE",
  "supported_crops": [],
  "required_features": ["soil_moisture"],
  "trigger": {
    "all": [
      {"feature": "soil_moisture", "operator": "less_than", "value": 20.0},
      {"feature": "soil_moisture", "operator": "negative_contribution"}
    ]
  },
  "title": "Review soil moisture and irrigation needs",
  "reason": "Soil moisture is below typical reference levels and contributed negatively to the model prediction.",
  "action": "Check root-zone moisture conditions and evaluate whether supplemental irrigation is needed.",
  "confidence": "HIGH",
  "source_type": "sourced",
  "source": "FAO Irrigation and Drainage Paper 56; ICAR Agronomy Guidelines",
  "limitations": [
    "Actual irrigation requirements depend on crop growth stage, soil texture, rooting depth, and localized microclimate.",
    "Model correlation does not guarantee specific yield response to irrigation."
  ],
  "what_if_supported": true
}
```

---

## 5. Trigger Types
The condition evaluator (`src/recommendations/rules.py`) supports 6 distinct trigger types:
1. **Model Contribution Triggers**: Flags features that pull down predictions (`negative_contribution`) or elevate estimates (`positive_contribution`).
2. **Threshold & Range Triggers**: Evaluates features using comparison operators (`less_than`, `greater_than`, `between`, `outside_range`, `less_than_feature`).
3. **Historical Distribution Triggers**: Evaluates estimated yield relative to crop reference percentiles (`below_q1`, `above_q3`, `below_median`).
4. **Crop Yield Risk Triggers**: Matches Phase 3 integrated risk classifications (`HIGH`, `MODERATE`, `LOW`).
5. **Model Uncertainty Triggers**: Evaluates ensemble dispersion (`HIGH` uncertainty spread $> 25\%$).
6. **Data Quality & OOD Triggers**: Catches inputs exceeding training ranges (`is_out_of_distribution`, `extrapolation_warning`, `has_data_quality_warnings`).

Composite boolean operations (`all` for AND, `any` for OR, and `not` for negation) allow multi-variable interaction rules.

---

## 6. Recommendation Categories
CropIQ enforces a controlled 9-category vocabulary:
- **WATER**: Irrigation review, moisture deficit mitigation, over-irrigation prevention.
- **SOIL**: Root zone moisture retention, standard soil testing guidance.
- **WEATHER**: Ambient heat alerts, drought contextual notes.
- **VEGETATION**: Remote sensing monitoring (NDVI, NDWI, SAVI), canopy greenness tracking.
- **CROP**: Crop-specific agronomic checks (Rice paddy depth, Wheat terminal heat, Maize silking moisture).
- **MONITORING**: Observational directives for uncertain or evolving conditions.
- **RISK**: High/moderate yield risk alerts.
- **DATA_QUALITY**: Out-of-distribution flags, missing sensor observations.
- **GENERAL**: Broad seasonal reminders.

---

## 7. Priority Method
Priority scores are computed transparently on a continuous 0–100 scale:

$$\text{Priority Score} = \text{round}\left(100 \times \left(0.35 \cdot S_{\text{trigger}} + 0.25 \cdot S_{\text{evidence}} + 0.20 \cdot S_{\text{actionability}} + 0.20 \cdot S_{\text{risk}}\right)\right)$$

Where:
- $S_{\text{trigger}}$: Baseline rule severity (1.0 for HIGH, 0.65 for MEDIUM, 0.35 for LOW).
- $S_{\text{evidence}}$: Evidence strength (1.0 for HIGH, 0.65 for MEDIUM, 0.35 for LOW).
- $S_{\text{actionability}}$: Actionability weight (1.0 for ACTIONABLE, 0.70 for MONITOR, 0.45 for INFORMATIONAL; elevated to 1.0 for critical DATA_QUALITY).
- $S_{\text{risk}}$: Normalized crop yield risk score ($\frac{\text{Risk Score}}{100}$).

### Mapping Thresholds:
- **HIGH**: Score $\ge 70$
- **MEDIUM**: Score $40 - 69$
- **LOW**: Score $< 40$

---

## 8. Confidence Method
`recommendation_confidence` reflects the reliability of the trigger:
- **HIGH**: Sourced authoritative rule + clear dataset/model evidence, in-distribution, low/moderate model uncertainty.
- **MEDIUM**: Documented rule or model signal without primary literature citation.
- **LOW**: Prototype heuristic or downgraded due to high model uncertainty or out-of-distribution input.

> [!NOTE]
> When `out_of_distribution == True` or `uncertainty == HIGH`, recommendation confidence is automatically penalized and capped at `MEDIUM` or downgraded to `LOW`.

---

## 9. Water Rules
Water-related recommendations integrate multiple observations rather than evaluating single sensors in isolation:
- `water_001`: Low soil moisture ($< 20.0$) + negative model contribution $\to$ Review root zone moisture and irrigation needs (Actionable, `what_if_supported: True`).
- `water_002`: High moisture ($> 35.0$) + positive contribution $\to$ Maintain schedule and avoid over-irrigation.
- `water_003`: Combined heat ($> 28^\circ\text{C}$), drought ($< 5\text{ mm}$ rain), and low moisture ($< 18.0$) $\to$ Prioritize drought-heat stress mitigation.
- `water_004`: Low moisture ($< 16.0$) despite high recent rain ($> 30\text{ mm}$) $\to$ Inspect field drainage, infiltration, or sensor probe calibration.

---

## 10. Soil Rules
- `soil_001`: Estimated yield below crop $Q_1$ $\to$ Consider standard laboratory soil fertility testing (pH, EC, organic carbon, available NPK) before next planting. **Strictly avoids prescribing unsourced chemical or fertilizer dosages**.
- `soil_002`: Soil moisture $>20\%$ below field expanding mean $\to$ Monitor localized drying trend and consider organic mulching.

---

## 11. Weather Rules
Weather variables are treated as contextual:
- `weather_001`: Elevated ambient temperature ($> 35^\circ\text{C}$) $\to$ Monitor canopy for heat scorch and elevated transpiration.
- `weather_002`: Precipitation deficit ($< 1\text{ mm}$) + negative contribution $\to$ Contextual advisory highlighting background dryness.

---

## 12. Vegetation Rules
Satellite vegetation indices (`NDVI`, `GNDVI`, `NDWI`, `SAVI`) are restricted to monitoring:
- `veg_001`: Low NDVI ($< 0.40$) + negative contribution $\to$ Field walkthrough for canopy vigor decline. **Strictly prohibits unverified disease or pest diagnosis**.
- `veg_002`: High NDVI ($> 0.65$) + positive contribution $\to$ Favorable canopy vigor supporting yield potential.
- `veg_003`: Depressed NDWI ($< -0.05$) + negative contribution $\to$ Monitor canopy water status and cross-reference with root-zone moisture.

---

## 13. Risk-Linked Rules
- `risk_001`: Integrated Risk Score $\ge 65/100$ (HIGH) $\to$ High yield risk alert prompting comprehensive review of top negative factors.
- `risk_002`: Integrated Risk Score $35 - 64/100$ (MODERATE) $\to$ Moderate yield risk alert prompting monitoring of downward factors.
- `uncertainty_001`: Relative Uncertainty $> 25\%$ (HIGH) $\to$ Cautious verification directive: verify ground conditions before major input commitments.

---

## 14. Conflict Resolution & Deduplication
1. **Deduplication**: When multiple candidate rules target the same functional category (e.g. general water check + combined heat/drought stress), the engine merges them into a single consolidated action, combines their evidence items, retains the highest priority score, and unites their agronomic limitations.
2. **Conflict Resolution**: Contradictory recommendations (e.g. "Review irrigation needs" vs. "Avoid over-irrigation") are resolved using an explicit precedence hierarchy:
   $$\text{Specific Crop Rule} \succ \text{Specific Environmental Condition} \succ \text{General Heuristic}$$
   If an active moisture deficit trigger is satisfied, over-irrigation warnings are automatically suppressed and logged in the diagnostic `RuleTracer`.

---

## 15. Safety Constraints & Language Auditing
CropIQ implements strict automated safety scanning via `src/recommendations/validator.py`:
- **Prohibited Causal / Guarantee Phrasing**: Scans and rejects strings containing `guarantee`, `guaranteed`, `will definitely`, `100% effective`, `will increase`, `will prevent`, `cure`, `diagnose`, `exact dosage`, `guaranteed yield`, or `crop will fail`.
- **Chemical / Fertilizer Prescription Block**: Regex scans block unverified dosage quantities (e.g. `20 kg/ha`, `50 kg of nitrogen`, `bags/acre`).
- **Limitation Requirement**: Every `ACTIONABLE` recommendation is strictly required to state at least one agronomic caveat.

---

## 16. Example Scenario Outputs

| Scenario | Input Profile | Risk Level | Top Action Category | Top Action Title | Priority |
|---|---|---|---|---|---|
| **Scenario 1: Normal** | Moisture: 28.0, NDVI: 0.70, Rain: 15.0, Temp: 24.0 | LOW | WATER / VEGETATION | Maintain adequate moisture and avoid over-irrigation | MEDIUM |
| **Scenario 2: Low Moisture** | Moisture: 12.0 | MODERATE | WATER | Review soil moisture and irrigation needs | HIGH |
| **Scenario 3: Depressed NDVI** | NDVI: 0.28, GNDVI: 0.25, SAVI: 0.20 | MODERATE | VEGETATION | Monitor canopy vigor and conduct field scouting | MEDIUM |
| **Scenario 4: High Yield Risk** | Moisture: 8.0, Rain: 0.0, Temp: 42.0, NDVI: 0.15 | HIGH | RISK / WATER | Mitigate combined drought and heat moisture stress | HIGH |
| **Scenario 5: High Uncertainty** | Relative Uncertainty: 0.35 | MODERATE | MONITORING | High model uncertainty: Verify field conditions | HIGH |
| **Scenario 6: Out-of-Distribution** | Temp: 75.0, Rain: 650.0 | HIGH | DATA_QUALITY | Inputs fall outside typical model training bounds | HIGH |
| **Scenario 7: Missing Rainfall** | Rainfall: None (Imputed) | MODERATE | DATA_QUALITY | Verify flagged data values to improve reliability | HIGH |
| **Scenario 8: Unsupported Crop** | Crop: Dragonfruit (Unseen) | MODERATE | WATER / VEG | Falls back gracefully to general rules; no CROP rule | MEDIUM |
| **Scenario 9: Conflicting Signals** | Moisture: 10.0, Rain: 45.0 | MODERATE | WATER | Inspect field drainage and soil moisture sensor reading | HIGH |

---

## 17. Testing & Verification
The Phase 4 test suite consists of 28 dedicated unit and integration tests across 6 test modules:
- `tests/test_rules.py`: Operator logic, numerical comparisons, composite AND/OR/NOT conditions.
- `tests/test_evaluator.py`: Trigger evaluation, crop applicability filtering, missing feature handling.
- `tests/test_prioritizer.py`: Priority score formulation, evidence strength, confidence, deduplication, conflict resolution.
- `tests/test_formatter.py`: Farmer vs technical views, executive summary generation.
- `tests/test_validator.py`: Schema validation, prohibited phrase scanning, dosage blocking.
- `tests/test_recommendations.py`: End-to-end integration across all 9 demonstration scenarios.

**Test Run Result:** All 57 unit tests across Phase 2, Phase 3, and Phase 4 passed in 7.14 seconds (`57/57 OK`).

---

## 18. Known Limitations
1. **Unconfirmed Target and Feature Units**: Target `yield` and `soil_moisture` units are unconfirmed from raw source metadata. Thresholds represent empirical dataset percentiles rather than universal physical constants.
2. **Absence of Phenological Stage**: Growth stage (seedling, tillering, flowering, maturity) is not recorded in the dataset. Rules state caveats regarding growth-stage sensitivity.
3. **Point Sensor vs Field Variability**: Remote sensing indices represent pixel aggregates, whereas moisture sensors represent point probes.

---

## 19. Roadmap to Phase 5 (What-If Simulation)
Phase 4 prepares the foundation for Phase 5's What-If Simulator:
- Features flagged with `what_if_supported: True` (specifically `soil_moisture`) can be adjusted in the simulation environment.
- Non-controllable variables (`rainfall`, `temperature`, `NDVI`) are tagged with `what_if_supported: False`.
- Non-causal framing is preserved: the simulator will project model scenario estimates rather than claiming biological causality.

# CropIQ Phase 4 Handoff

**Project:** CropIQ (AI-Powered Crop Yield Intelligence)  
**Phase Completed:** Phase 4 — Actionable Agricultural Recommendation Engine  
**Next Phase:** Phase 5 — What-If Simulator & Sensitivity Engine  

---

## Recommendation Engine
- **Engine:** CropIQ Deterministic Recommendation Engine
- **Version:** 1.0.0
- **Package Path:** `src/recommendations/`
- **Primary Function:** `generate_recommendations(input_data, prediction_result, explanation_result, risk_result, uncertainty_result)` or `generate_recommendations(intelligence_payload=analyze_crop_prediction(input_data))`

---

## Categories
- **Water:** Irrigation checks, moisture deficit warnings, drainage/sensor audits, over-irrigation prevention.
- **Soil:** Root zone moisture trends, standard soil fertility testing directives.
- **Weather:** Ambient heat monitoring, rainfall deficit contextual notes.
- **Vegetation:** NDVI vigor tracking, NDWI canopy moisture monitoring, SAVI stand density observation.
- **Risk:** High and moderate yield risk alerts linked directly to Phase 3 risk scoring.
- **Monitoring:** Ground-truthing directives when model uncertainty is elevated.
- **Data Quality:** Out-of-distribution input warnings and missing sensor flags.
- **Crop:** Specialized rules for supported crops (Rice paddy depth, Wheat terminal heat, Maize silking moisture).

---

## Rule Count
- **Total Rules:** 19
- **Enabled Rules:** 19
- **Disabled Rules:** 0
- **Knowledge Base File:** `knowledge/agricultural_rules.json`
- **Crop Profiles File:** `knowledge/crop_profiles.json` (10 supported crops: Rice, Wheat, Maize, Cotton, Pulses, Sugarcane, Soybean, Groundnut, Mustard, Millets)

---

## Evidence
- **Sourced Rules:** 11 rules (Citations from FAO Irrigation Papers 56/33, ICAR NRRI/IIWBR/IIMR/IIPR, CIMMYT, and USDA ARS).
- **Prototype Heuristics:** 8 rules (Explicitly labeled as prototype heuristics with `"source": null` for transparent hackathon auditing).

---

## Priority
- **Method:** Continuous 0–100 weighted linear scoring:
  $$\text{Priority Score} = \text{round}\left(100 \times \left(0.35 \cdot S_{\text{trigger}} + 0.25 \cdot S_{\text{evidence}} + 0.20 \cdot S_{\text{actionability}} + 0.20 \cdot S_{\text{risk}}\right)\right)$$
- **Levels:**
  - `HIGH` ($\ge 70$)
  - `MEDIUM` ($40 - 69$)
  - `LOW` ($< 40$)

---

## Confidence
- **Method:** Multi-factor evaluation combining source provenance, empirical dataset signals, ensemble uncertainty, and out-of-distribution status. Automatically penalized when `is_out_of_distribution == True` or `uncertainty == HIGH`.
- **Levels:** `HIGH`, `MEDIUM`, `LOW`

---

## Output Schema
```json
{
  "summary": {
    "total_generated": 5,
    "displayed": 4,
    "high_priority": 1,
    "medium_priority": 3,
    "low_priority": 0,
    "crop_specific_recommendations_available": true,
    "executive_summary": "Estimated Rice yield is 36.43 unconfirmed with an assessed MODERATE yield risk. The primary recommended action is to review soil moisture and irrigation needs. Field observations show moderate predictive variation; cross-reference with localized field checks."
  },
  "recommendations": [
    {
      "id": "water_001",
      "title": "Review soil moisture and irrigation needs",
      "category": "WATER",
      "priority": "HIGH",
      "actionability": "ACTIONABLE",
      "summary": "Soil moisture is below typical reference levels and contributed negatively to the model prediction.",
      "reason": "Soil moisture is below typical reference levels and contributed negatively to the model prediction.",
      "action": "Check root-zone moisture conditions and evaluate whether supplemental irrigation is needed.",
      "evidence": [
        "Soil Moisture was below benchmark level (18.5).",
        "Soil Moisture pulled down the model's yield estimate."
      ],
      "confidence": "HIGH",
      "limitations": [
        "Actual irrigation requirements depend on crop growth stage, soil texture, rooting depth, and localized microclimate.",
        "Model correlation does not guarantee specific yield response to irrigation."
      ],
      "what_if_supported": true
    }
  ],
  "all_candidates": [...],
  "rule_trace": [...],
  "warnings": []
}
```

---

## What-If Compatibility
- **Supported Variables for Simulation (`what_if_supported: true`):**
  - `soil_moisture` (Directly actionable via irrigation management)
- **Non-Simulatable Variables (`what_if_supported: false`):**
  - `rainfall` (Contextual weather)
  - `temperature` (Contextual weather)
  - `NDVI`, `GNDVI`, `NDWI`, `SAVI` (Monitoring indices; consequence rather than primary input)
  - `crop_type`, `latitude`, `longitude` (Fixed structural descriptors)

---

## Known Limitations
1. **Model Explanation $\neq$ Agronomic Causation**: Statistical feature contributions identify associative patterns in the historical dataset, not physical cause-and-effect mechanisms.
2. **Unconfirmed Target and Feature Units**: Target `yield` and `soil_moisture` units are unconfirmed from source metadata; all comparisons rely on empirical dataset distributions.
3. **Absence of Phenological Stage**: Crop phenology is not recorded in the raw data; recommendations provide general guidelines and prompt the user to verify growth stage on site.

---

## Phase 5 Requirements (What-If Simulator)
Phase 5 must build the **What-If Simulation Engine**:
1. **Single Model Reuse**: The simulator must feed modified scenarios into the existing trained Random Forest pipeline (`models/cropiq_yield_model.joblib`), never retraining or inventing a secondary model.
2. **Enforce Feature Actionability**: The simulator must only permit manipulation of features tagged with `what_if_supported: true` (`soil_moisture`) or contextual exploration scenarios clearly marked as exploratory (e.g. weather shifts).
3. **Non-Causal Framing**: Simulated outputs must strictly avoid claiming guaranteed crop responses (e.g., *"Under the model's learned patterns, an increase in soil moisture to 28.0 is associated with an estimated yield of 41.2 unconfirmed"* rather than *"Applying irrigation will increase yield by 4.8 tonnes"*).
4. **Boundary Clamping & OOD Checks**: What-if input modifications must be bounded against historical training percentiles $[P_{01}, P_{99}]$ to prevent unconstrained extrapolation.

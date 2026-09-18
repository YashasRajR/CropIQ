# CropIQ Phase 3 -> Phase 4 Handoff Report

**Project:** CropIQ (AI-Powered Crop Yield Intelligence)  
**Phase Completed:** Phase 3 — Explainability, Risk Assessment & Agricultural Insight Engine  
**Next Phase:** Phase 4 — Actionable Agronomic Recommendation Engine  

---

## 1. Prediction
- **Model Pipeline:** `models/cropiq_yield_model.joblib` (`ColumnTransformer` + `RandomForestRegressor`, 300 estimators).
- **Target Variable:** `yield`
- **Confirmed Unit:** **`unconfirmed`** (Consistently reported as unconfirmed across all phases; do not assume tonnes/ha or kg/ha).
- **Inference Verification:** Test MAE = 1.1438, Test RMSE = 2.3326, Test R² = 0.9169.

---

## 2. Explainability
- **Primary Method:** `SHAP (TreeExplainer)` applied to tree ensemble on 59 preprocessed features.
- **Resilient Fallback:** Feature ablation against training medians, guaranteeing exact mathematical conservation:
  $$\text{baseline\_yield} + \sum_{j=1}^{30} \text{contribution}_j = \text{predicted\_yield}$$
- **Global Importance:** Precomputed and cached in `models/global_feature_importance.json` (Top 3: Rainfall, NDVI, SAVI).
- **Local Explanation:** Returns Top 3 Positive Contributors, Top 3 Negative Contributors, and Top 5 Overall Contributors for each observation.
- **Categorical Mapping:** One-hot terms consolidated into human-readable crop display labels (e.g. `Crop Type: Rice`).

---

## 3. Yield Context
- **Reference Hierarchy:** Crop-Specific Historical Distribution $\to$ Overall Dataset Benchmark.
- **Benchmark Metrics:** $P_{10}$, $Q_1$ (25th), Median, $Q_3$ (75th), $P_{90}$, Mean, Std computed over 1,625 observations across 90 fields.
- **Relative Position:** Expressed quantitatively (e.g. *"in the upper historical quartile (above 75th percentile)"*).

---

## 4. Uncertainty
- **Method:** Spread across all 300 individual decision trees in the Random Forest ensemble.
- **Metrics:** Lower bound ($10\text{th percentile}$), Upper bound ($90\text{th percentile}$), Standard Deviation, Relative Spread ($\frac{\text{Upper} - \text{Lower}}{\text{Estimate}}$).
- **Classification:** `LOW` ($< 12\%$), `MODERATE` ($12\% - 25\%$), `HIGH` ($\ge 25\%$).
- **Disclaimers:** Model-derived uncertainty proxy, not a calibrated statistical guarantee.

---

## 5. Risk Assessment
- **Risk Levels:** `LOW` ($0-34$), `MODERATE` ($35-64$), `HIGH` ($65-100$).
- **Risk Score Formula:**
  $$\text{Risk Score} = \text{round}\left(0.50 \cdot C_{\text{yield}} + 0.25 \cdot C_{\text{uncertainty}} + 0.15 \cdot C_{\text{negative}} + 0.10 \cdot C_{\text{quality}}\right)$$
- **Decoupling Rule:** Agricultural risk is strictly separated from model uncertainty and data quality flags.

---

## 6. Warnings & Data Quality
- **Out-of-Distribution (OOD):** Evaluates input against historical training $[P_{01}, P_{99}]$ and $[\text{Min}, \text{Max}]$ bounds.
- **Extrapolation Warning:** Asserted when $\ge 2$ features fall outside absolute historical extremes.
- **Category Warnings:** Unseen crops encode gracefully to zero via `OneHotEncoder(handle_unknown='ignore')` while issuing a user warning.

---

## 7. API Contract for Phase 4

### Function Call:
```python
from src.intelligence import analyze_crop_prediction

result = analyze_crop_prediction(input_data)
```

### JSON Response Schema:
```json
{
  "prediction": {
    "yield": 36.43,
    "unit": "unconfirmed"
  },
  "context": {
    "reference_type": "crop",
    "crop": "Rice",
    "reference_median": 45.36,
    "reference_q1": 37.56,
    "reference_q3": 50.35,
    "relative_position": "in the lower historical quartile (below 25th percentile)"
  },
  "explanation": {
    "baseline": 40.49,
    "method": "SHAP (TreeExplainer)",
    "top_positive_factors": [
      {
        "feature": "temperature",
        "display_name": "Ambient Temperature",
        "observed_value": 9.88,
        "contribution": 0.12,
        "direction": "positive",
        "actionable_type": "NON_ACTIONABLE"
      }
    ],
    "top_negative_factors": [
      {
        "feature": "rainfall",
        "display_name": "Rainfall",
        "observed_value": 1.66,
        "contribution": -1.47,
        "direction": "negative",
        "actionable_type": "NON_ACTIONABLE"
      }
    ],
    "all_contributions": [...]
  },
  "uncertainty": {
    "estimate": 36.43,
    "lower": 31.41,
    "upper": 42.41,
    "std": 4.12,
    "relative_uncertainty": 0.30,
    "classification": "HIGH",
    "disclaimer": "Model-derived uncertainty estimate based on variation across ensemble decision trees; not a guaranteed statistical prediction interval."
  },
  "risk": {
    "level": "MODERATE",
    "score": 59,
    "drivers": [
      "Estimated yield (36.43) is 19.7% below the historical Rice reference median (45.36).",
      "Rainfall contributed negatively (-1.47) to the prediction based on learned patterns."
    ],
    "protective_factors": [
      "Ambient Temperature contributed positively (+0.12) to the prediction based on learned patterns."
    ],
    "component_scores": {
      "yield_deviation_score": 55.16,
      "uncertainty_score": 100.0,
      "negative_contributors_score": 28.0,
      "data_quality_score": 0.0
    }
  },
  "data_quality": {
    "warnings": [],
    "out_of_distribution": false,
    "extrapolation_warning": false
  },
  "insights": {
    "layer_1_summary": "Estimated Rice yield is 36.43 unconfirmed (MODERATE Risk, score 59/100), in the lower historical quartile (below 25th percentile).",
    "layer_2_key_factors": {
      "positive_factors": [...],
      "negative_factors": [...]
    },
    "layer_3_detailed_explanation": "..."
  }
}
```

---

## 8. Requirements for Phase 4 (Recommendation Engine)

1. **Feature Actionability Filter:** Phase 4 must use the `actionable_type` tags (`ACTIONABLE`, `MONITORING`, `NON_ACTIONABLE`, `FIXED_CHOICE`) provided in the explanation payload to ensure recommendations only suggest changes to features a farmer can realistically adjust (e.g. `soil_moisture` via irrigation vs. weather which can only be mitigated).
2. **Prioritize Risk Drivers:** Recommendations should specifically target the primary `risk_drivers` and `top_negative_factors`.
3. **Preserve Non-Causal Framing:** Recommendations must be phrased as decision-support suggestions rather than causal guarantees (e.g., *"Consider monitoring root zone moisture to mitigate low yield risk"* rather than *"Applying 20 mm irrigation will increase yield by 3 tonnes"*).

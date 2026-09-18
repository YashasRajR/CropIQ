# CropIQ Phase 2 -> Phase 3 Handoff Report

## 1. Model
- **Final Selected Model:** `Random Forest` (`RandomForestRegressor`)
- **Model Pipeline File:** `models/cropiq_yield_model.joblib`
- **Preprocessor File:** `models/cropiq_preprocessor.joblib`
- **Metadata File:** `models/model_metadata.json`

## 2. Dataset Partitioning
- **Total Samples:** 1625
- **Training Samples:** 1129
- **Validation Samples:** 239
- **Test Samples:** 257 (Isolated)
- **Unique Fields:** 90 (Zero field overlap across splits)

## 3. Target
- **Target Column:** `yield`
- **Confirmed Unit:** `unconfirmed` (Do not assume tonnes/ha or kg/ha)
- **Modeling Grain:** Per-observation concurrent yield nowcasting

## 4. Features
- **Numerical (29):** latitude, longitude, NDVI, GNDVI, NDWI, SAVI, soil_moisture, temperature, ... (+ 12 expanding history features)
- **Categorical (1):** `crop_type` (30 categories)
- **Excluded Metadata (5):** `field_id`, `date_of_image`, `source_dataset`, `raw_row_index`, `soil_moisture_flag`

## 5. Validation & Metrics
- **Splitting Strategy:** `GroupShuffleSplit` on `field_id` (70/15/15)
- **Cross-Validation:** 5-Fold `GroupKFold` on training data
- **Final Test MAE:** **1.1438**
- **Final Test RMSE:** **2.3326**
- **Final Test R²:** **0.9169**

## 6. Feature Importance & Behavior
- **Top 5 Drivers:**
  1. `rainfall`
  2. `NDVI`
  3. `SAVI`
  4. `crop_type_Sugarcane`
  5. `soil_moisture`
- **Dominant Categories:** Historical field expanding trends and concurrent weather (rainfall/temperature) explain the majority of yield variance.

## 7. Prediction API
- **Inference Utility:** `from src.ml.predict import predict_yield`
- **Input:** Single dictionary or DataFrame containing the 30 predictive features.
- **Output:**
```json
{
  "predicted_yield": 42.15,
  "unit": "unconfirmed"
}
```
- **Error Handling:** Unseen crop types handled via `OneHotEncoder(handle_unknown='ignore')` with automated warning alerts. Target presence strictly rejected.

## 8. Phase 3 Requirements
1. **Explain Individual Predictions:** Compute local feature attributions (SHAP or TreeExplainer surrogate).
2. **Generate Human-Readable Key Factors:** Classify factors into Positive Drivers and Risk Factors.
3. **Build Risk Classification:** Derive risk tiers (Low, Moderate, High Risk) from weather stress and vegetation deficits.
4. **Agronomic Recommendations:** Provide actionable guidance without presenting associative model coefficients as deterministic causal guarantees.

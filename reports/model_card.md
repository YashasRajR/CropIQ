# CropIQ Model Card — Yield Prediction Regressor

## Model Details
- **Model Name:** CropIQ Yield Regressor
- **Version:** 2.0.0
- **Model Type:** Supervised Machine Learning Pipeline (`ColumnTransformer` + `Random Forest`)
- **Algorithm Class:** `RandomForestRegressor`
- **Release Date:** 2026-09-18
- **Developed By:** CropIQ Machine Learning Team

## Intended Use
- **Intended Use Cases:** Real-time yield estimation and decision support based on satellite vegetation vigor, soil moisture, ambient weather conditions, and seasonal crop history.
- **Target Audience:** Agronomists, agricultural extension officers, farm managers, and decision-support systems.
- **Not Intended For:** Direct financial, insurance underwriting, or legal crop claims without independent ground-truth field audit.

## Training Data & Setup
- **Dataset:** `data/processed/crop_yield_model_data.csv` (Phase 1 validated)
- **Observations:** 1368 training/validation rows.
- **Geographic Coverage:** 90 agricultural fields across India (latitudes 9.80°N–34.38°N, longitudes 73.08°E–93.34°E).
- **Temporal Coverage:** Calendar year 2023 (January–December 2023).
- **Features (30):** 2 geographic coordinates, 4 vegetation indices (NDVI, GNDVI, NDWI, SAVI), 3 soil/weather features, 8 temporal/cyclical features, 12 historical field-level expanding trends, and 1 categorical feature (`crop_type`).

## Validation & Evaluation
- **Split Strategy:** Leakage-safe `GroupShuffleSplit` on `field_id` (70% Train, 15% Val, 15% Test).
- **Cross-Validation:** 5-Fold `GroupKFold` on training partition.
- **Final Test Set Size:** 257 observations across unseen test fields.

### Verified Test Metrics
- **MAE:** 1.1438 (unconfirmed)
- **RMSE:** 2.3326 (unconfirmed)
- **R²:** 0.9169
- **MAPE:** 2.76%

## Known Limitations
1. **Target Unit:** Source data did not establish physical units; reported as unconfirmed.
2. **Nowcasting Grain:** Models concurrent yield observations, not multi-month pre-planting forecasts.
3. **Single Year Data:** Weather cycles spanning multiple years are not captured.
4. **Empirical Association:** Features reflect predictive correlation, not causal physiological laws.

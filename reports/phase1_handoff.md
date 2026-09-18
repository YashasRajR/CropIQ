# CropIQ Phase 1 -> Phase 2 Handoff

## Dataset

```
Dataset name: CropIQ model-ready dataset (built from Dataset 1: field/satellite/weather observations)
Final row count: 1625
Final column count: 36 (5 metadata + 30 features + 1 target)
Target: yield
Target unit: UNCONFIRMED (source metadata did not state it - do not assume tonnes/ha or kg/ha without further source confirmation)
Modeling grain: one row = one field observation at a specific date, with a concurrent (same-date) yield value
```

## Features

```
Numerical features: latitude, longitude, NDVI, GNDVI, NDWI, SAVI, soil_moisture,
    temperature, rainfall, year, month, day_of_year, month_sin, month_cos,
    doy_sin, doy_cos, field_obs_number, NDVI_field_expanding_mean/_std,
    GNDVI_field_expanding_mean/_std, SAVI_field_expanding_mean/_std,
    soil_moisture_field_expanding_mean/_std, rainfall_field_expanding_mean/_std,
    temperature_field_expanding_mean/_std
Categorical features: crop_type (30 categories, not yet encoded - encode in a
    Phase 2 sklearn Pipeline/ColumnTransformer, fit on train split only)
Temporal features: year, month, day_of_year, month_sin/cos, doy_sin/cos, field_obs_number
Geographic features: latitude, longitude
Metadata/grouping columns (excluded from model input): field_id, date_of_image,
    source_dataset, raw_row_index, soil_moisture_flag
Removed columns: Unnamed: 13, Unnamed: 14 (empty spreadsheet-export artifacts)
```

## Data Quality

```
Missing values: 0 in raw Dataset 1. The 12 expanding-history features have
    90 (mean) / 180 (std) NaNs by design for each field's first 1-2
    observations (no prior history exists yet) - Phase 2 must decide
    whether to impute (fit on train only), drop those rows, or use a
    model tolerant of NaN (e.g. tree-based models with native NaN support).
Duplicates: 0 exact, 0 on field_id+date_of_image.
Outliers: not removed; see data_quality_report.md Section 15. soil_moisture
    has 1 flagged row (>100, unconfirmed bound) - not removed, flagged via
    soil_moisture_flag.
Invalid records: none identified as impossible (no negative yield, no
    vegetation index outside theoretical bounds).
Potential biases: small sample (90 fields, single year 2023), unclear
    real-world provenance (dataset shows synthetic-like regularity - see
    Limitation 4 in data_quality_report.md), no state/district-level
    geographic balance analysis performed.
```

## Leakage

```
Confirmed leakage: none (no production/harvest_quantity/yield_calculated-style
    target-derived columns present).
Potential leakage / risk: (1) NDWI is an exact deterministic negation of
    GNDVI - redundant, not target leakage, but avoid treating it as an
    independent signal. (2) Field-level leakage risk from naive random
    splitting - MUST use grouped splitting (see below).
Split strategy: GroupShuffleSplit / GroupKFold grouped on field_id. Do not
    use a random row split. If reframing as a forecasting (not nowcasting)
    task, combine group splitting with a chronological holdout, but note
    no planting/harvest date exists to formally anchor "pre-harvest."
```

## Recommended Phase 2

```
Candidate models: Tree-based ensemble regressors (Random Forest, Gradient
    Boosting / XGBoost / LightGBM) are a reasonable starting point given
    the mixed numeric/categorical feature set, the presence of NaNs in the
    engineered history features, and the moderate feature correlation
    structure (SAVI/NDVI/GNDVI are correlated with each other) - tree
    ensembles handle both without requiring scaling or exhaustive
    multicollinearity removal (Rule 27). A simple linear baseline
    (e.g. Ridge with a ColumnTransformer for crop_type one-hot encoding
    and imputation for the history features) is recommended alongside as
    an interpretability/sanity-check baseline, not because performance is
    known to favor it.
Recommended validation strategy: GroupShuffleSplit or GroupKFold on
    field_id, as documented above. Given the small dataset (1,625 rows,
    90 groups), prefer GroupKFold with multiple folds over a single
    holdout to get a more stable estimate.
Recommended metrics: MAE and RMSE (regression, on the original yield
    scale, whose unit is unconfirmed - report unit-agnostically), and R^2
    for explained-variance context. Given the target unit is unconfirmed,
    avoid over-interpreting absolute error magnitudes until the unit
    question is resolved with the data provider.
Potential feature engineering: crop-type target encoding is tempting but
    risks leakage if not fit strictly on the training fold - evaluate
    carefully within Phase 2's cross-validation loop. Revisit
    lat/long-based regional clustering if more geographic granularity is
    later confirmed.
Potential limitations: model performance metrics obtained on this dataset
    should NOT be presented as claims about real agricultural yield
    prediction accuracy without first resolving (a) the confirmed unit of
    yield, (b) whether yield is genuinely meant to be predicted from
    same-date conditions ("nowcast") vs. forecast ahead of harvest, and
    (c) the dataset's apparent synthetic-like regularity (Limitation 4 in
    data_quality_report.md). These should be stated explicitly in any
    Phase 2/3 write-up or demo.
```

Model performance has not yet been measured - no candidate-model
recommendation above is based on measured results; these are structural
recommendations only (per the Phase 1 brief's instruction not to fabricate
performance-based recommendations).

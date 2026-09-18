# CropIQ Data Quality Report

Phase 1 - Data Foundation. Covers `data/raw/dataset1_field_satellite.csv`
(primary) and `data/raw/dataset2_indian_historical_crop_yield.csv`
(secondary/contextual). Generated from the reproducible pipeline in
`src/data/`; regenerate the underlying numbers with:
```
python src/data/profile_data.py
python src/data/validate_data.py
python src/data/clean_data.py
python src/data/preprocess.py
```

## 1. Executive Summary

Dataset 1 is a small (1,625-row), unusually clean (zero missing values, zero
duplicates) set of 1,625 satellite/field observations across 90 Indian
fields in 2023, one crop per field, with vegetation indices, soil moisture,
weather, and a `yield` value per observation. The central finding of this
phase is that **`yield` is not a single season-final harvest figure - it
varies at every observation date for the same field/crop**, so the
appropriate modeling grain is per-observation (see Section 9-10), not
per-field-season. No confirmed target leakage columns exist. `NDWI` is an
exact deterministic negation of `GNDVI` (redundant, not leakage). Field-level
grouping is essential for a leakage-safe train/validation split (Section 23).
Dataset 2 could not be defensibly joined to Dataset 1 (no shared location,
year, or full crop key) and is retained only as contextual reference.
Validation result: **PASS WITH WARNINGS** (units unconfirmed for `yield`,
`soil_moisture`, `rainfall`; 1 row with soil_moisture > 100).

## 2. Dataset Overview

| | Dataset 1 (primary) | Dataset 2 (secondary) |
|---|---|---|
| Rows | 1,625 | 50,765 |
| Columns | 13 (raw) / 36 (model-ready) | 20 |
| Grain | field observation (date) | district x crop x year |
| Coverage | 90 fields, 2023, India | 311 districts, 20 states, 1966-2017, India |
| Crops | 30 | 4 |
| Target | `yield` (unit unconfirmed) | `Yield_kg_per_ha` (kg/ha, confirmed) |

## 3. Dataset Dimensions

Dataset 1 raw: 1,625 rows x 13 columns (after dropping 2 all-null
`Unnamed: 13`/`Unnamed: 14` spreadsheet-export artifact columns, originally
15). Cleaned interim: 1,625 rows x 16 columns (+ `soil_moisture_flag`,
`source_dataset`, `raw_row_index`). Model-ready: 1,625 rows x 36 columns
(+ 18 engineered temporal/history features, - the 2 artifact columns).

## 4. Schema

`field_id` (str), `date_of_image` (str -> datetime), `latitude`/`longitude`
(float), `NDVI`/`GNDVI`/`NDWI`/`SAVI` (float), `soil_moisture` (float),
`temperature` (float), `rainfall` (float), `crop_type` (str/categorical),
`yield` (float). Full per-column profile: `reports/profile_dataset1_columns.csv`.
Schema validation: **PASS** (all required columns present, correct
inferable types).

## 5. Missing Values

**Zero missing values in any column of Dataset 1** (confirmed by both
`profile_data.py` and `validate_data.py`). No imputation was necessary or
performed. The imputation STRATEGY that would apply if future data
extraction introduces gaps is documented in `clean_data.py` and Section 21
below, and is exercised defensively in code (it is simply a no-op on this
particular file).

## 6. Duplicate Analysis

- Exact duplicate rows: **0**
- `field_id` + `date_of_image` key duplicates: **0**

No duplicates were found, so no rows were dropped on this basis.

## 7. Data Type Issues

`date_of_image` arrives as a `DD-MM-YYYY` string and is explicitly parsed
with `format="%d-%m-%Y"` (never left to pandas' format auto-inference, which
can silently swap day/month). Zero parse failures. All numeric columns
already load as `float64`/`int64` with no coercion needed. `crop_type` is
already Title Case with no leading/trailing whitespace in the raw file (0
values changed by the defensive normalization pass).

## 8. Target Variable Analysis

`yield`: min 26.85, max 89.29, mean 40.49, std 8.17, no negative or zero
values, no missing values. Distribution is right-skewed with a long tail
into the 60-90 range for a handful of rows (see `reports/fig_target_distribution.png`).
Strongest correlations: `rainfall` (r=0.756), `SAVI` (r=0.340), `NDVI`
(r=0.340) - i.e. yield tracks concurrent rainfall and vegetation vigor
fairly strongly, consistent with either a genuine agronomic relationship or
(more likely, given the dataset's very regular structure) a partly
formula-driven synthetic generation process.

## 9. Target Semantics (critical finding)

For every one of the 90 fields, `crop_type` is constant across all of that
field's rows, but **`yield` is different at every single observation date**
- e.g. `Field_1` (Rice) has 16 distinct yield values across 16 dates
spanning January through December 2023, ranging 30.87 to 55.63. Across all
90 fields, **0 fields have a constant yield value across their
observations** (i.e. `n_yield_vals == n_obs` for every field). This rules
out the assumption that `yield` represents one fixed season-final harvest
number that was simply repeated across satellite passes.

Combined with `yield`'s strong correlation to *concurrent* rainfall and
vegetation indices at the *same* observation date, the most defensible
interpretation is that `yield` in this dataset is a **per-observation
yield estimate/proxy tied to conditions at that specific date**, not a
single end-of-season harvest total. This is NOT silently "fixed" - it is
documented here and drives the modeling-grain decision in Section 10.

## 10. Modeling Grain

**One row = one field observation at a specific date, with a concurrent
yield value estimated/observed for that date.**

This was chosen (per Rule to never choose arbitrarily) because: (a) yield
varies with every observation rather than being constant per field-season,
(b) no separate "season" or "harvest event" identifier exists to aggregate
to, and (c) yield's correlation with same-date rainfall/vegetation indices
indicates the target is meant to be predicted from same-date conditions
rather than forecast ahead of a future single harvest event. **Phase 2 should
treat this as a same-date "nowcasting" task** (predict yield from
concurrently observed field conditions) rather than a pre-harvest
forecasting task, unless the modeling team can obtain clarifying metadata
that redefines `yield` as a true season-final figure.

## 11. Leakage Analysis

No columns resembling `production`, `harvest_quantity`,
`yield_calculated`, `total_production`, or `yield_per_area` exist in
Dataset 1 - **no confirmed target-derived leakage columns**.
`NDWI` is an exact deterministic negation of `GNDVI` in every row
(`NDWI == -GNDVI`, verified programmatically) - this is a **redundancy /
multicollinearity** finding, not leakage from the target, and per Rule 27
it is retained (not auto-removed) with a flag in the data dictionary for
Phase 2 feature-selection review.
**Field-level leakage risk (the main real risk here):** each field_id
contributes 12-25 rows. A naive random row split would put multiple
observations of the SAME field into both train and validation, letting the
model implicitly memorize field-specific yield baselines rather than
generalizing - see Section 23 for the required mitigation.

## 12. Temporal Analysis

Observation dates span 2023-01-01 to 2023-12-27 (360-day span), 25 distinct
dates, with no dates before 2023 or in the future relative to the dataset's
own coverage. Because every field/crop combination has observations spread
across essentially the whole year (see `reports/fig_temporal_coverage.png`),
and because `yield` is concurrent with each date's conditions rather than a
single deferred harvest figure (Section 9), a strict "before vs. after
harvest" split of observations is not meaningful with the fields available
in the raw schema - there is no planting or harvest date column to anchor
such a split. **This is documented as an open limitation**: the dataset does
not currently support distinguishing a true pre-harvest forecasting setting
from the same-date nowcasting setting adopted in Section 10.

## 13. Geographic Analysis

90 fields, 90 unique (lat, longitude) pairs (1:1 with field_id - i.e. each
field is a fixed physical location that is never re-geocoded across its
observations). All coordinates fall within India's approximate bounding
box (lat 9.80-34.38N, lon 73.08-93.34E). See `reports/fig_geographic_distribution.png`.
No missing or duplicate coordinates. Geographic imbalance across specific
sub-regions was not further broken out in Phase 1 due to the small field
count (90) and absence of state/district labels in Dataset 1; this is
listed as a limitation in Section 24.

## 14. Crop Distribution

30 distinct crop types, ranging from 39 observations (Coconut) to 69
(Saffron) - a roughly even spread (no crop has fewer than 39 rows), so no
crop is at extreme risk of insufficient sample size for Phase 2, though
per-crop sample sizes are still modest in absolute terms. Full breakdown:
`reports/profile_dataset1_categorical.csv` and `reports/fig_crop_distribution.png`.

## 15. Outlier Analysis

IQR-based outlier counts per numeric column (`k=1.5`) are computed in the
notebook (Section 15 there); `soil_moisture` and `yield` show the outliers
one would expect from their skew, but none were removed automatically -
Rule 10 requires a defensible reason, and none of the flagged values are
physically impossible (all vegetation indices remain within their
theoretical bounds; yield remains positive). The single most concrete
"suspicious value" finding is the soil_moisture row described in Section 16.

## 16. Satellite Feature Analysis

`NDVI` range [-1.0, 0.835], `GNDVI` range [-1.0, 0.746], `NDWI` range
[-0.746, 1.0], `SAVI` range [-1.496, 1.253] - all within their theoretically
valid ranges, so nothing was clipped (Rule: don't clip without evidence of
invalidity). **`NDWI` is an exact deterministic negation of `GNDVI`** for
every row (verified: `np.allclose(NDWI, -GNDVI)` is True) - flagged as a
likely synthetic-generation artifact / redundant feature, not altered.

## 17. Weather Feature Analysis

`temperature`: range -4.79 to 44.98, assumed Celsius (plausible for India's
range of climates/altitudes/seasons, e.g. Saffron fields at higher
latitude/altitude in winter) but **not explicitly confirmed by source
metadata**. `rainfall`: range 0.24 to 93.37, **unit and accumulation window
(daily / since-last-observation / monthly) not confirmed by source
metadata** - documented rather than guessed (Rule 3), and no daily/annual
mixing assumption was applied.

## 18. Soil Feature Analysis

`soil_moisture`: range 4.43 to 102.13. **1 of 1,625 rows (Field_62,
2023-01-04) exceeds a commonly-assumed 0-100 percentage bound** (value
102.13). Because the 0-100 bound itself is not confirmed by source
metadata, and every other field of that row is unremarkable, this row was
**flagged via a new `soil_moisture_flag` column rather than deleted or
altered** (Rule 11: don't blindly fill/alter values).

## 19. Correlation Analysis

Pearson correlations with `yield`: rainfall 0.756, SAVI 0.340, NDVI 0.340,
longitude 0.161, GNDVI 0.141, temperature 0.071, latitude -0.074, NDWI
-0.141 (mirrors GNDVI by construction), soil_moisture -0.175. Full matrix:
`reports/fig_correlation_matrix.png`. No causal interpretation is implied
(Rule: correlation != causation) - this is used only to understand structure
and flag `rainfall` as the single strongest linear predictor available.

## 20. Data Cleaning Decisions

1. Dropped 2 all-null `Unnamed: 13`/`Unnamed: 14` columns (spreadsheet
   export artifact, 0 information content).
2. Parsed `date_of_image` from `DD-MM-YYYY` string to datetime (explicit
   format, 0 failures).
3. Ran a defensive `crop_type` normalization pass (strip / collapse
   whitespace / Title Case) - 0 values changed, since raw data was already
   clean.
4. No missing-value handling needed (0 missing values existed).
5. No duplicate handling needed (0 duplicates existed).
6. Flagged (did not delete or alter) the 1 soil_moisture row exceeding 100
   via `soil_moisture_flag`.
7. Added `source_dataset` and `raw_row_index` traceability columns.
8. No unit conversions applied (`yield`, `soil_moisture`, `rainfall` units
   unconfirmed - Rule 3/38).

Full rationale and code: `src/data/clean_data.py`.

## 21. Feature Engineering Decisions

All engineered features are computed **per field_id, using only that
field's own strictly-prior observations** (via `.shift(1).expanding()`
after sorting by date within each field) - never using another field's data
and never using the current or a future row's own value, to avoid leakage:

- `year`, `month`, `day_of_year`, `month_sin/cos`, `doy_sin/cos` - cyclical
  temporal features, justified because 25 distinct dates span a full year
  and seasonal cyclicality is plausible for agriculture.
- `field_obs_number` - ordinal position within the field's own observation
  sequence.
- `<NDVI|GNDVI|SAVI|soil_moisture|rainfall|temperature>_field_expanding_mean`
  and `_std` - each field has 12-25 dated observations (justifying a
  trend/history feature), ordering is meaningful (chronological), and the
  `shift(1)` guarantees no same-row or future leakage. The first
  observation of each field is NaN for `_mean` (nothing prior exists) and
  the first two are NaN for `_std` (need >=2 points for a standard
  deviation) - left as NaN, not imputed (90 / 180 NaNs respectively out of
  1,625 rows).

Not created: raw one-hot encodings of `crop_type` (deferred to a Phase 2
sklearn pipeline, per Rule 12/36) and no scaling of any numeric column
(Rule 12/37).

## 22. Final Feature Set

30 feature columns (see `reports/data_dictionary.md` for the complete,
typed list): 2 geographic, 4 vegetation indices, 1 soil, 2 weather, 1
categorical (`crop_type`), 7 temporal, 1 ordinal-history, and 12
field-history rolling statistics (6 metrics x mean/std). `field_id` is
retained as metadata/grouping only and excluded from the feature set
(Rule 6). Target: `yield`.

## 23. Recommended Train/Validation Split

**Do not use a naive random row split.** Because 90 fields each contribute
12-25 rows, a random split would place different observations of the same
field into both train and validation, letting the model leak
field-specific baselines. **Recommended: `GroupShuffleSplit` (or
`GroupKFold`) grouped on `field_id`**, so an entire field's observations
stay together in either train or validation. If Phase 2 instead frames the
task as forecasting rather than nowcasting (Section 10/12), a
`field_id`-grouped split combined with a chronological holdout (train on
earlier dates, validate on later dates, still respecting field grouping)
should be considered, but no reliable planting/harvest anchor currently
exists to formalize that as the default recommendation.

## 24. Dataset Limitations

1. `yield`, `soil_moisture`, and `rainfall` units are not confirmed by any
   source metadata - documented as unconfirmed rather than guessed.
2. `yield`'s semantics (per-observation vs. season-final) required
   inference from the data itself (Section 9) rather than being stated by
   the source.
3. No planting/harvest date exists, so pre- vs. post-harvest timing of
   observations, and therefore a genuine pre-harvest forecasting setup,
   cannot be constructed from this schema alone.
4. `NDWI` duplicates `GNDVI` information exactly (deterministic negation),
   likely indicating the dataset is synthetically generated rather than
   measured from real satellite imagery - overall model performance and
   any claimed real-world generalizability should be caveated accordingly.
5. Small scale: 90 fields, 1,625 rows, single calendar year (2023) - limits
   how much temporal/geographic generalization Phase 2 can credibly claim.
6. No state/district labels in Dataset 1, limiting region-level analysis
   depth versus Dataset 2.
7. Dataset 2 could not be defensibly merged (Section 11 of
   `dataset_source.md`) and so contributes no additional training rows.

## 25. Final Dataset Location

`data/processed/crop_yield_model_data.csv` - 1,625 rows x 36 columns
(5 metadata + 30 features + 1 target).

## 26. Reproducibility Instructions

From the repository root, with dependencies from `requirements.txt`
installed:
```bash
python src/data/profile_data.py
python src/data/validate_data.py
python src/data/clean_data.py
python src/data/preprocess.py
```
Each script is idempotent and reads only from `data/raw/` (never modified)
or the previous pipeline stage's output. The exploration notebook
(`notebooks/01_data_exploration.ipynb`) can be re-run top-to-bottom
independently and regenerates all figures in `reports/`.

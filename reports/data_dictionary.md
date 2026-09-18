# CropIQ - Data Dictionary

Covers the **model-ready dataset**: `data/processed/crop_yield_model_data.csv`
(1625 rows x 36 columns). Columns are grouped by role. See
`reports/data_quality_report.md` for the full investigation behind these
decisions.

## Metadata / identifier columns (excluded from ML features)

| Column | Description | Type | Unit | Role | Source | Missing Handling |
|---|---|---|---|---|---|---|
| `field_id` | Unique field identifier (90 distinct fields) | string | N/A | Group/ID | Dataset 1 | none missing; retained for grouping, excluded from features per Rule 6 |
| `date_of_image` | Date of the satellite/field observation | datetime (parsed from DD-MM-YYYY) | date | Metadata / temporal key | Dataset 1 | none missing |
| `source_dataset` | Traceability tag identifying the originating raw file | string (constant) | N/A | Metadata | derived | n/a |
| `raw_row_index` | Original row index in the raw CSV, for auditability | int | N/A | Metadata | derived | n/a |
| `soil_moisture_flag` | Flags the 1 row where soil_moisture > 100 (unconfirmed upper bound) | string (`ok` / `above_100_unconfirmed_bound`) | N/A | QA metadata | derived | n/a |

## Raw feature columns (Dataset 1)

| Column | Description | Type | Unit | Role | Source | Missing Handling |
|---|---|---|---|---|---|---|
| `latitude` | Field latitude | float | decimal degrees | Feature | Dataset 1 | none missing; validated within India bounding box (6-38N) |
| `longitude` | Field longitude | float | decimal degrees | Feature | Dataset 1 | none missing; validated within India bounding box (68-98E) |
| `NDVI` | Normalized Difference Vegetation Index | float | index, theoretical range [-1, 1] | Feature | Dataset 1 | none missing |
| `GNDVI` | Green Normalized Difference Vegetation Index | float | index, theoretical range [-1, 1] | Feature | Dataset 1 | none missing |
| `NDWI` | Normalized Difference Water Index | float | index, theoretical range [-1, 1] | Feature | Dataset 1 | none missing. **Data quality note: `NDWI` is an exact deterministic negation of `GNDVI` for every row in this dataset (`NDWI == -GNDVI`), i.e. it carries no independent information here. Retained (not removed, per Rule 27) but flagged for Phase 2 feature-selection review.** |
| `SAVI` | Soil Adjusted Vegetation Index | float | index, theoretical range roughly [-1.5, 1.5] | Feature | Dataset 1 | none missing |
| `soil_moisture` | Soil moisture reading | float | unit not confirmed by source metadata (commonly a 0-100 scale is assumed but NOT verified) | Feature | Dataset 1 | none missing; 1 row (of 1625) exceeds 100, flagged via `soil_moisture_flag`, value retained unaltered |
| `temperature` | Ambient temperature at observation | float | assumed Celsius (not explicitly confirmed by source); range -4.8 to 45.0 is plausible for Celsius across India's climate zones and altitudes | Feature | Dataset 1 | none missing |
| `rainfall` | Rainfall associated with the observation | float | unit and accumulation period (daily / cumulative / since-last-observation) not confirmed by source metadata | Feature | Dataset 1 | none missing |
| `crop_type` | Crop grown on the field (fixed per field_id across all its observations) | categorical (string) | N/A | Feature | Dataset 1 | none missing; 30 categories, already clean (Title Case, no whitespace) in raw data; a defensive normalization pass is still run in `clean_data.py` |

## Engineered feature columns (created in `src/data/preprocess.py`)

| Column | Description | Type | Unit | Role | Source | Missing Handling |
|---|---|---|---|---|---|---|
| `year` | Calendar year of `date_of_image` | int | year | Feature | derived | none missing (all 2023) |
| `month` | Calendar month (1-12) | int | month | Feature | derived | none missing |
| `day_of_year` | Day of year (1-366) | int | day | Feature | derived | none missing |
| `month_sin`, `month_cos` | Cyclical encoding of month | float | n/a | Feature | derived | none missing |
| `doy_sin`, `doy_cos` | Cyclical encoding of day-of-year | float | n/a | Feature | derived | none missing |
| `field_obs_number` | Ordinal position of this row within its field's own chronological observation sequence (1, 2, 3, ...) | int | n/a | Feature | derived | none missing |
| `NDVI_field_expanding_mean` / `_std` | Mean/std of NDVI over this field's STRICTLY PRIOR observations only (shift(1).expanding()) | float | index | Feature | derived | NaN for each field's 1st (mean) and 1st-2nd (std) observation - no prior history exists yet; intentionally left NaN, not imputed |
| `GNDVI_field_expanding_mean` / `_std` | Same, for GNDVI | float | index | Feature | derived | same as above |
| `SAVI_field_expanding_mean` / `_std` | Same, for SAVI | float | index | Feature | derived | same as above |
| `soil_moisture_field_expanding_mean` / `_std` | Same, for soil_moisture | float | unconfirmed | Feature | derived | same as above |
| `rainfall_field_expanding_mean` / `_std` | Same, for rainfall | float | unconfirmed | Feature | derived | same as above |
| `temperature_field_expanding_mean` / `_std` | Same, for temperature | float | assumed Celsius | Feature | derived | same as above |

## Target

| Column | Description | Type | Unit | Role | Source | Missing Handling |
|---|---|---|---|---|---|---|
| `yield` | Crop yield associated with this specific field observation date (see "Target Semantics" in the data quality report - this is a PER-OBSERVATION value, not a single season-final harvest figure) | float | **unit could not be confidently established from source metadata** - values range 26.9-89.3, too low to plausibly be tonnes/hectare for most listed crops and too low to be raw kg for a whole field; documented as unconfirmed rather than guessed (Rule 3) | Target | Dataset 1 | rows with missing target would be dropped (none were missing in this dataset) |

## Dataset 2 (secondary / contextual - NOT merged; see dataset_source.md)

Dataset 2 (`data/raw/dataset2_indian_historical_crop_yield.csv`) is documented
separately as it is not part of the model-ready dataset. Its columns are
profiled in `reports/profile_dataset2_columns.csv`.

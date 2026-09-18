# CropIQ - Dataset Source Documentation

## Dataset 1 (Primary) - Field / Satellite / Weather Observations

- **Filename (raw):** `datasets/yield_prediction_dataset.csv` (as provided in the project folder), preserved unchanged at `data/raw/dataset1_field_satellite.csv`
- **Provider / author:** Not stated in the file itself; no accompanying metadata, README, or license file was supplied alongside the dataset in the project folder.
- **Original URL:** Not available - the file was already present locally with no source link attached. **This should be confirmed with whoever supplied the dataset before public use or publication of the CropIQ project**, since provenance and licensing terms are currently unknown.
- **Download date:** Unknown (file already present in the project's `datasets/` folder at the start of Phase 1, 2026-09-18).
- **License:** Unknown / unconfirmed. Treat as internal/competition-use only until confirmed.
- **Description:** 1,625 satellite/field observations across 90 distinct agricultural fields in India, spanning crop years 2023, with vegetation indices (NDVI, GNDVI, NDWI, SAVI), soil moisture, weather (temperature, rainfall), crop type, and a `yield` value recorded at each observation date.
- **Geographic scope:** All 90 fields fall within India's approximate bounding box (latitude 9.8-34.4N, longitude 73.1-93.3E) - consistent with, but not proof of, genuine India-wide coverage.
- **Temporal scope:** 2023-01-01 to 2023-12-27 (single calendar year), 25 distinct observation dates, 12-25 observations per field.
- **Target definition:** `yield`, but its precise semantics are ambiguous - see "Target Semantics" in `data_quality_report.md`. It is NOT confirmed to be a single season-final harvest figure; it varies at every observation date for the same field and crop.
- **Known limitations:**
  - No unit is stated for `yield`, `soil_moisture`, or `rainfall`.
  - No explicit planting/harvest date is provided, so pre-harvest vs. post-harvest timing of each observation cannot be determined with certainty.
  - `NDWI` is an exact deterministic negation of `GNDVI` in every row - it is very likely synthetically generated rather than an independently measured index (see data_quality_report.md).
  - The overall value ranges and the very regular structure (exactly one crop per field, no missing data at all, no duplicate rows) are consistent with a synthetically generated or heavily curated dataset rather than raw field instrumentation; this should be treated as a strong caveat on real-world generalizability.
- **Preprocessing performed:** See `src/data/clean_data.py` and `src/data/preprocess.py` docstrings, and section 20/21 of `data_quality_report.md`.
- **Primary or secondary:** **Primary** - this is the dataset the CropIQ model-ready output (`data/processed/crop_yield_model_data.csv`) is built from.

## Dataset 2 (Secondary / Contextual) - Indian Historical Crop Yield & Weather

- **Filename (raw):** `datasets/Custom_Crops_yield_Historical_Dataset.csv`, preserved unchanged at `data/raw/dataset2_indian_historical_crop_yield.csv`
- **Provider / author:** Not stated in the file; filename suggests a curated/derived historical Indian agriculture dataset, possibly itself assembled from Indian government agriculture statistics, but this is not confirmed within the file.
- **Original URL:** Not available (no accompanying metadata).
- **Download date:** Unknown.
- **License:** Unknown / unconfirmed.
- **Description:** 50,765 district-crop-year records covering 311 districts across 20 Indian states, for 4 crops only (rice, maize, cotton, chickpea), 1966-2017, with nutrient requirement figures (N/P/K per hectare and totals) and a small set of largely CATEGORY-LEVEL weather variables (temperature, humidity, rainfall, pH, wind speed, solar radiation each take only 2-4 distinct values across the whole 50,765-row file - these behave like fixed crop-requirement reference constants, not per-observation measured weather).
- **Geographic scope:** 20 Indian states / 311 districts (district-level, not field-level).
- **Temporal scope:** 1966-2017 (annual granularity) - does not overlap at all with Dataset 1's 2023 coverage.
- **Target definition:** `Yield_kg_per_ha` - explicitly stated unit (kg/hectare), unlike Dataset 1's `yield`.
- **Known limitations:** Only 4 crops covered; weather columns are effectively static per-crop lookup values rather than genuine historical district weather; no field-level or lat/long geolocation, only administrative district/state names and numeric codes.
- **Preprocessing performed:** None - not merged, used only as a profiled contextual reference (see below).
- **Primary or secondary:** **Secondary / contextual only.**

### Why Dataset 2 was NOT merged with Dataset 1 (Rule 5)

A defensible join requires a shared key with matching grain and semantics.
Candidate join dimensions were checked and rejected:

- **Location:** Dataset 1 provides only lat/long per field; Dataset 2 provides only state/district names and numeric codes. There is no shared geographic key, and reverse-geocoding lat/long to a district would introduce an unverified, error-prone transformation outside the scope of Phase 1's "never fabricate/guess" rule.
- **Year:** Dataset 1 covers only 2023; Dataset 2 covers 1966-2017. There is **zero temporal overlap** - a join on year is impossible.
- **Crop:** Dataset 1 has 30 crop types; Dataset 2 has only 4 (rice, maize, cotton, chickpea), of which 3 overlap by name with Dataset 1's crop list. Crop-name overlap alone, with no shared location or time key, is not a defensible join.

**Conclusion: Dataset 2 is documented as a secondary/contextual reference only and is excluded from `data/processed/crop_yield_model_data.csv`.** It may still be useful in Phase 2 for sanity-checking the plausibility of predicted yield magnitudes for rice/maize/cotton against historical Indian kg/ha figures, since it does give a clearly-stated unit that Dataset 1 lacks.

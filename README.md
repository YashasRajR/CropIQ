# CropIQ - Phase 1: Data Foundation

**AI-Powered Crop Yield Intelligence** - Predict. Understand. Optimize.

This is the Phase 1 (data foundation) deliverable for the CropIQ 10-hour
hackathon project. Phase 1 produces a clean, validated, documented,
reproducible, model-ready agricultural dataset for Phase 2 (ML yield
prediction) to consume. **No model training, recommendation engine, or
frontend work happens in this phase.**

## Quickstart

```bash
pip install -r requirements.txt

python src/data/profile_data.py     # generates reports/profile_*.csv
python src/data/validate_data.py    # prints PASS/WARNING/FAIL report, writes reports/validation_results.csv
python src/data/clean_data.py       # data/raw -> data/interim/dataset1_cleaned.csv
python src/data/preprocess.py       # data/interim -> data/processed/crop_yield_model_data.csv
```

To regenerate the exploration notebook with fresh outputs:

```bash
python notebooks/_build_notebook.py   # rebuilds notebooks/01_data_exploration.ipynb
jupyter nbconvert --to notebook --execute --inplace notebooks/01_data_exploration.ipynb
```

## Repository structure

```
CropIQ/
├── data/
│   ├── raw/            # original datasets, NEVER modified by the pipeline
│   ├── interim/         # output of clean_data.py
│   └── processed/       # crop_yield_model_data.csv - the Phase 2 input
├── notebooks/
│   └── 01_data_exploration.ipynb
├── src/data/
│   ├── utils.py
│   ├── profile_data.py
│   ├── validate_data.py
│   ├── clean_data.py
│   └── preprocess.py
├── reports/
│   ├── data_quality_report.md    # full investigation write-up (start here)
│   ├── data_dictionary.md
│   ├── dataset_source.md
│   ├── phase1_handoff.md         # Phase 2 read this
│   ├── validation_results.csv
│   ├── profile_*.csv
│   └── fig_*.png                 # figures from the exploration notebook
├── requirements.txt
└── datasets/            # original location the raw CSVs were found in (untouched)
```

## Key findings (see `reports/data_quality_report.md` for full detail)

- Dataset 1 (primary, 1,625 rows / 90 fields / 2023) has **zero missing
  values and zero duplicates**, but `yield` varies at every observation
  date for the same field - it is **not** a single season-final harvest
  figure. The modeling grain is therefore **one row = one field
  observation at a specific date**.
- `NDWI` is an exact deterministic negation of `GNDVI` in every row -
  redundant, flagged, not removed.
- `yield`, `soil_moisture`, and `rainfall` units could not be confirmed
  from source metadata and are documented as unconfirmed rather than
  guessed.
- Dataset 2 (secondary, Indian historical district-level crop yield,
  1966-2017) has **no defensible join key** against Dataset 1 (no shared
  location key, zero year overlap) and is kept as contextual reference
  only - **not merged**.
- Field-level leakage risk: Phase 2 **must** use a `field_id`-grouped
  train/validation split (GroupShuffleSplit / GroupKFold), never a random
  row split.

## Validation status

Run `python src/data/validate_data.py` - current result: **PASS WITH
WARNINGS** (unconfirmed units for `yield`/`soil_moisture`/`rainfall`; 1 row
with `soil_moisture` > 100, flagged not removed).

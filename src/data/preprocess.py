"""
CropIQ Phase 1 - Preprocessing
Builds the final model-ready dataset from the cleaned interim dataset.

Modeling grain (documented finding, see reports/data_quality_report.md
section "Target Semantics" / "Modeling Grain"):
    ONE ROW = ONE FIELD OBSERVATION AT A SPECIFIC DATE, with a concurrent
    yield value observed/estimated at that same date. Yield is NOT constant
    per field/crop across the season (it varies with every satellite
    observation date, correlated with concurrent NDVI/SAVI/rainfall), so
    this is a per-observation ("nowcast") target, not a single season-final
    harvest figure. Phase 2 must treat this explicitly (see phase1_handoff.md).

Feature engineering performed here (all leakage-safe, computed independently
per field_id using only that field's own historical, non-future rows up to
and including the current observation's date - never using rows from other
fields, and never using a future date relative to the current row):
    - year, month, day_of_year, month_sin/cos, doy_sin/cos (cyclical date features)
    - <index>_obs_number: ordinal position of this observation within its field's
      own chronological sequence (1st, 2nd, ... observation) - NOT a future-peeking stat.
    - <index>_expanding_mean / _expanding_std for NDVI/GNDVI/SAVI/soil_moisture/
      rainfall/temperature: computed with pandas `expanding()` on rows sorted by
      date WITHIN each field_id and shifted by one (i.e. using only strictly
      PRIOR observations of that same field), so no same-row or future
      information leaks into these aggregates. The first observation of each
      field therefore has NaN for these (nothing prior exists yet) -- documented,
      not silently filled.

Excluded from the model feature set (documented, not silently dropped):
    - field_id: identifier / grouping variable only (see Section 35 of the
      Phase 1 brief) - retained as metadata, excluded from `feature_columns`.
    - raw_row_index, source_dataset, soil_moisture_flag: traceability/QA
      metadata, retained but excluded from `feature_columns`.
    - NDWI: kept as a feature but flagged in the data dictionary as an exact
      deterministic negation of GNDVI (NDWI == -GNDVI for every row in this
      dataset) - i.e. redundant information, a multicollinearity note for
      Phase 2 feature selection, not automatically removed per Rule 27.

No scaling, no encoding, no target unit conversion are applied (Rules 12, 38).

Run:
    python src/data/preprocess.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np
import pandas as pd
from utils import DATASET1_INTERIM, MODEL_READY, ensure_dirs

ROLLING_COLS = ["NDVI", "GNDVI", "SAVI", "soil_moisture", "rainfall", "temperature"]


def add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["date_of_image"] = pd.to_datetime(df["date_of_image"])
    df["year"] = df["date_of_image"].dt.year
    df["month"] = df["date_of_image"].dt.month
    df["day_of_year"] = df["date_of_image"].dt.dayofyear
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
    df["doy_sin"] = np.sin(2 * np.pi * df["day_of_year"] / 365)
    df["doy_cos"] = np.cos(2 * np.pi * df["day_of_year"] / 365)
    return df


def add_field_history_features(df: pd.DataFrame) -> pd.DataFrame:
    """Per-field, strictly-prior-only rolling stats. Multiple observations
    per field justify this (Section 15): each field has 12-25 dated
    observations, ordering is meaningful (chronological), and shifting by
    one before computing the expanding window guarantees no leakage from
    the current or future rows."""
    df = df.sort_values(["field_id", "date_of_image"]).copy()
    df["field_obs_number"] = df.groupby("field_id").cumcount() + 1

    for col in ROLLING_COLS:
        grp = df.groupby("field_id")[col]
        df[f"{col}_field_expanding_mean"] = grp.transform(lambda s: s.shift(1).expanding().mean())
        df[f"{col}_field_expanding_std"] = grp.transform(lambda s: s.shift(1).expanding().std())
    return df


def build_model_ready(df: pd.DataFrame) -> pd.DataFrame:
    df = add_temporal_features(df)
    df = add_field_history_features(df)
    df = df.sort_values(["field_id", "date_of_image"]).reset_index(drop=True)

    # Target missingness check (Rule: never train on missing target; never impute it)
    before = len(df)
    df = df.dropna(subset=["yield"])
    dropped_missing_target = before - len(df)
    if dropped_missing_target:
        print(f"Dropped {dropped_missing_target} rows with missing target 'yield'")

    return df


FEATURE_COLUMNS = [
    "latitude", "longitude",
    "NDVI", "GNDVI", "NDWI", "SAVI",
    "soil_moisture", "temperature", "rainfall",
    "crop_type",
    "year", "month", "day_of_year", "month_sin", "month_cos", "doy_sin", "doy_cos",
    "field_obs_number",
] + [f"{c}_field_expanding_mean" for c in ROLLING_COLS] + [f"{c}_field_expanding_std" for c in ROLLING_COLS]

METADATA_COLUMNS = ["field_id", "date_of_image", "source_dataset", "raw_row_index", "soil_moisture_flag"]
TARGET_COLUMN = "yield"


def main():
    ensure_dirs()
    print(f"Loading cleaned interim dataset from {DATASET1_INTERIM} ...")
    df = pd.read_csv(DATASET1_INTERIM)
    print(f"Interim shape: {df.shape}")

    model_df = build_model_ready(df)
    print(f"Model-ready shape (rows may drop if target missing): {model_df.shape}")

    ordered_cols = METADATA_COLUMNS + FEATURE_COLUMNS + [TARGET_COLUMN]
    ordered_cols = [c for c in ordered_cols if c in model_df.columns]
    model_df = model_df[ordered_cols]

    MODEL_READY.parent.mkdir(parents=True, exist_ok=True)
    model_df.to_csv(MODEL_READY, index=False)
    print(f"\nWrote model-ready dataset to {MODEL_READY}")
    print(f"Final shape: {model_df.shape[0]} rows x {model_df.shape[1]} columns")
    print(f"Feature columns ({len(FEATURE_COLUMNS)}): {FEATURE_COLUMNS}")
    print(f"Metadata columns (excluded from modeling): {METADATA_COLUMNS}")
    print(f"Target: {TARGET_COLUMN}")

    na_in_features = model_df[FEATURE_COLUMNS].isna().sum()
    na_in_features = na_in_features[na_in_features > 0]
    if len(na_in_features):
        print("\nNote: the following engineered features contain NaN for each field's FIRST "
              "observation (no prior history exists yet) - by design, not imputed here:")
        print(na_in_features)


if __name__ == "__main__":
    main()

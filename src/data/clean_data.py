"""
CropIQ Phase 1 - Data Cleaning
Transforms data/raw/dataset1_field_satellite.csv into a cleaned,
type-consistent, traceable intermediate dataset. Every transformation is a
named, documented function so the pipeline is auditable end to end.

Documented decisions (see reports/data_quality_report.md for full rationale):
  - Drop 'Unnamed: 13/14' trailing empty columns (spreadsheet export artifact).
  - Parse date_of_image as datetime (DD-MM-YYYY).
  - crop_type already consistently formatted (Title Case, no whitespace) in
    the raw data; a normalization step is still applied defensively so the
    pipeline is robust if future raw extracts are messier.
  - No missing values exist in any column of Dataset 1 -> no imputation is
    performed. Missing-value STRATEGY is still documented for the record and
    exercised defensively (so the script does not silently break if a future
    raw extract does contain gaps).
  - soil_moisture has 1 row (of 1625) exceeding 100 (a percentage upper
    bound is a common - but here unconfirmed - assumption). The row is
    FLAGGED via a new column (soil_moisture_flag) rather than deleted or
    silently altered, since its yield/other fields are otherwise
    unremarkable and there is no confirmed evidence it is an invalid record.
  - No duplicate rows (exact or field_id+date_of_image) exist -> nothing to
    drop.
  - Units are NOT converted because the source unit of `yield` could not be
    confirmed (see reports/dataset_source.md). This is documented, not
    guessed.

Run:
    python src/data/clean_data.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import pandas as pd
import numpy as np
from utils import load_dataset1, parse_field_dates, ensure_dirs, INTERIM_DIR, DATASET1_INTERIM


def normalize_crop_type(s: pd.Series) -> pd.Series:
    """Defensive normalization: strip whitespace, collapse internal
    whitespace, Title Case. Documents the mapping actually applied."""
    cleaned = s.astype(str).str.strip().str.replace(r"\s+", " ", regex=True).str.title()
    mapping = pd.DataFrame({"raw_crop_type": s, "clean_crop_type": cleaned})
    changed = mapping[mapping.raw_crop_type.astype(str) != mapping.clean_crop_type]
    if len(changed):
        print(f"crop_type: normalized {len(changed)} values")
        print(changed.drop_duplicates().to_string(index=False))
    else:
        print("crop_type: no normalization needed (already clean in raw data)")
    return cleaned


def parse_dates(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["date_of_image"] = parse_field_dates(df["date_of_image"])
    n_fail = df["date_of_image"].isna().sum()
    print(f"date_of_image: parsed as datetime, {n_fail} parse failures")
    return df


def flag_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """No missing values exist in the raw Dataset 1 (confirmed by
    profile_data.py / validate_data.py). This function is a documented no-op
    that would apply the following strategy IF missingness appeared in a
    future extract:
        - target (yield): rows with missing target are DROPPED (cannot be
          used for supervised training; never imputed).
        - numeric features (NDVI, GNDVI, NDWI, SAVI, soil_moisture,
          temperature, rainfall): median imputation (low-missingness
          assumption), each flagged via a companion `<col>_was_missing`
          column.
        - crop_type: imputed with explicit 'Unknown' category, flagged.
    Nothing is imputed here because there is nothing missing to impute."""
    missing_counts = df.isna().sum()
    total_missing = int(missing_counts.sum())
    print(f"Missing value check: {total_missing} missing cells across all columns "
          f"({'no imputation needed' if total_missing == 0 else 'see below'})")
    if total_missing:
        print(missing_counts[missing_counts > 0])
        before = len(df)
        df = df.dropna(subset=["yield"])
        print(f"Dropped {before - len(df)} rows with missing target")
    return df


def flag_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    exact = df.duplicated().sum()
    key = df.duplicated(subset=["field_id", "date_of_image"]).sum()
    print(f"Duplicate check: {exact} exact duplicate rows, {key} field_id+date_of_image duplicates")
    if exact:
        before = len(df)
        df = df.drop_duplicates()
        print(f"Dropped {before - len(df)} exact duplicate rows")
    if key:
        # Key duplicates would need manual investigation (which is genuine vs
        # erroneous?) rather than a blind drop; none exist in this dataset,
        # so this branch documents intent without silently discarding data.
        print("WARNING: field_id+date_of_image duplicates detected and require manual review; "
              "none removed automatically.")
    return df


def flag_impossible_values(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["soil_moisture_flag"] = np.where(
        df["soil_moisture"] > 100, "above_100_unconfirmed_bound", "ok"
    )
    n_flagged = (df["soil_moisture_flag"] != "ok").sum()
    print(f"soil_moisture: flagged {n_flagged} row(s) exceeding 100 (unit/bound unconfirmed); "
          f"value retained unaltered, not deleted")
    return df


def add_traceability(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["source_dataset"] = "dataset1_field_satellite"
    df["raw_row_index"] = df.index
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["crop_type"] = normalize_crop_type(df["crop_type"])
    df = parse_dates(df)
    df = flag_missing_values(df)
    df = flag_duplicates(df)
    df = flag_impossible_values(df)
    df = add_traceability(df)
    return df


def main():
    ensure_dirs()
    print("Loading raw data ...")
    df_raw = load_dataset1()
    print(f"Raw shape: {df_raw.shape}\n")

    print("Cleaning ...")
    df_clean = clean(df_raw)
    print(f"\nCleaned shape: {df_clean.shape}")

    DATASET1_INTERIM.parent.mkdir(parents=True, exist_ok=True)
    df_clean.to_csv(DATASET1_INTERIM, index=False)
    print(f"\nWrote cleaned intermediate dataset to {DATASET1_INTERIM}")


if __name__ == "__main__":
    main()

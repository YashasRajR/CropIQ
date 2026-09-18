"""
CropIQ Phase 1 - Dataset Profiling
Generates a comprehensive, reproducible profile of Dataset 1 (primary,
field/satellite/weather) and Dataset 2 (secondary, Indian historical crop
yield). Writes machine-readable CSV summaries to reports/ and prints a
human-readable summary to stdout.

Run:
    python src/data/profile_data.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pandas as pd
import numpy as np
from utils import (
    load_dataset1, load_dataset2, parse_field_dates,
    numeric_profile, general_profile, ensure_dirs, REPORTS_DIR,
)

NUMERIC_D1 = ["latitude", "longitude", "NDVI", "GNDVI", "NDWI", "SAVI",
              "soil_moisture", "temperature", "rainfall", "yield"]
CATEGORICAL_D1 = ["crop_type"]
DATE_D1 = ["date_of_image"]
GEO_D1 = ["latitude", "longitude"]


def profile_dataset(df: pd.DataFrame, numeric_cols, categorical_cols, date_cols, name: str):
    rows = []
    for col in df.columns:
        base = general_profile(df, col)
        if col in numeric_cols:
            base.update(numeric_profile(df[col]))
        rows.append(base)
    general_df = pd.DataFrame(rows)

    cat_rows = []
    for col in categorical_cols:
        vc = df[col].value_counts(dropna=False)
        for cat, count in vc.items():
            cat_rows.append({
                "column": col, "category": cat, "count": int(count),
                "pct": round(100 * count / len(df), 3),
            })
    cat_df = pd.DataFrame(cat_rows)

    date_rows = []
    for col in date_cols:
        parsed = parse_field_dates(df[col]) if col == "date_of_image" else pd.to_datetime(df[col], errors="coerce")
        date_rows.append({
            "column": col,
            "min_date": parsed.min(),
            "max_date": parsed.max(),
            "n_unique_dates": parsed.nunique(),
            "n_parse_failures": parsed.isna().sum() - df[col].isna().sum(),
        })
    date_df = pd.DataFrame(date_rows)

    geo_summary = None
    if all(c in df.columns for c in GEO_D1):
        geo_summary = pd.DataFrame([{
            "lat_min": df.latitude.min(), "lat_max": df.latitude.max(), "lat_mean": df.latitude.mean(),
            "lon_min": df.longitude.min(), "lon_max": df.longitude.max(), "lon_mean": df.longitude.mean(),
            "n_unique_coord_pairs": df[GEO_D1].drop_duplicates().shape[0],
        }])

    return general_df, cat_df, date_df, geo_summary


def main():
    ensure_dirs()
    df1 = load_dataset1()
    df2 = load_dataset2()

    print("=" * 90)
    print("DATASET 1: Field / Satellite / Weather observations")
    print("=" * 90)
    print(f"Shape: {df1.shape[0]} rows x {df1.shape[1]} columns\n")

    g1, cat1, date1, geo1 = profile_dataset(df1, NUMERIC_D1, CATEGORICAL_D1, DATE_D1, "dataset1")
    g1.to_csv(REPORTS_DIR / "profile_dataset1_columns.csv", index=False)
    cat1.to_csv(REPORTS_DIR / "profile_dataset1_categorical.csv", index=False)
    date1.to_csv(REPORTS_DIR / "profile_dataset1_dates.csv", index=False)
    if geo1 is not None:
        geo1.to_csv(REPORTS_DIR / "profile_dataset1_geo.csv", index=False)

    print(g1.to_string(index=False))
    print("\nCategorical (crop_type) top categories:")
    print(cat1.head(10).to_string(index=False))
    print("\nDate coverage:")
    print(date1.to_string(index=False))
    if geo1 is not None:
        print("\nGeographic coverage:")
        print(geo1.to_string(index=False))

    print("\n" + "=" * 90)
    print("DATASET 2: Indian Historical Crop Yield & Weather (secondary/contextual)")
    print("=" * 90)
    print(f"Shape: {df2.shape[0]} rows x {df2.shape[1]} columns\n")

    numeric_d2 = df2.select_dtypes(include=[np.number]).columns.tolist()
    categorical_d2 = ["State Name", "Dist Name", "Crop"]
    g2, cat2, _, _ = profile_dataset(df2, numeric_d2, categorical_d2, [], "dataset2")
    g2.to_csv(REPORTS_DIR / "profile_dataset2_columns.csv", index=False)
    cat2.to_csv(REPORTS_DIR / "profile_dataset2_categorical.csv", index=False)
    print(g2.to_string(index=False))
    print(f"\nYear coverage: {df2.Year.min()} - {df2.Year.max()}")
    print(f"Unique states: {df2['State Name'].nunique()}, unique crops: {df2.Crop.nunique()}")

    print("\nProfiling complete. Reports written to reports/profile_*.csv")


if __name__ == "__main__":
    main()

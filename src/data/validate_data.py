"""
CropIQ Phase 1 - Data Validation
Runs a rule-based validation pass over Dataset 1 and reports PASS / WARNING /
FAIL for each check category. Intended to be run both on the raw dataset and
(later, by preprocess.py) on the model-ready dataset.

Run:
    python src/data/validate_data.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import pandas as pd
from utils import load_dataset1, parse_field_dates, ensure_dirs, REPORTS_DIR

REQUIRED_COLUMNS = [
    "field_id", "date_of_image", "latitude", "longitude", "NDVI", "GNDVI",
    "NDWI", "SAVI", "soil_moisture", "temperature", "rainfall", "crop_type", "yield",
]

KNOWN_CROPS = {
    "Saffron", "Barley", "Mustard", "Wheat", "Soybean", "Bajra", "Millets",
    "Tobacco", "Linseed", "Sesame", "Sorghum", "Pulses", "Cotton", "Maize",
    "Jowar", "Ragi", "Sunflower", "Rice", "Sugarcane", "Coffee", "Groundnut",
    "Ginger", "Turmeric", "Black Pepper", "Tea", "Cashew Nut", "Oil Palm",
    "Rubber", "Cardamom", "Coconut",
}

# India's approximate bounding box (mainland + islands)
INDIA_LAT_RANGE = (6.0, 38.0)
INDIA_LON_RANGE = (68.0, 98.0)


def check_schema(df):
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    ok = len(missing) == 0
    return ok, {"missing_columns": missing}


def check_target(df):
    n_missing = df["yield"].isna().sum()
    n_negative = (df["yield"] < 0).sum()
    n_zero = (df["yield"] == 0).sum()
    ok = n_missing == 0 and n_negative == 0
    return ok, {"missing_target": int(n_missing), "negative_yield": int(n_negative), "zero_yield": int(n_zero)}


def check_dates(df):
    parsed = parse_field_dates(df["date_of_image"])
    n_fail = parsed.isna().sum() - df["date_of_image"].isna().sum()
    span_days = (parsed.max() - parsed.min()).days if parsed.notna().any() else None
    ok = n_fail == 0
    return ok, {"parse_failures": int(n_fail), "min_date": str(parsed.min()), "max_date": str(parsed.max()), "span_days": span_days}


def check_coordinates(df):
    n_missing = df[["latitude", "longitude"]].isna().any(axis=1).sum()
    lat_bad = ~df["latitude"].between(*INDIA_LAT_RANGE)
    lon_bad = ~df["longitude"].between(*INDIA_LON_RANGE)
    n_out_of_bounds = (lat_bad | lon_bad).sum()
    ok = n_missing == 0 and n_out_of_bounds == 0
    return ok, {"missing_coords": int(n_missing), "out_of_india_bbox": int(n_out_of_bounds)}


def check_missingness(df):
    miss_pct = df.isna().mean() * 100
    warn_cols = miss_pct[(miss_pct > 0) & (miss_pct <= 5)].to_dict()
    high_cols = miss_pct[miss_pct > 5].to_dict()
    ok = len(high_cols) == 0
    return ok, {"columns_with_some_missing": warn_cols, "columns_high_missing": high_cols}


def check_duplicates(df):
    exact = df.duplicated().sum()
    key = df.duplicated(subset=["field_id", "date_of_image"]).sum()
    ok = exact == 0 and key == 0
    return ok, {"exact_duplicates": int(exact), "field_date_duplicates": int(key)}


def check_categories(df):
    unknown = sorted(set(df["crop_type"].dropna().unique()) - KNOWN_CROPS)
    ok = len(unknown) == 0
    return ok, {"unknown_crop_categories": unknown}


def check_leakage(df):
    leakage_like = [c for c in df.columns if c.lower() in (
        "production", "harvest_quantity", "yield_calculated", "total_production", "yield_per_area")]
    ok = len(leakage_like) == 0
    return ok, {"suspicious_columns_present": leakage_like}


def check_units(df):
    # Vegetation indices should fall within their theoretically valid ranges.
    issues = {}
    for col, (lo, hi) in {"NDVI": (-1, 1), "GNDVI": (-1, 1), "NDWI": (-1, 1), "SAVI": (-1.5, 1.5)}.items():
        n_bad = (~df[col].between(lo, hi)).sum()
        if n_bad:
            issues[col] = int(n_bad)
    n_soil_over_100 = (df["soil_moisture"] > 100).sum()
    if n_soil_over_100:
        issues["soil_moisture_over_100"] = int(n_soil_over_100)
    # target unit could not be confirmed from source metadata -> always a WARNING
    issues["target_unit_unconfirmed"] = True
    ok = len(issues) == 1  # only the unconfirmed-unit warning present
    return ok, issues


def run_all(df):
    checks = {
        "Schema": check_schema(df),
        "Target": check_target(df),
        "Dates": check_dates(df),
        "Coordinates": check_coordinates(df),
        "Missingness": check_missingness(df),
        "Duplicates": check_duplicates(df),
        "Categories": check_categories(df),
        "Leakage": check_leakage(df),
        "Units": check_units(df),
    }
    return checks


SOFT_CHECKS = ("Missingness", "Units")  # these downgrade to WARNING, never hard-FAIL the run


def print_report(checks):
    print("DATA VALIDATION")
    print("-" * 40)
    any_fail = False
    any_warn = False
    for name, (ok, details) in checks.items():
        has_detail_content = any(bool(v) for v in details.values())
        if name in SOFT_CHECKS:
            status = "WARNING" if has_detail_content else "PASS"
            any_warn = any_warn or has_detail_content
        else:
            status = "PASS" if ok else "FAIL"
            any_fail = any_fail or not ok
        print(f"{name}: {status}")
        for k, v in details.items():
            if v:
                print(f"    - {k}: {v}")
    print("-" * 40)
    overall = "FAIL" if any_fail else ("PASS WITH WARNINGS" if any_warn else "PASS")
    print(f"Overall: {overall}")
    return overall


def main():
    ensure_dirs()
    df = load_dataset1()
    checks = run_all(df)
    overall = print_report(checks)

    rows = []
    for name, (ok, details) in checks.items():
        rows.append({"check": name, "pass": ok, "details": str(details)})
    pd.DataFrame(rows).to_csv(REPORTS_DIR / "validation_results.csv", index=False)
    print(f"\nValidation details written to reports/validation_results.csv")
    return 0 if overall != "FAIL" else 1


if __name__ == "__main__":
    raise SystemExit(main())

"""
CropIQ Phase 1 - Shared utility functions
Reusable helpers used across profile_data.py, validate_data.py, clean_data.py, preprocess.py
"""
from pathlib import Path
import pandas as pd
import numpy as np

# ---------------------------------------------------------------------------
# Paths (relative to repository root; scripts call these with cwd = repo root)
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "raw"
INTERIM_DIR = ROOT / "data" / "interim"
PROCESSED_DIR = ROOT / "data" / "processed"
REPORTS_DIR = ROOT / "reports"

DATASET1_RAW = RAW_DIR / "dataset1_field_satellite.csv"
DATASET2_RAW = RAW_DIR / "dataset2_indian_historical_crop_yield.csv"
DATASET1_INTERIM = INTERIM_DIR / "dataset1_cleaned.csv"
MODEL_READY = PROCESSED_DIR / "crop_yield_model_data.csv"


def load_dataset1(path=DATASET1_RAW) -> pd.DataFrame:
    """Load the primary field/satellite dataset, dropping known trailing
    'Unnamed' artifact columns produced by the original spreadsheet export.
    This is the ONLY transformation applied at load time - everything else
    happens explicitly and is documented in clean_data.py."""
    df = pd.read_csv(path)
    unnamed = [c for c in df.columns if str(c).startswith("Unnamed")]
    if unnamed:
        df = df.drop(columns=unnamed)
    return df


def load_dataset2(path=DATASET2_RAW) -> pd.DataFrame:
    return pd.read_csv(path)


def parse_field_dates(series: pd.Series) -> pd.Series:
    """Dataset 1 dates are stored as DD-MM-YYYY strings. Parse explicitly
    (never rely on pandas' format inference, which can silently mis-parse
    day/month for ambiguous values)."""
    return pd.to_datetime(series, format="%d-%m-%Y", errors="coerce")


def numeric_profile(s: pd.Series) -> dict:
    s_num = pd.to_numeric(s, errors="coerce")
    q = s_num.quantile([0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99])
    return {
        "min": s_num.min(),
        "max": s_num.max(),
        "mean": s_num.mean(),
        "median": s_num.median(),
        "std": s_num.std(),
        "variance": s_num.var(),
        "Q1": s_num.quantile(0.25),
        "Q3": s_num.quantile(0.75),
        "IQR": s_num.quantile(0.75) - s_num.quantile(0.25),
        "p1": q.loc[0.01],
        "p5": q.loc[0.05],
        "p25": q.loc[0.25],
        "p50": q.loc[0.5],
        "p75": q.loc[0.75],
        "p95": q.loc[0.95],
        "p99": q.loc[0.99],
    }


def general_profile(df: pd.DataFrame, col: str) -> dict:
    s = df[col]
    n = len(s)
    n_missing = s.isna().sum()
    return {
        "column": col,
        "dtype": str(s.dtype),
        "n_records": n,
        "n_non_null": n - n_missing,
        "n_missing": int(n_missing),
        "missing_pct": round(100 * n_missing / n, 3) if n else np.nan,
        "n_unique": s.nunique(dropna=True),
        "uniqueness_pct": round(100 * s.nunique(dropna=True) / n, 3) if n else np.nan,
    }


def iqr_outlier_mask(s: pd.Series, k: float = 1.5) -> pd.Series:
    s_num = pd.to_numeric(s, errors="coerce")
    q1, q3 = s_num.quantile(0.25), s_num.quantile(0.75)
    iqr = q3 - q1
    lower, upper = q1 - k * iqr, q3 + k * iqr
    return (s_num < lower) | (s_num > upper)


def ensure_dirs():
    for d in (RAW_DIR, INTERIM_DIR, PROCESSED_DIR, REPORTS_DIR):
        d.mkdir(parents=True, exist_ok=True)

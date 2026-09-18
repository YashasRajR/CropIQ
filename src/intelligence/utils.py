"""
CropIQ Phase 3 - Intelligence Engine Utilities
Provides structured feature metadata, human-readable display mapping,
crop yield reference distribution calculation, and training feature bounds
for out-of-distribution detection.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import json
import numpy as np
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DATA_PATH = REPO_ROOT / "data" / "processed" / "crop_yield_model_data.csv"
MODELS_DIR = REPO_ROOT / "models"
REPORTS_DIR = REPO_ROOT / "reports"

TARGET_COLUMN = "yield"
TARGET_UNIT = "unconfirmed"  # Confirmed in Phase 1: source metadata did not state physical unit

# -------------------------------------------------------------
# 1. Feature Metadata & Actionability Classification (Section 16, 67)
# -------------------------------------------------------------
FEATURE_METADATA: Dict[str, Dict[str, Any]] = {
    # Geographic
    "latitude": {
        "display_name": "Field Latitude",
        "description": "Geographic latitude coordinate of the field in India",
        "unit": "decimal degrees",
        "category": "Geography",
        "user_controlled": False,
        "actionable_type": "FIXED_CHOICE",
        "explainability_supported": True,
    },
    "longitude": {
        "display_name": "Field Longitude",
        "description": "Geographic longitude coordinate of the field in India",
        "unit": "decimal degrees",
        "category": "Geography",
        "user_controlled": False,
        "actionable_type": "FIXED_CHOICE",
        "explainability_supported": True,
    },
    # Vegetation Indices
    "NDVI": {
        "display_name": "Vegetation Health (NDVI)",
        "description": "Normalized Difference Vegetation Index measuring live green canopy density",
        "unit": "index [-1, 1]",
        "category": "Vegetation",
        "user_controlled": False,
        "actionable_type": "MONITORING",
        "explainability_supported": True,
    },
    "GNDVI": {
        "display_name": "Green Vegetation Index (GNDVI)",
        "description": "Green Normalized Difference Vegetation Index sensitive to chlorophyll content",
        "unit": "index [-1, 1]",
        "category": "Vegetation",
        "user_controlled": False,
        "actionable_type": "MONITORING",
        "explainability_supported": True,
    },
    "NDWI": {
        "display_name": "Vegetation Water Index (NDWI)",
        "description": "Normalized Difference Water Index reflecting canopy liquid water content",
        "unit": "index [-1, 1]",
        "category": "Vegetation",
        "user_controlled": False,
        "actionable_type": "MONITORING",
        "explainability_supported": True,
    },
    "SAVI": {
        "display_name": "Soil-Adjusted Vegetation Index (SAVI)",
        "description": "Soil Adjusted Vegetation Index mitigating soil brightness in early canopy growth",
        "unit": "index [-1.5, 1.5]",
        "category": "Vegetation",
        "user_controlled": False,
        "actionable_type": "MONITORING",
        "explainability_supported": True,
    },
    # Soil & Weather
    "soil_moisture": {
        "display_name": "Soil Moisture",
        "description": "Volumetric soil moisture level in the crop root zone",
        "unit": "unconfirmed",
        "category": "Soil",
        "user_controlled": True,
        "actionable_type": "ACTIONABLE",
        "explainability_supported": True,
    },
    "temperature": {
        "display_name": "Ambient Temperature",
        "description": "Ambient surface temperature recorded at observation date",
        "unit": "assumed Celsius",
        "category": "Weather",
        "user_controlled": False,
        "actionable_type": "NON_ACTIONABLE",
        "explainability_supported": True,
    },
    "rainfall": {
        "display_name": "Rainfall",
        "description": "Precipitation recorded concurrent with field observation",
        "unit": "unconfirmed",
        "category": "Weather",
        "user_controlled": False,
        "actionable_type": "NON_ACTIONABLE",
        "explainability_supported": True,
    },
    # Crop Choice
    "crop_type": {
        "display_name": "Crop Type",
        "description": "Crop variety cultivated in the field (30 supported categories)",
        "unit": "category",
        "category": "Crop",
        "user_controlled": True,
        "actionable_type": "FIXED_CHOICE",
        "explainability_supported": True,
    },
    # Temporal & Cyclical
    "year": {
        "display_name": "Observation Year",
        "description": "Calendar year of observation (2023 in training data)",
        "unit": "year",
        "category": "Temporal",
        "user_controlled": False,
        "actionable_type": "FIXED_CHOICE",
        "explainability_supported": True,
    },
    "month": {
        "display_name": "Calendar Month",
        "description": "Month of observation (1 to 12)",
        "unit": "month",
        "category": "Temporal",
        "user_controlled": False,
        "actionable_type": "NON_ACTIONABLE",
        "explainability_supported": True,
    },
    "day_of_year": {
        "display_name": "Day of Year",
        "description": "Ordinal calendar day of year (1 to 365)",
        "unit": "day",
        "category": "Temporal",
        "user_controlled": False,
        "actionable_type": "NON_ACTIONABLE",
        "explainability_supported": True,
    },
    "month_sin": {
        "display_name": "Seasonal Cyclical Term (Month Sin)",
        "description": "Sine cyclical encoding of month of year",
        "unit": "dimensionless",
        "category": "Temporal",
        "user_controlled": False,
        "actionable_type": "NON_ACTIONABLE",
        "explainability_supported": False,
    },
    "month_cos": {
        "display_name": "Seasonal Cyclical Term (Month Cos)",
        "description": "Cosine cyclical encoding of month of year",
        "unit": "dimensionless",
        "category": "Temporal",
        "user_controlled": False,
        "actionable_type": "NON_ACTIONABLE",
        "explainability_supported": False,
    },
    "doy_sin": {
        "display_name": "Annual Cyclical Term (DOY Sin)",
        "description": "Sine cyclical encoding of day of year",
        "unit": "dimensionless",
        "category": "Temporal",
        "user_controlled": False,
        "actionable_type": "NON_ACTIONABLE",
        "explainability_supported": False,
    },
    "doy_cos": {
        "display_name": "Annual Cyclical Term (DOY Cos)",
        "description": "Cosine cyclical encoding of day of year",
        "unit": "dimensionless",
        "category": "Temporal",
        "user_controlled": False,
        "actionable_type": "NON_ACTIONABLE",
        "explainability_supported": False,
    },
    "field_obs_number": {
        "display_name": "Observation Pass Number",
        "description": "Sequential observation counter for the field across the season",
        "unit": "count",
        "category": "Temporal",
        "user_controlled": False,
        "actionable_type": "MONITORING",
        "explainability_supported": True,
    },
}

# Add Expanding History Features metadata dynamically
HISTORY_METRIC_NAMES = {
    "NDVI": "Historical NDVI Mean",
    "GNDVI": "Historical GNDVI Mean",
    "SAVI": "Historical SAVI Mean",
    "soil_moisture": "Historical Soil Moisture Mean",
    "rainfall": "Historical Rainfall Mean",
    "temperature": "Historical Temperature Mean",
}

for metric, disp in HISTORY_METRIC_NAMES.items():
    FEATURE_METADATA[f"{metric}_field_expanding_mean"] = {
        "display_name": disp,
        "description": f"Cumulative strictly-prior mean of {metric} for this field",
        "unit": FEATURE_METADATA[metric]["unit"],
        "category": "Historical Trends",
        "user_controlled": False,
        "actionable_type": "MONITORING",
        "explainability_supported": True,
    }
    FEATURE_METADATA[f"{metric}_field_expanding_std"] = {
        "display_name": f"{disp.replace('Mean', 'Variability (Std)')}",
        "description": f"Cumulative strictly-prior standard deviation of {metric} for this field",
        "unit": FEATURE_METADATA[metric]["unit"],
        "category": "Historical Trends",
        "user_controlled": False,
        "actionable_type": "MONITORING",
        "explainability_supported": True,
    }


def get_feature_display_name(feature_name: str) -> str:
    """Map raw feature name to human-readable label."""
    if feature_name in FEATURE_METADATA:
        return FEATURE_METADATA[feature_name]["display_name"]
    if feature_name.startswith("crop_type_"):
        crop = feature_name.replace("crop_type_", "").replace("_", " ").title()
        return f"Crop Type: {crop}"
    return feature_name.replace("_", " ").title()


# -------------------------------------------------------------
# 2. Crop Historical Yield Reference Distributions (Sections 24-26)
# -------------------------------------------------------------
_CROP_REFERENCE_CACHE: Optional[Dict[str, Any]] = None


def load_crop_reference_distributions(
    data_path: Optional[Path] = None,
    min_samples: int = 5,
) -> Dict[str, Any]:
    """
    Calculate statistical benchmarks per crop and overall dataset:
    Median, Q1 (25th), Q3 (75th), P10 (10th), P90 (90th), Mean, Std, Count.
    """
    global _CROP_REFERENCE_CACHE
    if _CROP_REFERENCE_CACHE is not None:
        return _CROP_REFERENCE_CACHE

    path = data_path or PROCESSED_DATA_PATH
    if not path.exists():
        raise FileNotFoundError(f"Processed dataset not found at {path}")

    df = pd.read_csv(path)
    target = TARGET_COLUMN

    # Overall dataset reference
    overall_stats = {
        "samples": len(df),
        "mean": round(float(df[target].mean()), 2),
        "std": round(float(df[target].std()), 2),
        "median": round(float(df[target].median()), 2),
        "q1": round(float(df[target].quantile(0.25)), 2),
        "q3": round(float(df[target].quantile(0.75)), 2),
        "p10": round(float(df[target].quantile(0.10)), 2),
        "p90": round(float(df[target].quantile(0.90)), 2),
        "min": round(float(df[target].min()), 2),
        "max": round(float(df[target].max()), 2),
    }

    crops_stats = {}
    for crop, grp in df.groupby("crop_type"):
        n_samples = len(grp)
        crops_stats[crop] = {
            "samples": n_samples,
            "mean": round(float(grp[target].mean()), 2),
            "std": round(float(grp[target].std()), 2),
            "median": round(float(grp[target].median()), 2),
            "q1": round(float(grp[target].quantile(0.25)), 2),
            "q3": round(float(grp[target].quantile(0.75)), 2),
            "p10": round(float(grp[target].quantile(0.10)), 2),
            "p90": round(float(grp[target].quantile(0.90)), 2),
            "min": round(float(grp[target].min()), 2),
            "max": round(float(grp[target].max()), 2),
            "has_sufficient_samples": n_samples >= min_samples,
        }

    _CROP_REFERENCE_CACHE = {
        "overall": overall_stats,
        "crops": crops_stats,
        "target_unit": TARGET_UNIT,
    }
    return _CROP_REFERENCE_CACHE


# -------------------------------------------------------------
# 3. Training Feature Distribution Bounds for OOD Detection (Section 35-37)
# -------------------------------------------------------------
_TRAINING_BOUNDS_CACHE: Optional[Dict[str, Dict[str, float]]] = None


def load_training_feature_bounds(data_path: Optional[Path] = None) -> Dict[str, Dict[str, float]]:
    """
    Calculate statistical ranges (min, max, p01, p99, mean, std) for numerical features
    to detect out-of-distribution values and extrapolation risks.
    """
    global _TRAINING_BOUNDS_CACHE
    if _TRAINING_BOUNDS_CACHE is not None:
        return _TRAINING_BOUNDS_CACHE

    path = data_path or PROCESSED_DATA_PATH
    df = pd.read_csv(path)

    bounds = {}
    from ..ml.utils import NUMERICAL_FEATURES

    for col in NUMERICAL_FEATURES:
        series = df[col].dropna()
        if len(series) > 0:
            bounds[col] = {
                "min": round(float(series.min()), 4),
                "max": round(float(series.max()), 4),
                "p01": round(float(series.quantile(0.01)), 4),
                "p99": round(float(series.quantile(0.99)), 4),
                "mean": round(float(series.mean()), 4),
                "std": round(float(series.std()), 4),
            }

    _TRAINING_BOUNDS_CACHE = bounds
    return bounds


def detect_out_of_distribution(
    input_data: Union[Dict[str, Any], pd.DataFrame],
    bounds: Optional[Dict[str, Dict[str, float]]] = None,
) -> Tuple[List[str], bool, bool]:
    """
    Check input against training distribution.
    Returns:
      (warnings, is_out_of_distribution, extrapolation_warning)
    """
    b = bounds or load_training_feature_bounds()
    warnings_list = []
    severe_ood_count = 0
    mild_ood_count = 0

    row = input_data.iloc[0].to_dict() if isinstance(input_data, pd.DataFrame) else input_data

    for col, stat in b.items():
        if col in row and row[col] is not None and not pd.isna(row[col]):
            val = float(row[col])
            disp = get_feature_display_name(col)

            # Severe OOD: beyond absolute min/max
            if val < stat["min"] or val > stat["max"]:
                severe_ood_count += 1
                warnings_list.append(
                    f"{disp} ({val}) is outside historical training range [{stat['min']}, {stat['max']}]."
                )
            # Mild OOD: beyond 1st or 99th percentile
            elif val < stat["p01"] or val > stat["p99"]:
                mild_ood_count += 1
                warnings_list.append(
                    f"{disp} ({val}) is in the extreme 1% tail of historical training data."
                )

    is_ood = (severe_ood_count > 0) or (mild_ood_count >= 2)
    extrapolation_warning = severe_ood_count >= 2

    return warnings_list, is_ood, extrapolation_warning

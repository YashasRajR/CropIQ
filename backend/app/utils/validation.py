"""
CropIQ Feature and Temporal Validation Utilities
Handles feature preparation, temporal cyclical transformations, and bounds sanity checks.
"""

from typing import Any, Dict, List, Optional
import math
import numpy as np
import pandas as pd

from src.ml.utils import PREDICTIVE_FEATURES, TARGET_COLUMN

EXPANDING_COLS = [
    "NDVI_field_expanding_mean",
    "GNDVI_field_expanding_mean",
    "SAVI_field_expanding_mean",
    "soil_moisture_field_expanding_mean",
    "rainfall_field_expanding_mean",
    "temperature_field_expanding_mean",
    "NDVI_field_expanding_std",
    "GNDVI_field_expanding_std",
    "SAVI_field_expanding_std",
    "soil_moisture_field_expanding_std",
    "rainfall_field_expanding_std",
    "temperature_field_expanding_std",
]


def prepare_feature_vector(raw_input: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure all 30 predictive features are populated with appropriate values:
    1. Reject target column 'yield'.
    2. Exclude identifier 'field_id' from model features.
    3. Auto-derive cyclical date features if date or year/month/day provided.
    4. Fill missing expanding features with None/NaN so SimpleImputer imputes them.
    """
    data = raw_input.copy()

    # Reject target column
    if TARGET_COLUMN in data:
        raise ValueError(
            f"Target '{TARGET_COLUMN}' cannot be present in inference input."
        )

    # If date_of_image is present, derive temporal features
    date_val = data.get("date_of_image") or data.get("date")
    if date_val:
        try:
            dt = pd.to_datetime(date_val)
            data["year"] = int(dt.year)
            data["month"] = int(dt.month)
            data["day_of_year"] = int(dt.dayofyear)
        except Exception:
            pass

    # Ensure temporal features exist
    year = data.get("year") or 2023
    month = data.get("month") or 6
    doy = data.get("day_of_year") or 165

    data["year"] = float(year)
    data["month"] = float(month)
    data["day_of_year"] = float(doy)

    if "month_sin" not in data or data["month_sin"] is None:
        data["month_sin"] = float(np.sin(2 * np.pi * month / 12))
    if "month_cos" not in data or data["month_cos"] is None:
        data["month_cos"] = float(np.cos(2 * np.pi * month / 12))
    if "doy_sin" not in data or data["doy_sin"] is None:
        data["doy_sin"] = float(np.sin(2 * np.pi * doy / 365))
    if "doy_cos" not in data or data["doy_cos"] is None:
        data["doy_cos"] = float(np.cos(2 * np.pi * doy / 365))

    if "field_obs_number" not in data or data["field_obs_number"] is None:
        data["field_obs_number"] = 1.0

    # Fill expanding features if absent
    for col in EXPANDING_COLS:
        if col not in data or data[col] is None:
            data[col] = np.nan

    # Retain all required predictive features
    feature_dict = {}
    for feat in PREDICTIVE_FEATURES:
        if feat in data:
            val = data[feat]
            feature_dict[feat] = val
        else:
            feature_dict[feat] = np.nan

    return feature_dict

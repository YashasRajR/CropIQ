"""
CropIQ Phase 2 - Yield Prediction Utility
Provides reusable, validated inference function `predict_yield` conforming to
the CropIQ backend contract.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import warnings
import joblib
import numpy as np
import pandas as pd

from .utils import (
    CATEGORICAL_FEATURES,
    MODELS_DIR,
    NUMERICAL_FEATURES,
    PREDICTIVE_FEATURES,
    TARGET_COLUMN,
    TARGET_UNIT,
)

DEFAULT_MODEL_PATH = MODELS_DIR / "cropiq_yield_model.joblib"
_CACHED_MODEL = None

KNOWN_CROPS = [
    "Apple", "Banana", "Barley", "Blackgram", "Chickpea", "Coconut", "Coffee",
    "Cotton", "Grapes", "Groundnut", "Jowar", "Jute", "Lentil", "Maize",
    "Mango", "Moong", "Mothbeans", "Mustard", "Onion", "Orange", "Papaya",
    "Pigeonpeas", "Pomegranate", "Potato", "Ragi", "Rice", "Saffron",
    "Soybean", "Sugarcane", "Wheat"
]


def load_prediction_model(model_path: Optional[Union[str, Path]] = None):
    """Load and cache the trained ML pipeline."""
    global _CACHED_MODEL
    path = Path(model_path) if model_path else DEFAULT_MODEL_PATH
    if not path.exists():
        raise FileNotFoundError(f"Trained model pipeline not found at {path}. Please run train.py first.")
    
    if _CACHED_MODEL is None or model_path is not None:
        model = joblib.load(path)
        if model_path is None:
            _CACHED_MODEL = model
        return model
    return _CACHED_MODEL


def validate_input_features(
    input_df: pd.DataFrame,
) -> List[str]:
    """
    Validate input DataFrame before feeding into inference pipeline:
    1. Rejects presence of target column (leakage check)
    2. Verifies presence of predictive features
    3. Checks numerical validity (finite, non-NaN)
    4. Detects unseen crop categories and returns warnings
    """
    detected_warnings = []

    # 1. Target presence check
    if TARGET_COLUMN in input_df.columns:
        raise ValueError(
            f"Target column '{TARGET_COLUMN}' found in inference input. "
            "Inference inputs must only contain predictive features, not the target."
        )

    # 2. Check for missing core columns
    missing_cols = [col for col in PREDICTIVE_FEATURES if col not in input_df.columns]
    if missing_cols:
        raise ValueError(
            f"Input is missing {len(missing_cols)} required predictive feature(s): {missing_cols}"
        )

    # 3. Numeric checks
    for col in NUMERICAL_FEATURES:
        series = input_df[col]
        if not np.issubdtype(series.dtype, np.number):
            raise TypeError(f"Numerical feature '{col}' contains non-numeric values.")
        if series.isna().any():
            if "expanding" in col:
                # Allowed by design for early observations without prior history; imputed via training median
                pass
            else:
                msg = f"Numerical feature '{col}' contains NaN values; will be imputed with training median."
                warnings.warn(msg, UserWarning)
                detected_warnings.append(msg)
        if np.isinf(series).any():
            raise ValueError(f"Numerical feature '{col}' contains infinite values in inference input.")

    # 4. Crop category checks
    for crop in input_df["crop_type"].unique():
        if crop not in KNOWN_CROPS:
            msg = (
                f"Crop category '{crop}' was not present in training data. "
                "The pipeline will encode it as an unknown category (all zeros), "
                "which may increase prediction uncertainty."
            )
            warnings.warn(msg, UserWarning)
            detected_warnings.append(msg)

    return detected_warnings


def predict_yield(
    input_data: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame],
    model_path: Optional[Union[str, Path]] = None,
) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Predict crop yield for one or more observations.

    Parameters:
    -----------
    input_data: dict, list of dicts, or pandas DataFrame containing feature values.
    model_path: optional path to serialized pipeline.

    Returns:
    --------
    dict (single observation) or list of dicts (batch):
        {
            "predicted_yield": float,
            "unit": "unconfirmed",
            "warnings": list of strings
        }
    """
    model = load_prediction_model(model_path)

    is_single_dict = isinstance(input_data, dict)
    if is_single_dict:
        df = pd.DataFrame([input_data])
    elif isinstance(input_data, list):
        df = pd.DataFrame(input_data)
    elif isinstance(input_data, pd.DataFrame):
        df = input_data.copy()
    else:
        raise TypeError(f"Unsupported input type: {type(input_data)}. Expected dict, list, or DataFrame.")

    # Validate features
    input_warnings = validate_input_features(df)

    # Ensure column ordering matches training
    X = df[PREDICTIVE_FEATURES]

    # Predict
    raw_preds = model.predict(X)

    results = []
    for pred in raw_preds:
        pred_val = float(pred)
        item = {
            "predicted_yield": round(pred_val, 4),
            "unit": TARGET_UNIT,
        }
        if input_warnings:
            item["warnings"] = input_warnings
        results.append(item)

    return results[0] if is_single_dict else results

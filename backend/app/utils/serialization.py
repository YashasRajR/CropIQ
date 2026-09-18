"""
CropIQ JSON Serialization Utilities
Converts NumPy types, NaN/Inf, and non-primitive structures to native JSON-serializable types.
"""

from typing import Any
import math
import numpy as np


def sanitize_for_json(obj: Any) -> Any:
    """
    Recursively sanitize objects to guarantee valid JSON serialization:
    - np.generic (np.float32, np.float64, np.int64, np.bool_) -> native float, int, bool
    - np.ndarray -> list of native items
    - NaN / Inf -> None or safe float representation
    - dict -> recursively sanitized dict
    - list / tuple -> recursively sanitized list
    """
    if obj is None:
        return None

    if isinstance(obj, (np.floating, float)):
        val = float(obj)
        if math.isnan(val) or math.isinf(val):
            return None
        return val

    if isinstance(obj, (np.integer, int)):
        return int(obj)

    if isinstance(obj, (np.bool_, bool)):
        return bool(obj)

    if isinstance(obj, np.ndarray):
        return [sanitize_for_json(item) for item in obj.tolist()]

    if isinstance(obj, dict):
        return {str(k): sanitize_for_json(v) for k, v in obj.items()}

    if isinstance(obj, (list, tuple, set)):
        return [sanitize_for_json(item) for item in obj]

    return obj

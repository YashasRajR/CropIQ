"""
CropIQ Phase 3 - Prediction Uncertainty & Confidence Module
Calculates model-derived uncertainty intervals using the variance among
the 300 individual decision trees in the Random Forest ensemble.
"""

from pathlib import Path
from typing import Any, Dict, Optional, Union
import numpy as np
import pandas as pd

from ..ml.utils import PREDICTIVE_FEATURES, TARGET_UNIT
from ..ml.predict import load_prediction_model

UNCERTAINTY_THRESHOLDS = {
    "low": 0.12,       # < 12% relative tree spread
    "moderate": 0.25,  # 12% - 25% relative tree spread
}


def estimate_prediction_uncertainty(
    input_data: Union[Dict[str, Any], pd.DataFrame],
    pipeline=None,
    percentile_lower: float = 10.0,
    percentile_upper: float = 90.0,
) -> Dict[str, Any]:
    """
    Compute ensemble prediction variance across all individual estimators.

    Parameters:
    -----------
    input_data: single observation dictionary or DataFrame.
    pipeline: trained model pipeline (ColumnTransformer + RandomForestRegressor).
    percentile_lower: lower quantile bound for tree distribution (default: 10th percentile).
    percentile_upper: upper quantile bound for tree distribution (default: 90th percentile).

    Returns:
    --------
    dict containing:
      - estimate: point prediction
      - lower: lower percentile of tree predictions
      - upper: upper percentile of tree predictions
      - std: standard deviation across tree predictions
      - relative_uncertainty: (upper - lower) / estimate
      - classification: LOW, MODERATE, or HIGH
      - method: descriptive method tag
      - disclaimer: model-derived uncertainty proxy notice
    """
    pipe = pipeline or load_prediction_model()
    preprocessor = pipe.named_steps["preprocessor"]
    rf_model = pipe.named_steps["model"]

    df = pd.DataFrame([input_data]) if isinstance(input_data, dict) else input_data.copy()
    X_raw = df[PREDICTIVE_FEATURES].iloc[[0]]

    # Transform through pipeline
    X_trans = preprocessor.transform(X_raw)
    pred_val = float(rf_model.predict(X_trans)[0])

    # Extract individual predictions from each estimator in the ensemble
    tree_predictions = np.array([tree.predict(X_trans)[0] for tree in rf_model.estimators_])

    lower_bound = float(np.percentile(tree_predictions, percentile_lower))
    upper_bound = float(np.percentile(tree_predictions, percentile_upper))
    tree_std = float(np.std(tree_predictions))

    # Calculate relative spread
    if pred_val > 1e-4:
        rel_uncertainty = (upper_bound - lower_bound) / pred_val
    else:
        rel_uncertainty = (upper_bound - lower_bound)

    # Uncertainty Classification
    if rel_uncertainty < UNCERTAINTY_THRESHOLDS["low"]:
        classification = "LOW"
    elif rel_uncertainty < UNCERTAINTY_THRESHOLDS["moderate"]:
        classification = "MODERATE"
    else:
        classification = "HIGH"

    return {
        "estimate": round(pred_val, 4),
        "lower": round(lower_bound, 4),
        "upper": round(upper_bound, 4),
        "std": round(tree_std, 4),
        "relative_uncertainty": round(rel_uncertainty, 4),
        "classification": classification,
        "unit": TARGET_UNIT,
        "n_trees_evaluated": len(rf_model.estimators_),
        "method": f"Random Forest Tree Ensemble Spread ({len(rf_model.estimators_)} trees, {percentile_lower}th-{percentile_upper}th percentile)",
        "disclaimer": "Model-derived uncertainty estimate based on variation across ensemble decision trees; not a guaranteed statistical prediction interval.",
    }

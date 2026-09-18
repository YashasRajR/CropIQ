"""
CropIQ Phase 3 - Explainability Engine
Provides global feature importance and local feature contribution explanations
using primary SHAP (TreeExplainer) with an autonomous, resilient fallback.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import json
import warnings
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from ..ml.utils import (
    MODELS_DIR,
    PREDICTIVE_FEATURES,
    REPORTS_DIR,
    TARGET_UNIT,
)
from ..ml.predict import load_prediction_model
from .utils import (
    FEATURE_METADATA,
    get_feature_display_name,
    load_crop_reference_distributions,
)

# Global Cached Explainer
_SHAP_EXPLAINER = None
_SHAP_AVAILABLE = True

try:
    import shap
except ImportError:
    _SHAP_AVAILABLE = False


def get_tree_explainer(model=None):
    """Initialize and cache shap.TreeExplainer on the Random Forest regressor."""
    global _SHAP_EXPLAINER, _SHAP_AVAILABLE
    if not _SHAP_AVAILABLE:
        return None

    if _SHAP_EXPLAINER is None:
        try:
            if model is None:
                pipeline = load_prediction_model()
                rf_model = pipeline.named_steps["model"]
            else:
                rf_model = model
            _SHAP_EXPLAINER = shap.TreeExplainer(rf_model)
        except Exception as e:
            warnings.warn(f"Failed to initialize SHAP TreeExplainer: {e}. Fallback explainability will be used.", UserWarning)
            _SHAP_EXPLAINER = None
    return _SHAP_EXPLAINER


# -------------------------------------------------------------
# 1. Local Prediction Explanation (Section 10-14, 21-22)
# -------------------------------------------------------------
def explain_prediction(
    input_data: Union[Dict[str, Any], pd.DataFrame],
    pipeline=None,
    force_fallback: bool = False,
) -> Dict[str, Any]:
    """
    Generate local feature contributions for a single observation.
    Returns structured explanation:
      {
        "predicted_yield": float,
        "baseline_yield": float,
        "method": "SHAP (TreeExplainer)" | "Fallback Feature Ablation",
        "top_positive_factors": [...],
        "top_negative_factors": [...],
        "top_overall_factors": [...],
        "all_contributions": [...],
        "explanation_identity_verified": bool,
        "identity_discrepancy": float
      }
    """
    pipe = pipeline or load_prediction_model()
    preprocessor = pipe.named_steps["preprocessor"]
    rf_model = pipe.named_steps["model"]

    df = pd.DataFrame([input_data]) if isinstance(input_data, dict) else input_data.copy()
    X_raw = df[PREDICTIVE_FEATURES].iloc[[0]]
    crop_val = str(X_raw["crop_type"].values[0])

    # Transform input using the pipeline preprocessor
    X_trans = preprocessor.transform(X_raw)
    pred_val = float(rf_model.predict(X_trans)[0])

    transformed_feature_names = list(preprocessor.get_feature_names_out())

    # Try Primary: SHAP
    explainer = None if force_fallback else get_tree_explainer(rf_model)
    if explainer is not None:
        try:
            shap_res = explainer(X_trans)
            raw_shap_values = np.asarray(shap_res.values[0], dtype=float)
            raw_baseline = float(shap_res.base_values[0]) if hasattr(shap_res, "base_values") else float(explainer.expected_value)
            method = "SHAP (TreeExplainer)"
            return _format_contributions(
                X_raw=X_raw,
                pred_val=pred_val,
                baseline_val=raw_baseline,
                raw_contributions=raw_shap_values,
                transformed_names=transformed_feature_names,
                method=method,
            )
        except Exception as e:
            warnings.warn(f"SHAP explanation failed ({e}); switching to Fallback Feature Ablation.", UserWarning)

    # Fallback Explainer: Feature Ablation against reference baseline
    return _explain_prediction_fallback(X_raw=X_raw, pipe=pipe, pred_val=pred_val)


def _format_contributions(
    X_raw: pd.DataFrame,
    pred_val: float,
    baseline_val: float,
    raw_contributions: np.ndarray,
    transformed_names: List[str],
    method: str,
) -> Dict[str, Any]:
    """
    Consolidate one-hot encoded categorical contributions back to human-readable
    feature categories and rank positive / negative contributors.
    """
    crop_val = str(X_raw["crop_type"].values[0])
    feature_contrib_map: Dict[str, float] = {}

    for name, val in zip(transformed_names, raw_contributions):
        if name.startswith("crop_type"):
            # Consolidate all crop_type one-hot terms into single crop_type feature
            feature_contrib_map["crop_type"] = feature_contrib_map.get("crop_type", 0.0) + float(val)
        else:
            feature_contrib_map[name] = float(val)

    # Build clean contribution records for all 30 predictive features
    all_contributors = []
    for feat in PREDICTIVE_FEATURES:
        contrib = feature_contrib_map.get(feat, 0.0)
        observed_val = X_raw[feat].values[0]
        disp_name = f"Crop Type: {crop_val}" if feat == "crop_type" else get_feature_display_name(feat)
        meta = FEATURE_METADATA.get(feat, {})

        all_contributors.append({
            "feature": feat,
            "display_name": disp_name,
            "observed_value": observed_val if feat == "crop_type" else (round(float(observed_val), 4) if pd.notna(observed_val) else None),
            "unit": meta.get("unit", TARGET_UNIT),
            "category": meta.get("category", "Other"),
            "actionable_type": meta.get("actionable_type", "NON_ACTIONABLE"),
            "user_controlled": meta.get("user_controlled", False),
            "contribution": round(contrib, 4),
            "absolute_contribution": round(abs(contrib), 4),
            "direction": "positive" if contrib > 0.0001 else ("negative" if contrib < -0.0001 else "neutral"),
        })

    # Validate conservation identity: baseline + sum(contributions) ≈ prediction
    sum_contrib = sum(item["contribution"] for item in all_contributors)
    discrepancy = abs((baseline_val + sum_contrib) - pred_val)
    identity_verified = discrepancy < 0.05  # within small float tolerance

    # Ranking
    pos_items = [c for c in all_contributors if c["direction"] == "positive"]
    neg_items = [c for c in all_contributors if c["direction"] == "negative"]

    top_pos = sorted(pos_items, key=lambda x: x["contribution"], reverse=True)[:3]
    top_neg = sorted(neg_items, key=lambda x: x["contribution"])[:3]  # most negative first
    top_overall = sorted(all_contributors, key=lambda x: x["absolute_contribution"], reverse=True)[:5]

    return {
        "predicted_yield": round(pred_val, 4),
        "baseline_yield": round(baseline_val, 4),
        "unit": TARGET_UNIT,
        "method": method,
        "explanation_identity_verified": identity_verified,
        "identity_discrepancy": round(float(discrepancy), 6),
        "top_positive_factors": top_pos,
        "top_negative_factors": top_neg,
        "top_overall_factors": top_overall,
        "all_contributions": all_contributors,
    }


def _explain_prediction_fallback(
    X_raw: pd.DataFrame,
    pipe,
    pred_val: float,
) -> Dict[str, Any]:
    """
    Deterministic fallback explainer using feature ablation against historical medians.
    Strictly preserves the explanation conservation identity.
    """
    ref_data = load_crop_reference_distributions()
    baseline_val = float(ref_data["overall"]["mean"])

    preprocessor = pipe.named_steps["preprocessor"]
    rf_model = pipe.named_steps["model"]

    # Compute marginal deviation for each feature
    deltas = {}
    from .utils import load_training_feature_bounds
    bounds = load_training_feature_bounds()

    for feat in PREDICTIVE_FEATURES:
        if feat == "crop_type":
            continue
        # Evaluate counterfactual prediction with feature replaced by its mean
        X_cf = X_raw.copy()
        mean_val = bounds.get(feat, {}).get("mean", 0.0)
        X_cf[feat] = mean_val
        X_cf_trans = preprocessor.transform(X_cf)
        pred_cf = float(rf_model.predict(X_cf_trans)[0])
        # Delta = current prediction - counterfactual prediction without this feature
        deltas[feat] = pred_val - pred_cf

    # Net difference to distribute
    total_delta = sum(deltas.values())
    target_offset = pred_val - baseline_val

    # Rescale deltas so sum exactly equals (pred_val - baseline_val)
    raw_contribs = np.zeros(len(preprocessor.get_feature_names_out()))
    trans_names = list(preprocessor.get_feature_names_out())

    scale = (target_offset / total_delta) if abs(total_delta) > 1e-4 else 1.0
    for feat, raw_d in deltas.items():
        if feat in trans_names:
            idx = trans_names.index(feat)
            raw_contribs[idx] = raw_d * scale

    return _format_contributions(
        X_raw=X_raw,
        pred_val=pred_val,
        baseline_val=baseline_val,
        raw_contributions=raw_contribs,
        transformed_names=trans_names,
        method="Fallback Feature Ablation",
    )


# -------------------------------------------------------------
# 2. Global Feature Importance Persistence (Section 60, 62)
# -------------------------------------------------------------
def extract_and_save_global_feature_importance(
    pipeline=None,
    save_json_path: Optional[Path] = None,
    save_fig_path: Optional[Path] = None,
) -> List[Dict[str, Any]]:
    """
    Compute, format, and save global feature importance ranks to models/global_feature_importance.json.
    """
    pipe = pipeline or load_prediction_model()
    preprocessor = pipe.named_steps["preprocessor"]
    rf_model = pipe.named_steps["model"]

    raw_importances = rf_model.feature_importances_
    trans_names = list(preprocessor.get_feature_names_out())

    # Consolidate one-hot importances
    feature_imp_map: Dict[str, float] = {}
    for name, imp in zip(trans_names, raw_importances):
        if name.startswith("crop_type"):
            feature_imp_map["crop_type"] = feature_imp_map.get("crop_type", 0.0) + float(imp)
        else:
            feature_imp_map[name] = float(imp)

    global_list = []
    for feat, imp in feature_imp_map.items():
        meta = FEATURE_METADATA.get(feat, {})
        global_list.append({
            "feature": feat,
            "display_name": get_feature_display_name(feat),
            "importance": round(float(imp), 6),
            "category": meta.get("category", "Other"),
            "actionable_type": meta.get("actionable_type", "NON_ACTIONABLE"),
            "user_controlled": meta.get("user_controlled", False),
        })

    # Sort descending
    global_list.sort(key=lambda x: x["importance"], reverse=True)
    for rank, item in enumerate(global_list, 1):
        item["rank"] = rank

    # Save JSON
    json_path = save_json_path or (MODELS_DIR / "global_feature_importance.json")
    json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(global_list, f, indent=2)

    # Plot figure
    fig_path = save_fig_path or (REPORTS_DIR / "fig_global_feature_importance_p3.png")
    fig_path.parent.mkdir(parents=True, exist_ok=True)

    top15 = global_list[:15][::-1]
    names = [x["display_name"] for x in top15]
    vals = [x["importance"] for x in top15]

    plt.figure(figsize=(9, 6))
    plt.barh(names, vals, color="#2b83ba", edgecolor="black")
    plt.xlabel("MDI Feature Importance", fontsize=11)
    plt.title("CropIQ Phase 3 — Global Predictive Feature Importance", fontsize=13, fontweight="bold")
    plt.grid(True, linestyle=":", alpha=0.6, axis="x")
    plt.tight_layout()
    plt.savefig(fig_path, dpi=300)
    plt.close()

    return global_list

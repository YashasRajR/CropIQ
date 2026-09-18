"""
CropIQ Phase 3 - Crop Yield Risk Assessment Engine
Combines yield deviation, prediction uncertainty, negative model contributors,
and data quality indicators into a transparent 0-100 Crop Yield Risk Indicator.
"""

from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

from .utils import (
    get_feature_display_name,
    load_crop_reference_distributions,
)

# Risk Thresholds (Section 28, 52)
RISK_LEVEL_THRESHOLDS = {
    "low_max": 35.0,        # 0 <= score < 35 -> LOW
    "moderate_max": 65.0,   # 35 <= score < 65 -> MODERATE
                            # score >= 65 -> HIGH
}

# Component Weights (Section 30, 52)
RISK_COMPONENT_WEIGHTS = {
    "yield_deviation": 0.50,
    "uncertainty": 0.25,
    "negative_contributors": 0.15,
    "data_quality": 0.10,
}


def compute_yield_risk(
    predicted_yield: float,
    crop_type: str,
    explanation_result: Dict[str, Any],
    uncertainty_result: Dict[str, Any],
    quality_warnings: List[str],
    is_out_of_distribution: bool = False,
    extrapolation_warning: bool = False,
    ref_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Compute structured Crop Yield Risk Indicator.

    Parameters:
    -----------
    predicted_yield: model prediction.
    crop_type: crop variety.
    explanation_result: output from explain_prediction().
    uncertainty_result: output from estimate_prediction_uncertainty().
    quality_warnings: list of input data quality / OOD warning strings.
    is_out_of_distribution: boolean flag.
    extrapolation_warning: boolean flag.
    ref_data: optional cached crop reference distributions.

    Returns:
    --------
    dict containing:
      - risk_level: LOW | MODERATE | HIGH
      - risk_score: int (0 to 100)
      - component_scores: detailed breakdown of 4 sub-scores
      - risk_drivers: list of factors that elevated risk
      - protective_factors: list of factors that reduced risk
      - yield_context: comparison against crop baseline
    """
    all_refs = ref_data or load_crop_reference_distributions()
    crops_ref = all_refs.get("crops", {})
    overall_ref = all_refs.get("overall", {})

    # 1. Determine Yield Reference (Hierarchy: Crop -> Overall)
    if crop_type in crops_ref and crops_ref[crop_type]["has_sufficient_samples"]:
        active_ref = crops_ref[crop_type]
        reference_type = "crop"
    else:
        active_ref = overall_ref
        reference_type = "overall_dataset_fallback"

    ref_median = active_ref["median"]
    ref_q1 = active_ref["q1"]
    ref_q3 = active_ref["q3"]

    # Yield relative position
    if predicted_yield >= ref_q3:
        relative_pos = "among the best plots CropIQ has seen for this crop"
    elif predicted_yield >= ref_median:
        relative_pos = "above average for this crop"
    elif predicted_yield >= ref_q1:
        relative_pos = "a bit below average for this crop"
    else:
        relative_pos = "well below average for this crop"

    # -------------------------------------------------------------
    # 2. Component Calculations (0 to 100 each)
    # -------------------------------------------------------------
    risk_drivers: List[str] = []
    protective_factors: List[str] = []

    # Component A: Yield Deviation (50% weight)
    if predicted_yield >= ref_median:
        # Favorable yield
        surplus_ratio = min(1.0, (predicted_yield - ref_median) / max(ref_median, 1.0))
        comp_yield = max(0.0, 15.0 - (surplus_ratio * 15.0))  # 0 to 15
        protective_factors.append(
            f"Your estimated yield is at or above what's typical for {crop_type}."
        )
    else:
        # Deficit below median
        deficit_ratio = (ref_median - predicted_yield) / max(ref_median, 1.0)
        # 10% deficit -> 30 score; 25% deficit -> 75 score; >35% deficit -> 100 score
        comp_yield = min(100.0, deficit_ratio * 280.0)
        risk_drivers.append(
            f"Your estimated yield is about {deficit_ratio * 100:.0f}% lower than what's typical for {crop_type}."
        )

    # Component B: Prediction Uncertainty (25% weight)
    rel_unc = uncertainty_result.get("relative_uncertainty", 0.15)
    # < 10% -> 0-30; 10-25% -> 30-70; > 25% -> 70-100
    comp_uncertainty = min(100.0, max(0.0, (rel_unc / 0.30) * 100.0))
    if uncertainty_result.get("classification") == "HIGH":
        risk_drivers.append(
            "This estimate is less certain than usual for your conditions — treat it as a rough guide."
        )
    elif uncertainty_result.get("classification") == "LOW":
        protective_factors.append(
            "This estimate is highly consistent for your conditions."
        )

    # Component C: Negative Contributors (15% weight)
    top_negatives = explanation_result.get("top_negative_factors", [])
    total_neg_contrib = sum(abs(item["contribution"]) for item in top_negatives)
    base_val = max(explanation_result.get("baseline_yield", 40.0), 1.0)

    neg_ratio = total_neg_contrib / base_val
    comp_negative = min(100.0, neg_ratio * 400.0)

    if top_negatives:
        strongest_neg = top_negatives[0]
        risk_drivers.append(
            f"{strongest_neg['display_name']} is currently working against your yield."
        )

    top_positives = explanation_result.get("top_positive_factors", [])
    if top_positives:
        strongest_pos = top_positives[0]
        protective_factors.append(
            f"{strongest_pos['display_name']} is currently helping your yield."
        )

    # Component D: Data Quality / OOD (10% weight)
    if extrapolation_warning:
        comp_quality = 100.0
        risk_drivers.append("Some of the values you entered are well outside what CropIQ usually sees, so treat this estimate as rough guidance.")
    elif is_out_of_distribution:
        comp_quality = 50.0
        risk_drivers.append("A couple of the values you entered are unusual compared to what CropIQ usually sees.")
    elif quality_warnings:
        comp_quality = 25.0
    else:
        comp_quality = 0.0
        protective_factors.append("The conditions you entered closely match what CropIQ has seen before, so this estimate should be solid.")

    # -------------------------------------------------------------
    # 3. Weighted Score & Risk Level Mapping (Section 29, 30)
    # -------------------------------------------------------------
    final_score = (
        (RISK_COMPONENT_WEIGHTS["yield_deviation"] * comp_yield)
        + (RISK_COMPONENT_WEIGHTS["uncertainty"] * comp_uncertainty)
        + (RISK_COMPONENT_WEIGHTS["negative_contributors"] * comp_negative)
        + (RISK_COMPONENT_WEIGHTS["data_quality"] * comp_quality)
    )
    final_score = int(np.clip(round(final_score), 0, 100))

    if final_score < RISK_LEVEL_THRESHOLDS["low_max"]:
        risk_level = "LOW"
    elif final_score < RISK_LEVEL_THRESHOLDS["moderate_max"]:
        risk_level = "MODERATE"
    else:
        risk_level = "HIGH"

    return {
        "risk_level": risk_level,
        "risk_score": final_score,
        "risk_drivers": risk_drivers,
        "protective_factors": protective_factors,
        "component_scores": {
            "yield_deviation_score": round(comp_yield, 2),
            "uncertainty_score": round(comp_uncertainty, 2),
            "negative_contributors_score": round(comp_negative, 2),
            "data_quality_score": round(comp_quality, 2),
            "weights": RISK_COMPONENT_WEIGHTS,
        },
        "yield_context": {
            "reference_type": reference_type,
            "crop": crop_type,
            "reference_median": ref_median,
            "reference_q1": ref_q1,
            "reference_q3": ref_q3,
            "relative_position": relative_pos,
        },
    }

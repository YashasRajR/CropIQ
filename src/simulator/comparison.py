"""
CropIQ Phase 5 - Scenario Comparison Engine
Computes absolute differences, percentage changes, material change classification
anchored in Phase 2 validation MAE, and structured feature diff tables.
"""

from typing import Any, Dict, List, Optional
from .utils import DEFAULT_MATERIAL_THRESHOLD, load_scenario_metadata


def compare_scenarios(
    baseline_yield: float,
    scenario_yield: float,
    current_input: Dict[str, Any],
    scenario_input: Dict[str, Any],
    changed_features: Dict[str, float],
    material_threshold: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Compare baseline model estimate with scenario model estimate.

    Parameters:
    -----------
    baseline_yield: point prediction from baseline input.
    scenario_yield: point prediction from modified scenario input.
    current_input: baseline feature dictionary.
    scenario_input: scenario feature dictionary.
    changed_features: dictionary of explicitly modified features.
    material_threshold: threshold below which difference is classified as non-material
                        (defaults to Phase 2 validation MAE: 0.9765).

    Returns:
    --------
    Structured comparison dictionary conforming to Section 21, 23, 26.
    """
    if material_threshold is None:
        try:
            meta = load_scenario_metadata()
            material_threshold = float(meta.get("material_change_threshold", DEFAULT_MATERIAL_THRESHOLD))
        except Exception:
            material_threshold = DEFAULT_MATERIAL_THRESHOLD

    # 1. Absolute difference (Rule 21)
    abs_diff = float(scenario_yield) - float(baseline_yield)

    # 2. Percentage difference with zero-baseline safeguard (Rule 21, 97)
    if abs(float(baseline_yield)) < 1e-4:
        pct_diff = None
        pct_explanation = (
            "Percentage change is unavailable because the baseline estimate is too close to zero."
        )
    else:
        pct_diff = (abs_diff / float(baseline_yield)) * 100.0
        pct_explanation = None

    # 3. Materiality & Direction (Rule 22, 23, 59)
    # Differences smaller than model validation MAE are labeled as non-material fluctuations
    is_material = abs(abs_diff) >= material_threshold

    if not is_material:
        direction = "no_material_change"
        materiality_label = "small model-estimated difference"
    elif abs_diff > 0:
        direction = "increase"
        materiality_label = "model estimates higher yield"
    else:
        direction = "decrease"
        materiality_label = "model estimates lower yield"

    # 4. Structured Feature Diffs (Rule 26)
    feature_diffs: Dict[str, Dict[str, Any]] = {}
    for feat in changed_features:
        cur_val = current_input.get(feat)
        scen_val = scenario_input.get(feat)
        if cur_val is not None and scen_val is not None:
            feature_diffs[feat] = {
                "baseline": round(float(cur_val), 4),
                "scenario": round(float(scen_val), 4),
                "difference": round(float(scen_val) - float(cur_val), 4),
            }

    return {
        "baseline_yield": round(float(baseline_yield), 4),
        "scenario_yield": round(float(scenario_yield), 4),
        "absolute_change": round(abs_diff, 4),
        "percentage_change": round(pct_diff, 2) if pct_diff is not None else None,
        "percentage_explanation": pct_explanation,
        "direction": direction,
        "is_material": is_material,
        "materiality_label": materiality_label,
        "material_threshold": round(material_threshold, 4),
        "feature_diffs": feature_diffs,
    }

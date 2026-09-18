"""
CropIQ Phase 5 - Scenario Delta Explanation & Reliability Engine
Analyzes shifts in model feature contributions, tracks risk/uncertainty progression,
computes scenario reliability, and synthesizes non-causal natural language summaries.
"""

from typing import Any, Dict, List, Optional, Tuple


def compute_delta_explanations(
    baseline_explanation: Dict[str, Any],
    scenario_explanation: Dict[str, Any],
    changed_features: Dict[str, float],
) -> List[Dict[str, Any]]:
    """
    Compare baseline feature contributions with scenario feature contributions.

    Returns:
    --------
    List of changed contributors with baseline contribution, scenario contribution, and delta.
    """
    base_contribs = {
        item.get("feature"): item.get("contribution", 0.0)
        for item in baseline_explanation.get("all_contributions", [])
    }
    scen_contribs = {
        item.get("feature"): item.get("contribution", 0.0)
        for item in scenario_explanation.get("all_contributions", [])
    }

    changed_contributors = []
    # Examine explicitly changed features first
    for feat in changed_features:
        b_c = base_contribs.get(feat, 0.0)
        s_c = scen_contribs.get(feat, 0.0)
        delta = s_c - b_c
        changed_contributors.append({
            "feature": feat,
            "baseline_contribution": round(b_c, 4),
            "scenario_contribution": round(s_c, 4),
            "delta_contribution": round(delta, 4),
            "direction": "positive_shift" if delta > 0 else "negative_shift",
        })

    # Sort by absolute magnitude of delta contribution
    changed_contributors.sort(key=lambda x: abs(x["delta_contribution"]), reverse=True)
    return changed_contributors


def evaluate_scenario_reliability(
    distance_class: str,
    uncertainty_level: str,
    num_changed_features: int,
    has_extrapolation_warning: bool,
) -> Tuple[str, str]:
    """
    Determine model scenario reliability (HIGH, MEDIUM, LOW) and the supporting rationale.
    """
    if has_extrapolation_warning or distance_class == "EXTRAPOLATIVE":
        return (
            "LOW",
            "Modified inputs require model extrapolation beyond observed training extremes.",
        )

    if uncertainty_level == "HIGH" or distance_class == "UNUSUAL":
        return (
            "MEDIUM",
            "The scenario values are in the extreme tails of the training distribution, or ensemble tree variance is elevated.",
        )

    if num_changed_features > 2:
        return (
            "MEDIUM",
            "Multiple simultaneous changes introduce interaction complexity into the model estimate.",
        )

    return (
        "HIGH",
        "The modified inputs are well within the model's typical training distribution with consistent ensemble agreement.",
    )


def format_scenario_summary(
    baseline_yield: float,
    scenario_yield: float,
    target_unit: str,
    comparison: Dict[str, Any],
    reliability: str,
    scenario_name: Optional[str] = None,
) -> str:
    """
    Generate deterministic, strictly non-causal scenario summary paragraph.
    """
    name_str = f"'{scenario_name}'" if scenario_name else "this scenario"
    abs_diff = comparison.get("absolute_change", 0.0)
    pct_diff = comparison.get("percentage_change")
    diff_sign = "+" if abs_diff > 0 else ""

    pct_str = f" ({diff_sign}{pct_diff:.1f}%)" if pct_diff is not None else ""
    is_mat = comparison.get("is_material", True)

    # Sentence 1: Yield comparison
    s1 = (
        f"Under {name_str}, the model estimates a yield of {scenario_yield:.2f} {target_unit} "
        f"compared to the baseline estimate of {baseline_yield:.2f} {target_unit}, representing an estimated difference "
        f"of {diff_sign}{abs_diff:.2f} {target_unit}{pct_str}."
    )

    # Sentence 2: Materiality Context
    if not is_mat:
        s2 = (
            f"Note: This estimated difference is smaller than the model's validation MAE "
            f"({comparison.get('material_threshold', 0.98):.2f} {target_unit}) and is classified as a small model fluctuation."
        )
    else:
        direction_phrase = "a higher" if abs_diff > 0 else "a lower"
        s2 = f"The model associates the modified conditions with {direction_phrase} predicted yield."

    # Sentence 3: Reliability and Non-Causal Disclaimer (Rule 2, 3, 56)
    s3 = (
        f"Scenario reliability is assessed as {reliability}. "
        "Important: This result represents a model-based scenario estimate and does not guarantee "
        "a physical causal response or real-world yield outcome."
    )

    return f"{s1} {s2} {s3}"

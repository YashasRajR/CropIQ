"""
CropIQ Phase 4 - Condition Evaluators & Composite Rule Operators
Provides modular, extensible condition checkers supporting comparison operators,
model contributions, risk signals, reference distributions, and composite AND/OR/NOT logic.
"""

from typing import Any, Dict, List, Optional, Tuple, Union


def evaluate_atomic_condition(
    cond: Dict[str, Any],
    context: Dict[str, Any],
) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """
    Evaluate a single condition against the context.

    Context contains:
    - 'input_data': dict of observed feature values
    - 'prediction': dict with 'yield', 'unit'
    - 'explanation': dict with 'top_positive_factors', 'top_negative_factors', 'all_contributions'
    - 'yield_context': dict with 'reference_median', 'reference_q1', 'reference_q3', 'relative_position'
    - 'risk': dict with 'level', 'score', 'drivers', etc.
    - 'uncertainty': dict with 'classification', 'relative_uncertainty', etc.
    - 'data_quality': dict with 'out_of_distribution', 'extrapolation_warning', 'warnings'

    Returns:
    - (is_matched: bool, evidence_dict: Optional[dict])
    """
    operator = cond.get("operator")
    feature = cond.get("feature")
    target_value = cond.get("value")

    input_data = context.get("input_data", {})
    explanation = context.get("explanation", {})
    yield_context = context.get("yield_context", {})
    risk = context.get("risk", {})
    uncertainty = context.get("uncertainty", {})
    data_quality = context.get("data_quality", {})

    # 1. Feature availability for feature-dependent operators
    observed_val = None
    if feature:
        observed_val = input_data.get(feature)

    # 2. Operator logic
    if operator == "equals":
        matched = observed_val == target_value
        evidence = (
            {
                "type": "feature_value_match",
                "feature": feature,
                "observed": observed_val,
                "target": target_value,
            }
            if matched
            else None
        )
        return matched, evidence

    elif operator == "not_equals":
        matched = observed_val != target_value
        evidence = (
            {
                "type": "feature_value_mismatch",
                "feature": feature,
                "observed": observed_val,
                "target": target_value,
            }
            if matched
            else None
        )
        return matched, evidence

    elif operator == "greater_than":
        if observed_val is None:
            return False, None
        matched = float(observed_val) > float(target_value)
        evidence = (
            {
                "type": "feature_threshold",
                "feature": feature,
                "observed": round(float(observed_val), 4),
                "threshold": float(target_value),
                "comparison": ">",
            }
            if matched
            else None
        )
        return matched, evidence

    elif operator == "less_than":
        if observed_val is None:
            return False, None
        matched = float(observed_val) < float(target_value)
        evidence = (
            {
                "type": "feature_threshold",
                "feature": feature,
                "observed": round(float(observed_val), 4),
                "threshold": float(target_value),
                "comparison": "<",
            }
            if matched
            else None
        )
        return matched, evidence

    elif operator == "greater_or_equal":
        if observed_val is None:
            return False, None
        matched = float(observed_val) >= float(target_value)
        evidence = (
            {
                "type": "feature_threshold",
                "feature": feature,
                "observed": round(float(observed_val), 4),
                "threshold": float(target_value),
                "comparison": ">=",
            }
            if matched
            else None
        )
        return matched, evidence

    elif operator == "less_or_equal":
        if observed_val is None:
            return False, None
        matched = float(observed_val) <= float(target_value)
        evidence = (
            {
                "type": "feature_threshold",
                "feature": feature,
                "observed": round(float(observed_val), 4),
                "threshold": float(target_value),
                "comparison": "<=",
            }
            if matched
            else None
        )
        return matched, evidence

    elif operator == "between":
        if observed_val is None:
            return False, None
        min_v, max_v = cond.get("range", [target_value, target_value])
        matched = float(min_v) <= float(observed_val) <= float(max_v)
        evidence = (
            {
                "type": "feature_in_range",
                "feature": feature,
                "observed": round(float(observed_val), 4),
                "range": [min_v, max_v],
            }
            if matched
            else None
        )
        return matched, evidence

    elif operator == "outside_range":
        if observed_val is None:
            return False, None
        min_v, max_v = cond.get("range", [0, 0])
        matched = float(observed_val) < float(min_v) or float(observed_val) > float(max_v)
        evidence = (
            {
                "type": "feature_outside_range",
                "feature": feature,
                "observed": round(float(observed_val), 4),
                "range": [min_v, max_v],
            }
            if matched
            else None
        )
        return matched, evidence

    elif operator == "less_than_feature":
        target_feat = cond.get("target_feature")
        margin = float(cond.get("margin_factor", 1.0))
        target_val = input_data.get(target_feat)
        if observed_val is None or target_val is None:
            return False, None
        matched = float(observed_val) < (float(target_val) * margin)
        evidence = (
            {
                "type": "feature_comparison",
                "feature": feature,
                "observed": round(float(observed_val), 4),
                "target_feature": target_feat,
                "target_value": round(float(target_val), 4),
                "margin_factor": margin,
            }
            if matched
            else None
        )
        return matched, evidence

    elif operator == "negative_contribution":
        if not feature:
            return False, None
        # Check SHAP / local contributions for this feature
        all_contribs = explanation.get("all_contributions", [])
        for item in all_contribs:
            if item.get("feature") == feature or item.get("feature", "").startswith(feature):
                contrib = float(item.get("contribution", 0.0))
                if contrib < -0.01:
                    return True, {
                        "type": "negative_model_contribution",
                        "feature": feature,
                        "contribution": round(contrib, 4),
                        "observed": item.get("observed_value"),
                    }
        return False, None

    elif operator == "positive_contribution":
        if not feature:
            return False, None
        all_contribs = explanation.get("all_contributions", [])
        for item in all_contribs:
            if item.get("feature") == feature or item.get("feature", "").startswith(feature):
                contrib = float(item.get("contribution", 0.0))
                if contrib > 0.01:
                    return True, {
                        "type": "positive_model_contribution",
                        "feature": feature,
                        "contribution": round(contrib, 4),
                        "observed": item.get("observed_value"),
                    }
        return False, None

    elif operator == "relative_to_reference":
        position = str(target_value).lower()
        pred_yield = context.get("prediction", {}).get("yield", 0.0)
        q1 = yield_context.get("reference_q1")
        q3 = yield_context.get("reference_q3")
        med = yield_context.get("reference_median")

        if position in ("below_q1", "lower_quartile") and q1 is not None:
            matched = float(pred_yield) < float(q1)
            evidence = (
                {
                    "type": "yield_relative_to_reference",
                    "predicted_yield": round(float(pred_yield), 2),
                    "reference_q1": round(float(q1), 2),
                    "position": "below_q1",
                }
                if matched
                else None
            )
            return matched, evidence
        elif position in ("above_q3", "upper_quartile") and q3 is not None:
            matched = float(pred_yield) > float(q3)
            evidence = (
                {
                    "type": "yield_relative_to_reference",
                    "predicted_yield": round(float(pred_yield), 2),
                    "reference_q3": round(float(q3), 2),
                    "position": "above_q3",
                }
                if matched
                else None
            )
            return matched, evidence
        elif position in ("below_median", "below_reference") and med is not None:
            matched = float(pred_yield) < float(med)
            evidence = (
                {
                    "type": "yield_relative_to_reference",
                    "predicted_yield": round(float(pred_yield), 2),
                    "reference_median": round(float(med), 2),
                    "position": "below_median",
                }
                if matched
                else None
            )
            return matched, evidence
        return False, None

    elif operator == "risk_level_equals":
        current_risk = risk.get("level", risk.get("risk_level", "LOW"))
        matched = str(current_risk).upper() == str(target_value).upper()
        evidence = (
            {
                "type": "risk_level_trigger",
                "current_risk_level": current_risk,
                "target_risk_level": target_value,
                "risk_score": risk.get("score", risk.get("risk_score")),
            }
            if matched
            else None
        )
        return matched, evidence

    elif operator == "uncertainty_level_equals":
        current_unc = uncertainty.get("classification", "LOW")
        matched = str(current_unc).upper() == str(target_value).upper()
        evidence = (
            {
                "type": "uncertainty_trigger",
                "current_uncertainty": current_unc,
                "relative_uncertainty": uncertainty.get("relative_uncertainty"),
            }
            if matched
            else None
        )
        return matched, evidence

    elif operator == "is_out_of_distribution":
        is_ood = data_quality.get("out_of_distribution", False)
        matched = bool(is_ood)
        evidence = (
            {
                "type": "out_of_distribution_trigger",
                "out_of_distribution": True,
            }
            if matched
            else None
        )
        return matched, evidence

    elif operator == "extrapolation_warning":
        has_extrap = data_quality.get("extrapolation_warning", False)
        matched = bool(has_extrap)
        evidence = (
            {
                "type": "extrapolation_warning_trigger",
                "extrapolation_warning": True,
            }
            if matched
            else None
        )
        return matched, evidence

    elif operator == "has_data_quality_warnings":
        warnings = data_quality.get("warnings", [])
        matched = len(warnings) > 0
        evidence = (
            {
                "type": "data_quality_warnings_trigger",
                "warning_count": len(warnings),
                "warnings": warnings,
            }
            if matched
            else None
        )
        return matched, evidence

    return False, None


def evaluate_composite_condition(
    trigger_dict: Dict[str, Any],
    context: Dict[str, Any],
) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Evaluate composite conditions supporting 'all' (AND), 'any' (OR), 'not' (NOT),
    or atomic condition specifications.

    Returns:
    - (is_matched: bool, accumulated_evidence: List[Dict[str, Any]])
    """
    if not trigger_dict:
        return True, []

    accumulated_evidence: List[Dict[str, Any]] = []

    # AND operator: 'all'
    if "all" in trigger_dict:
        conditions = trigger_dict["all"]
        for subcond in conditions:
            matched, ev = evaluate_composite_condition(subcond, context)
            if not matched:
                return False, []
            if ev:
                accumulated_evidence.extend(ev)
        return True, accumulated_evidence

    # OR operator: 'any'
    if "any" in trigger_dict:
        conditions = trigger_dict["any"]
        for subcond in conditions:
            matched, ev = evaluate_composite_condition(subcond, context)
            if matched:
                if ev:
                    accumulated_evidence.extend(ev)
                return True, accumulated_evidence
        return False, []

    # NOT operator: 'not'
    if "not" in trigger_dict:
        subcond = trigger_dict["not"]
        matched, _ = evaluate_composite_condition(subcond, context)
        if not matched:
            return True, [{"type": "negation_condition_satisfied"}]
        return False, []

    # Atomic condition
    matched, ev = evaluate_atomic_condition(trigger_dict, context)
    if matched and ev:
        accumulated_evidence.append(ev)
    return matched, accumulated_evidence

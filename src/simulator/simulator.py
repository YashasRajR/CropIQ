"""
CropIQ Phase 5 - What-If Scenario Simulator Core Engine
Integrates input copying, validation, model inference, delta explainability,
risk tracking, comparative ranking, and 1D feature sensitivity analysis.
"""

from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd

from .comparison import compare_scenarios
from .constraints import apply_scenario_constraints
from .explanation import (
    compute_delta_explanations,
    evaluate_scenario_reliability,
    format_scenario_summary,
)
from .utils import (
    calculate_scenario_distance,
    load_scenario_metadata,
    session_history,
)
from .validator import (
    ScenarioValidationError,
    validate_baseline_input,
    validate_scenario_changes,
)
from ..intelligence import analyze_crop_prediction
from ..ml.predict import load_prediction_model
from ..ml.utils import TARGET_UNIT


def simulate_scenario(
    current_input: Union[Dict[str, Any], pd.DataFrame],
    scenario_changes: Dict[str, Any],
    scenario_name: Optional[str] = None,
    pipeline=None,
    run_explanation: bool = True,
) -> Dict[str, Any]:
    """
    Simulate what-if changes against the baseline observation using the SAME Phase 2 model.

    Parameters:
    -----------
    current_input: baseline farm observation (dict or DataFrame).
    scenario_changes: dictionary of features to modify and their new values.
    scenario_name: optional descriptive label for the scenario.
    pipeline: optional pre-loaded prediction pipeline.
    run_explanation: if True, runs Phase 3 delta explainability.

    Returns:
    --------
    Complete structured dictionary conforming to Section 63/91 contract.
    """
    pipe = pipeline or load_prediction_model()
    metadata = load_scenario_metadata()

    # 1. Validate baseline input (Rule 6, 64)
    baseline_dict = validate_baseline_input(current_input)

    # 2. Validate proposed scenario changes (Rule 6, 16, 64, 65, 66)
    is_valid, validated_changes, val_warnings = validate_scenario_changes(
        current_input=baseline_dict,
        scenario_changes=scenario_changes,
        metadata=metadata,
    )

    # 3. Create scenario input using deep-copy immutability (Rule 7, 70)
    scenario_dict, interaction_warnings = apply_scenario_constraints(
        current_input=baseline_dict,
        scenario_changes=validated_changes,
    )

    # 4. Generate Baseline Prediction & Intelligence (Rule 8, 9)
    baseline_intel = analyze_crop_prediction(baseline_dict, pipeline=pipe, validate_output=False)
    base_yield = baseline_intel["prediction"]["yield"]

    # 5. Generate Scenario Prediction & Intelligence on the SAME Model (Rule 6, 9)
    scenario_intel = analyze_crop_prediction(scenario_dict, pipeline=pipe, validate_output=False)
    scen_yield = scenario_intel["prediction"]["yield"]

    # 6. Scenario Comparison & Materiality (Rule 21, 23, 26)
    comparison_res = compare_scenarios(
        baseline_yield=base_yield,
        scenario_yield=scen_yield,
        current_input=baseline_dict,
        scenario_input=scenario_dict,
        changed_features=validated_changes,
    )

    # 7. Scenario Realism Distance (Rule 103, 104)
    dist, dist_class = calculate_scenario_distance(
        current_input=baseline_dict,
        scenario_input=scenario_dict,
        metadata=metadata,
    )

    # 8. Delta Explainability & Shifts (Rule 27, 28)
    delta_contributors = []
    if run_explanation:
        delta_contributors = compute_delta_explanations(
            baseline_explanation=baseline_intel.get("explanation", {}),
            scenario_explanation=scenario_intel.get("explanation", {}),
            changed_features=validated_changes,
        )

    # 9. Risk & Uncertainty Progression (Rule 30, 31, 60)
    base_risk = baseline_intel.get("risk", {})
    scen_risk = scenario_intel.get("risk", {})
    base_unc = baseline_intel.get("uncertainty", {})
    scen_unc = scenario_intel.get("uncertainty", {})

    risk_progression = {
        "baseline_level": base_risk.get("level"),
        "scenario_level": scen_risk.get("level"),
        "baseline_score": base_risk.get("score"),
        "scenario_score": scen_risk.get("score"),
        "risk_changed": base_risk.get("level") != scen_risk.get("level"),
    }

    uncertainty_progression = {
        "baseline_level": base_unc.get("classification"),
        "scenario_level": scen_unc.get("classification"),
        "relative_uncertainty": scen_unc.get("relative_uncertainty"),
        "uncertainty_changed": base_unc.get("classification") != scen_unc.get("classification"),
    }

    # 10. Reliability Scoring (Rule 77, 78)
    all_warnings = val_warnings + interaction_warnings + scenario_intel.get("data_quality", {}).get("warnings", [])
    has_extrap = scenario_intel.get("data_quality", {}).get("extrapolation_warning", False)
    reliability, rel_reason = evaluate_scenario_reliability(
        distance_class=dist_class,
        uncertainty_level=scen_unc.get("classification", "LOW"),
        num_changed_features=len(validated_changes),
        has_extrapolation_warning=has_extrap,
    )

    # 11. Deterministic Non-Causal Summary (Rule 2, 56, 107)
    effective_name = scenario_name or (
        f"{list(validated_changes.keys())[0].replace('_', ' ').title()} Scenario"
        if len(validated_changes) == 1
        else "Multi-Variable Scenario"
    )
    summary_text = format_scenario_summary(
        baseline_yield=base_yield,
        scenario_yield=scen_yield,
        target_unit=TARGET_UNIT,
        comparison=comparison_res,
        reliability=reliability,
        scenario_name=effective_name,
    )

    # 12. Record to Session History (Rule 45)
    session_history.record_scenario(
        scenario_name=effective_name,
        changes=validated_changes,
        baseline_prediction=base_yield,
        scenario_prediction=scen_yield,
        difference=comparison_res["absolute_change"],
        percentage_change=comparison_res["percentage_change"],
        risk_level=scen_risk.get("level", "LOW"),
        uncertainty_level=scen_unc.get("classification", "LOW"),
        warnings=all_warnings,
    )

    # 13. Assembled Response Schema (Rule 63)
    return {
        "baseline": {
            "input": baseline_dict,
            "predicted_yield": base_yield,
            "unit": TARGET_UNIT,
            "risk": base_risk,
            "uncertainty": base_unc,
        },
        "scenario": {
            "name": effective_name,
            "input": scenario_dict,
            "changes": validated_changes,
            "predicted_yield": scen_yield,
            "unit": TARGET_UNIT,
            "risk": scen_risk,
            "uncertainty": scen_unc,
        },
        "comparison": comparison_res,
        "progression": {
            "risk": risk_progression,
            "uncertainty": uncertainty_progression,
        },
        "explanation": {
            "changed_features": list(validated_changes.keys()),
            "delta_contributors": delta_contributors,
        },
        "validation": {
            "within_training_range": not has_extrap and dist_class != "EXTRAPOLATIVE",
            "distance": dist,
            "distance_class": dist_class,
            "warnings": all_warnings,
        },
        "interpretation": {
            "summary": summary_text,
            "scenario_reliability": reliability,
            "reliability_reason": rel_reason,
            "causal_claim": False,  # Strict safeguard: Model estimation != causal fact
        },
    }


def simulate_multiple_scenarios(
    current_input: Union[Dict[str, Any], pd.DataFrame],
    scenarios: List[Dict[str, Any]],
    pipeline=None,
) -> Dict[str, Any]:
    """
    Batch simulation of multiple named scenarios (Rule 44, 85, 108).
    Loads model once and returns comparative ranking table.
    """
    pipe = pipeline or load_prediction_model()
    results = []

    for scen in scenarios:
        s_name = scen.get("name", "Unnamed Scenario")
        s_changes = scen.get("changes", {})
        res = simulate_scenario(
            current_input=current_input,
            scenario_changes=s_changes,
            scenario_name=s_name,
            pipeline=pipe,
            run_explanation=False,  # Streamline batch speed
        )
        results.append({
            "name": s_name,
            "changes": s_changes,
            "scenario_yield": res["scenario"]["predicted_yield"],
            "difference": res["comparison"]["absolute_change"],
            "percentage_change": res["comparison"]["percentage_change"],
            "direction": res["comparison"]["direction"],
            "risk_level": res["scenario"]["risk"].get("level", "LOW"),
            "uncertainty_level": res["scenario"]["uncertainty"].get("classification", "LOW"),
            "reliability": res["interpretation"]["scenario_reliability"],
        })

    # Sort by scenario estimated yield descending
    results.sort(key=lambda x: x["scenario_yield"], reverse=True)

    highest_name = results[0]["name"] if results else "None"
    comparative_summary = (
        f"Among the {len(results)} tested scenarios, '{highest_name}' produced the highest "
        "model-estimated yield. This comparison reflects simulated model associations "
        "and is not a guaranteed agronomic optimum."
    )

    return {
        "total_scenarios": len(results),
        "comparative_summary": comparative_summary,
        "scenarios_ranked": results,
    }


def compute_feature_sensitivity(
    current_input: Union[Dict[str, Any], pd.DataFrame],
    feature_name: str,
    num_points: int = 10,
    pipeline=None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generate 1D sensitivity curve for a feature holding all other inputs fixed (Rule 51-54).
    """
    pipe = pipeline or load_prediction_model()
    meta = metadata or load_scenario_metadata()
    features_meta = meta.get("features", {})

    if feature_name not in features_meta:
        raise ScenarioValidationError(
            f"Feature '{feature_name}' is not registered in scenario feature metadata."
        )

    f_info = features_meta[feature_name]
    stats = f_info.get("training_stats", {})
    p01 = stats.get("p01", stats.get("min", 0.0))
    p99 = stats.get("p99", stats.get("max", 100.0))

    grid_values = np.linspace(p01, p99, num_points)

    base_dict = validate_baseline_input(current_input)
    base_val = base_dict.get(feature_name)
    base_intel = analyze_crop_prediction(base_dict, pipeline=pipe, validate_output=False)
    base_yield = base_intel["prediction"]["yield"]

    points = []
    for val in grid_values:
        v_float = round(float(val), 4)
        scen_dict = base_dict.copy()
        scen_dict[feature_name] = v_float
        pred_res = analyze_crop_prediction(scen_dict, pipeline=pipe, validate_output=False)
        points.append({
            "feature_value": v_float,
            "predicted_yield": pred_res["prediction"]["yield"],
            "difference": round(pred_res["prediction"]["yield"] - base_yield, 4),
        })

    return {
        "feature": feature_name,
        "display_name": f_info.get("display_name", feature_name),
        "unit": f_info.get("unit", "unconfirmed"),
        "baseline_value": base_val,
        "baseline_yield": base_yield,
        "points": points,
        "disclaimer": (
            f"This curve depicts model sensitivity for {feature_name} holding other features constant. "
            "It represents learned statistical associations, not a physical crop response curve."
        ),
    }

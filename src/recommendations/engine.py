"""
CropIQ Phase 4 - Recommendation Engine Main Entry Point
Integrates rule evaluation, prioritization, deduplication, conflict resolution,
formatting, and schema validation into an API-ready recommendation generator.
"""

from typing import Any, Dict, List, Optional, Union
import pandas as pd

from .evaluator import evaluate_candidate_rules
from .formatter import (
    format_recommendation_farmer_mode,
    format_recommendation_technical_mode,
    generate_executive_summary,
)
from .prioritizer import prioritize_and_rank_recommendations
from .utils import RuleTracer, load_agricultural_rules
from .validator import (
    RecommendationValidationError,
    validate_rule_catalog,
    validate_single_recommendation,
)


def generate_recommendations(
    input_data: Optional[Union[Dict[str, Any], pd.DataFrame]] = None,
    prediction_result: Optional[Dict[str, Any]] = None,
    explanation_result: Optional[Dict[str, Any]] = None,
    risk_result: Optional[Dict[str, Any]] = None,
    uncertainty_result: Optional[Dict[str, Any]] = None,
    data_quality_result: Optional[Dict[str, Any]] = None,
    intelligence_payload: Optional[Dict[str, Any]] = None,
    rules: Optional[List[Dict[str, Any]]] = None,
    mode: str = "farmer",
    top_n: int = 5,
    validate_output: bool = True,
) -> Dict[str, Any]:
    """
    Main entry point for CropIQ Phase 4 Recommendation Engine.

    Transforms Phase 2 predictions and Phase 3 intelligence into prioritized,
    deterministic, non-causal agricultural recommendations.

    Parameters:
    -----------
    input_data: farm observations (dict or DataFrame).
    prediction_result: dict with 'yield', 'unit'.
    explanation_result: dict with 'top_positive_factors', 'top_negative_factors', etc.
    risk_result: dict with 'level', 'score', 'drivers', etc.
    uncertainty_result: dict with 'classification', 'lower', 'upper', etc.
    data_quality_result: dict with 'warnings', 'out_of_distribution', etc.
    intelligence_payload: optional single dict containing all Phase 3 outputs.
    rules: optional list of rule dicts; if None, loads from knowledge base.
    mode: 'farmer' (default, clear text) or 'technical' (audit mode with exact scores/rules).
    top_n: maximum number of top recommendations to display (default 5).
    validate_output: if True, validates recommendation schema and prohibited language.

    Returns:
    --------
    API-ready dictionary with 'summary', 'recommendations', 'all_candidates', 'rule_trace', 'warnings'.
    """
    tracer = RuleTracer()

    # 1. Harmonize inputs into unified payload and input dictionary
    if intelligence_payload is not None:
        payload = intelligence_payload
    else:
        payload = {
            "prediction": prediction_result or {},
            "explanation": explanation_result or {},
            "context": (risk_result or {}).get("yield_context", {}),
            "risk": risk_result or {},
            "uncertainty": uncertainty_result or {},
            "data_quality": data_quality_result or {"warnings": [], "out_of_distribution": False, "extrapolation_warning": False},
        }

    # Normalize input_data
    raw_input: Dict[str, Any] = {}
    if isinstance(input_data, pd.DataFrame):
        raw_input = input_data.iloc[0].to_dict()
    elif isinstance(input_data, dict):
        raw_input = input_data.copy()
    else:
        # Extract from explanation contributions if available
        for item in payload.get("explanation", {}).get("all_contributions", []):
            feat = item.get("feature")
            val = item.get("observed_value")
            if feat and val is not None:
                raw_input[feat] = val
        crop = payload.get("context", {}).get("crop")
        if crop:
            raw_input["crop_type"] = crop

    # 2. Load rules if needed
    if rules is None:
        rules = load_agricultural_rules()

    # 3. Evaluate candidate rules
    candidates = evaluate_candidate_rules(
        intelligence_payload=payload,
        input_data=raw_input,
        rules=rules,
        tracer=tracer,
    )

    # 4. Prioritize, deduplicate, resolve conflicts, and rank
    displayed_candidates, all_ranked_candidates = prioritize_and_rank_recommendations(
        candidates=candidates,
        intelligence_payload=payload,
        top_n=top_n,
        tracer=tracer,
    )

    # 5. Format recommendations
    formatter_fn = (
        format_recommendation_technical_mode
        if mode == "technical"
        else format_recommendation_farmer_mode
    )
    formatted_recs = [formatter_fn(c) for c in displayed_candidates]
    formatted_all_candidates = [formatter_fn(c) for c in all_ranked_candidates]

    # 6. Executive summary synthesis
    exec_summary = generate_executive_summary(formatted_recs, payload)

    # 7. Priority counts
    high_count = sum(1 for r in formatted_recs if r.get("priority") == "HIGH")
    med_count = sum(1 for r in formatted_recs if r.get("priority") == "MEDIUM")
    low_count = sum(1 for r in formatted_recs if r.get("priority") == "LOW")

    crop = raw_input.get("crop_type")
    crop_specific_avail = any(
        r.get("crop") == crop for r in all_ranked_candidates if r.get("category") == "CROP"
    )

    output = {
        "summary": {
            "total_generated": len(all_ranked_candidates),
            "displayed": len(formatted_recs),
            "high_priority": high_count,
            "medium_priority": med_count,
            "low_priority": low_count,
            "crop_specific_recommendations_available": crop_specific_avail,
            "executive_summary": exec_summary,
        },
        "recommendations": formatted_recs,
        "all_candidates": formatted_all_candidates,
        "rule_trace": tracer.get_logs(),
        "warnings": payload.get("data_quality", {}).get("warnings", []),
    }

    # 8. Schema and safety validation
    if validate_output:
        for idx, rec in enumerate(formatted_recs):
            is_valid, issues = validate_single_recommendation(rec)
            if not is_valid:
                raise RecommendationValidationError(
                    f"Recommendation index {idx} ('{rec.get('id')}') failed validation: {'; '.join(issues)}"
                )

    return output

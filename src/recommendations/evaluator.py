"""
CropIQ Phase 4 - Rule Trigger Evaluator
Iterates over knowledge base rules, validates feature availability, applies crop filtering,
and evaluates trigger logic against the Phase 3 intelligence payload.
"""

from typing import Any, Dict, List, Optional
import pandas as pd

from .rules import evaluate_composite_condition
from .utils import RuleTracer, load_agricultural_rules


def evaluate_candidate_rules(
    intelligence_payload: Dict[str, Any],
    input_data: Optional[Dict[str, Any]] = None,
    rules: Optional[List[Dict[str, Any]]] = None,
    tracer: Optional[RuleTracer] = None,
) -> List[Dict[str, Any]]:
    """
    Evaluate all active rules against the intelligence payload and farm input.

    Parameters:
    -----------
    intelligence_payload: complete Phase 3 output contract dictionary.
    input_data: optional dictionary of raw features (if not provided, extracted from context/explanation).
    rules: optional list of loaded rule dictionaries; if None, loads from knowledge base.
    tracer: optional RuleTracer instance to record diagnostic lifecycle events.

    Returns:
    --------
    List of candidate recommendation dictionaries that matched.
    """
    if rules is None:
        rules = load_agricultural_rules()

    # Extract farm input features
    if input_data is None:
        input_data = {}
        # Try extracting observed values from explanation
        explanation = intelligence_payload.get("explanation", {})
        for item in explanation.get("all_contributions", []):
            feat = item.get("feature")
            val = item.get("observed_value")
            if feat and val is not None:
                input_data[feat] = val
        # Also extract crop_type from context
        crop_type = intelligence_payload.get("context", {}).get("crop")
        if crop_type:
            input_data["crop_type"] = crop_type

    crop = input_data.get("crop_type")

    # Construct unified evaluation context
    context = {
        "input_data": input_data,
        "prediction": intelligence_payload.get("prediction", {}),
        "explanation": intelligence_payload.get("explanation", {}),
        "yield_context": intelligence_payload.get("context", {}),
        "risk": intelligence_payload.get("risk", {}),
        "uncertainty": intelligence_payload.get("uncertainty", {}),
        "data_quality": intelligence_payload.get("data_quality", {}),
    }

    candidates: List[Dict[str, Any]] = []

    for rule in rules:
        rule_id = rule.get("id", "unknown_rule")
        category = rule.get("category", "GENERAL")

        # 1. Rule enabled check
        if not rule.get("enabled", True):
            if tracer:
                tracer.record(rule_id, "DISABLED", "Rule is disabled in knowledge base", category)
            continue

        # 2. Crop filtering
        supported_crops = rule.get("supported_crops", [])
        if supported_crops:
            if not crop or crop not in supported_crops:
                if tracer:
                    tracer.record(
                        rule_id,
                        "SKIPPED_CROP",
                        f"Current crop '{crop}' not in supported crops: {supported_crops}",
                        category,
                    )
                continue

        # 3. Required feature availability check
        required_features = rule.get("required_features", [])
        missing_features = [f for f in required_features if f not in input_data or input_data[f] is None]
        if missing_features:
            if tracer:
                tracer.record(
                    rule_id,
                    "SKIPPED_FEATURE",
                    f"Missing required features: {missing_features}",
                    category,
                )
            continue

        if tracer:
            tracer.record(rule_id, "EVALUATING", "Evaluating trigger conditions", category)

        # 4. Evaluate composite trigger
        trigger_dict = rule.get("trigger", {})
        matched, evidence_list = evaluate_composite_condition(trigger_dict, context)

        if matched:
            candidate = {
                "id": rule_id,
                "version": rule.get("version", "1.0"),
                "category": category,
                "priority": rule.get("priority", "MEDIUM"),
                "actionability": rule.get("actionability", "INFORMATIONAL"),
                "title": rule.get("title", ""),
                "reason": rule.get("reason", ""),
                "action": rule.get("action", ""),
                "evidence": evidence_list,
                "confidence": rule.get("confidence", "MEDIUM"),
                "source_type": rule.get("source_type", "prototype_heuristic"),
                "source": rule.get("source"),
                "limitations": list(rule.get("limitations", [])),
                "what_if_supported": bool(rule.get("what_if_supported", False)),
                "crop": crop,
                "trigger_spec": trigger_dict,
            }
            candidates.append(candidate)
            if tracer:
                tracer.record(
                    rule_id,
                    "MATCHED",
                    f"Matched with {len(evidence_list)} evidence items",
                    category,
                )
        else:
            if tracer:
                tracer.record(rule_id, "NO_MATCH", "Conditions not satisfied", category)

    return candidates

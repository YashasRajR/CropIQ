"""
CropIQ Phase 4 - Recommendation Prioritizer & Conflict Resolution Engine
Computes transparent priority scores (0-100), evaluates evidence strength and confidence,
deduplicates redundant recommendations, and resolves agronomic conflicts.
"""

from typing import Any, Dict, List, Optional, Set, Tuple
from .utils import RuleTracer


def compute_evidence_strength(candidate: Dict[str, Any]) -> str:
    """
    Determine evidence strength (HIGH, MEDIUM, LOW) based on source type and trigger evidence.
    """
    evidence = candidate.get("evidence", [])
    # Empirical dataset triggers (out-of-distribution, extrapolation, missing data) are direct dataset evidence
    has_dataset_evidence = any(
        e.get("type") in (
            "out_of_distribution_trigger",
            "extrapolation_warning_trigger",
            "data_quality_warnings_trigger",
        )
        for e in evidence
    )
    if has_dataset_evidence:
        return "HIGH"

    source_type = candidate.get("source_type", "prototype_heuristic")
    has_model_evidence = any(
        e.get("type") in ("negative_model_contribution", "positive_model_contribution")
        for e in evidence
    )

    if source_type == "sourced" and len(evidence) >= 1:
        return "HIGH"
    elif has_model_evidence or source_type == "sourced":
        return "MEDIUM"
    return "LOW"


def compute_recommendation_confidence(
    candidate: Dict[str, Any],
    intelligence_payload: Dict[str, Any],
) -> str:
    """
    Compute recommendation confidence (HIGH, MEDIUM, LOW).
    Penalized if model uncertainty is HIGH or input is out-of-distribution.
    """
    ev_strength = candidate.get("evidence_strength", "MEDIUM")
    uncertainty_level = intelligence_payload.get("uncertainty", {}).get("classification", "LOW")
    is_ood = intelligence_payload.get("data_quality", {}).get("out_of_distribution", False)

    if is_ood or uncertainty_level == "HIGH":
        # Cannot be HIGH confidence when input is extrapolating or trees disagree widely
        if ev_strength == "HIGH":
            return "MEDIUM"
        return "LOW"

    return ev_strength


def compute_priority_score(
    candidate: Dict[str, Any],
    intelligence_payload: Dict[str, Any],
) -> Tuple[int, str]:
    """
    Compute transparent priority score from 0 to 100:
    - Trigger strength (35%)
    - Evidence strength (25%)
    - Actionability (20%)
    - Risk relevance (20%)

    Returns:
    - (score: int 0-100, level: 'HIGH' | 'MEDIUM' | 'LOW')
    """
    # 1. Trigger strength (0.0 to 1.0)
    # If base priority in rule is HIGH -> 1.0, MEDIUM -> 0.65, LOW -> 0.35
    base_prio = candidate.get("priority", "MEDIUM")
    trigger_factor = 1.0 if base_prio == "HIGH" else (0.65 if base_prio == "MEDIUM" else 0.35)

    # 2. Evidence strength (0.0 to 1.0)
    ev_strength = candidate.get("evidence_strength", "MEDIUM")
    evidence_factor = 1.0 if ev_strength == "HIGH" else (0.65 if ev_strength == "MEDIUM" else 0.35)

    # 3. Actionability (0.0 to 1.0)
    cat = candidate.get("category", "GENERAL")
    act_type = candidate.get("actionability", "INFORMATIONAL")
    if cat == "DATA_QUALITY":
        action_factor = 1.0 if base_prio == "HIGH" else 0.75
    elif act_type == "ACTIONABLE":
        action_factor = 1.0
    elif act_type == "MONITOR":
        action_factor = 0.70
    else:  # INFORMATIONAL
        action_factor = 0.45

    # 4. Risk relevance (0.0 to 1.0)
    risk_score = intelligence_payload.get("risk", {}).get("score", 50)
    risk_factor = min(max(float(risk_score) / 100.0, 0.0), 1.0)
    if cat == "DATA_QUALITY" and base_prio == "HIGH":
        # Data quality alerts maintain high importance even if agricultural yield risk is currently low
        effective_risk = max(risk_factor, 0.80)
    else:
        effective_risk = risk_factor

    # Weighted linear combination
    raw_score = (
        0.35 * trigger_factor
        + 0.25 * evidence_factor
        + 0.20 * action_factor
        + 0.20 * effective_risk
    ) * 100.0

    score = int(round(raw_score))
    score = max(0, min(100, score))

    if score >= 70:
        level = "HIGH"
    elif score >= 40:
        level = "MEDIUM"
    else:
        level = "LOW"

    return score, level


def resolve_conflicts(
    candidates: List[Dict[str, Any]],
    tracer: Optional[RuleTracer] = None,
) -> List[Dict[str, Any]]:
    """
    Detect contradictory actions and resolve using the precedence hierarchy:
    Specific Crop Rule > Specific Environmental Condition > General Heuristic.
    """
    resolved: List[Dict[str, Any]] = []
    has_water_deficit = any(
        c.get("id") in ("water_001", "water_003", "crop_rice_001", "crop_maize_001")
        for c in candidates
    )
    has_water_surplus = any(c.get("id") == "water_002" for c in candidates)

    # Conflict: Water deficit vs Avoid over-irrigation
    if has_water_deficit and has_water_surplus:
        if tracer:
            tracer.record(
                "water_002",
                "CONFLICT_RESOLVED",
                "Suppressed 'avoid over-irrigation' due to active moisture deficit triggers",
                "WATER",
            )
        # Suppress water_002 in favor of active deficit alerts
        candidates = [c for c in candidates if c.get("id") != "water_002"]

    return candidates


def deduplicate_recommendations(
    candidates: List[Dict[str, Any]],
    tracer: Optional[RuleTracer] = None,
) -> List[Dict[str, Any]]:
    """
    Merge overlapping recommendations targeting the same functional action/category.
    For example, multiple water moisture deficit rules are consolidated into one
    coherent recommendation with combined evidence and highest priority.
    """
    # Group by category and functional topic
    merged_map: Dict[str, Dict[str, Any]] = {}

    for c in candidates:
        cat = c.get("category", "GENERAL")
        rule_id = c.get("id", "")

        # Key determination for deduplication
        if cat == "WATER" and ("moisture" in rule_id or "water" in rule_id):
            dedup_key = "WATER_MOISTURE_MANAGEMENT"
        elif cat == "CROP" and "Rice" in str(c.get("crop")):
            dedup_key = "CROP_RICE_WATER"
        elif cat == "VEGETATION" and "NDVI" in str(c.get("trigger_spec")):
            dedup_key = "VEG_NDVI_MONITORING"
        elif cat == "RISK":
            dedup_key = "RISK_ALERT"
        elif cat == "DATA_QUALITY":
            dedup_key = "DATA_QUALITY_ALERT"
        else:
            dedup_key = rule_id

        if dedup_key not in merged_map:
            merged_map[dedup_key] = c.copy()
        else:
            existing = merged_map[dedup_key]
            # Merge evidence
            existing_ev = existing.get("evidence", [])
            new_ev = c.get("evidence", [])
            # Deduplicate evidence dicts by json string
            combined_ev = existing_ev + [e for e in new_ev if e not in existing_ev]
            existing["evidence"] = combined_ev

            # Keep highest priority score
            if c.get("priority_score", 0) > existing.get("priority_score", 0):
                existing["priority_score"] = c.get("priority_score", 0)
                existing["priority"] = c.get("priority")
                existing["title"] = c.get("title")
                existing["action"] = c.get("action")
                existing["reason"] = c.get("reason")

            # Merge limitations
            combined_lims = list(dict.fromkeys(existing.get("limitations", []) + c.get("limitations", [])))
            existing["limitations"] = combined_lims

            # Set what-if flag if either supports it
            existing["what_if_supported"] = existing.get("what_if_supported", False) or c.get("what_if_supported", False)

            if tracer:
                tracer.record(
                    c.get("id", ""),
                    "MERGED",
                    f"Merged into consolidated recommendation '{dedup_key}'",
                    cat,
                )

    return list(merged_map.values())


def prioritize_and_rank_recommendations(
    candidates: List[Dict[str, Any]],
    intelligence_payload: Dict[str, Any],
    top_n: int = 5,
    tracer: Optional[RuleTracer] = None,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Score, deduplicate, resolve conflicts, and rank recommendations.

    Returns:
    - (displayed_recommendations: List[Dict[str, Any]], all_candidates: List[Dict[str, Any]])
    """
    # 1. Compute evidence strength, confidence, and initial priority scores
    for c in candidates:
        c["evidence_strength"] = compute_evidence_strength(c)
        c["confidence"] = compute_recommendation_confidence(c, intelligence_payload)
        score, level = compute_priority_score(c, intelligence_payload)
        c["priority_score"] = score
        c["priority"] = level

    # 2. Resolve contradictory recommendations
    resolved_candidates = resolve_conflicts(candidates, tracer=tracer)

    # 3. Deduplicate overlapping actions
    deduped_candidates = deduplicate_recommendations(resolved_candidates, tracer=tracer)

    # 4. Sorting hierarchy:
    # Priority score DESC -> Actionability (ACTIONABLE > MONITOR > INFORMATIONAL) -> Confidence DESC
    actionability_order = {"ACTIONABLE": 0, "MONITOR": 1, "INFORMATIONAL": 2}
    confidence_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}

    def sort_key(item: Dict[str, Any]):
        return (
            -item.get("priority_score", 0),
            actionability_order.get(item.get("actionability", "INFORMATIONAL"), 3),
            confidence_order.get(item.get("confidence", "LOW"), 3),
        )

    deduped_candidates.sort(key=sort_key)

    # Return top_n for primary display (between 3 and 5 items ideally), plus full candidates
    displayed = deduped_candidates[:top_n]

    return displayed, deduped_candidates

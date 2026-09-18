"""
CropIQ Phase 4 - Recommendation Formatter
Generates deterministic natural language presentations for farmers and technical audiences,
plus cohesive executive summaries connecting prediction, risk, and action.
"""

from typing import Any, Dict, List, Optional


def format_recommendation_farmer_mode(rec: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format recommendation for farmer-facing display:
    Clean, non-technical, emphasizing actionable field checks.
    """
    evidence_bullets = []
    for ev in rec.get("evidence", []):
        ev_type = ev.get("type")
        feat = ev.get("feature", "")
        if ev_type == "negative_model_contribution":
            evidence_bullets.append(f"{feat.replace('_', ' ').title()} pulled down the model's yield estimate.")
        elif ev_type == "positive_model_contribution":
            evidence_bullets.append(f"{feat.replace('_', ' ').title()} supported a higher yield estimate.")
        elif ev_type == "feature_threshold":
            comp = "below" if ev.get("comparison") in ("<", "<=") else "above"
            evidence_bullets.append(f"{feat.replace('_', ' ').title()} was {comp} benchmark level ({ev.get('observed')}).")
        elif ev_type == "risk_level_trigger":
            evidence_bullets.append(f"Overall crop yield risk is assessed as {ev.get('current_risk_level')}.")
        elif ev_type == "uncertainty_trigger":
            evidence_bullets.append(f"Model prediction uncertainty is currently {ev.get('current_uncertainty')}.")
        elif ev_type == "yield_relative_to_reference":
            pos = ev.get("position", "").replace("_", " ")
            evidence_bullets.append(f"Yield estimate is {pos} for historical crop observations.")
        elif ev_type == "out_of_distribution_trigger":
            evidence_bullets.append("One or more field readings are unusual compared to past seasons.")

    if not evidence_bullets:
        evidence_bullets.append("Identified by rule logic matching field observations.")

    return {
        "id": rec.get("id"),
        "title": rec.get("title"),
        "category": rec.get("category"),
        "priority": rec.get("priority"),
        "actionability": rec.get("actionability"),
        "summary": rec.get("reason"),
        "reason": rec.get("reason"),
        "action": rec.get("action"),
        "evidence": evidence_bullets,
        "confidence": rec.get("confidence"),
        "limitations": rec.get("limitations", []),
        "what_if_supported": rec.get("what_if_supported", False),
    }


def format_recommendation_technical_mode(rec: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format recommendation for technical / agronomic audit mode:
    Includes rule IDs, version, exact numerical contributions, and priority scores.
    """
    farmer_view = format_recommendation_farmer_mode(rec)
    technical_view = farmer_view.copy()
    technical_view.update({
        "version": rec.get("version"),
        "priority_score": rec.get("priority_score"),
        "evidence_strength": rec.get("evidence_strength"),
        "source_type": rec.get("source_type"),
        "source": rec.get("source"),
        "raw_evidence": rec.get("evidence", []),
        "trigger_specification": rec.get("trigger_spec", {}),
    })
    return technical_view


def generate_executive_summary(
    recommendations: List[Dict[str, Any]],
    intelligence_payload: Dict[str, Any],
) -> str:
    """
    Synthesizes a deterministic 2-3 sentence executive summary connecting
    predicted yield, risk level, uncertainty, and top actions.
    """
    pred = intelligence_payload.get("prediction", {})
    crop = intelligence_payload.get("context", {}).get("crop", "the crop")
    est_yield = pred.get("yield", 0.0)
    unit = pred.get("unit", "unconfirmed")

    risk_level = intelligence_payload.get("risk", {}).get("level", "LOW")
    unc_level = intelligence_payload.get("uncertainty", {}).get("classification", "LOW")
    risk_word = {"LOW": "low", "MODERATE": "moderate", "HIGH": "high"}.get(risk_level, risk_level.lower())

    # Sentence 1: Prediction & Risk posture
    unit_suffix = f" {unit}" if unit and unit != "unconfirmed" else ""
    s1 = f"Your estimated {crop} yield is {est_yield:.2f}{unit_suffix}, with {risk_word} risk."

    # Sentence 2: Key influence & top recommendation
    if recommendations:
        top_rec = recommendations[0]
        top_action = top_rec.get("action", top_rec.get("title"))
        s2 = f"The top thing to do is {top_action[:1].lower() + top_action[1:]}"
        if not s2.endswith("."):
            s2 += "."
    else:
        s2 = "Your field conditions look typical for now; keep up your usual seasonal checks."

    # Sentence 3: Uncertainty / verification guidance
    if unc_level == "HIGH":
        s3 = "This estimate is less certain than usual, so check field conditions yourself before any major decisions."
    elif unc_level == "MODERATE":
        s3 = "This estimate has some uncertainty, so it's worth confirming with a field check."
    else:
        s3 = "This estimate is well supported by consistent conditions."

    return f"{s1} {s2} {s3}"

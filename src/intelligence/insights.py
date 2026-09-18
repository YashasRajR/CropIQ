"""
CropIQ Phase 3 - Natural Language Insights Engine
Generates transparent, deterministic, multi-layered explanations from structured
model outputs using verified domain templates (no LLM, zero hallucinations).
"""

from typing import Any, Dict, List, Optional
from ..ml.utils import TARGET_UNIT


def generate_agricultural_insights(
    prediction: Dict[str, Any],
    explanation: Dict[str, Any],
    context: Dict[str, Any],
    risk: Dict[str, Any],
    uncertainty: Dict[str, Any],
    data_quality: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generate deterministic 3-layered natural language insights adhering
    strictly to non-causal agricultural phrasing.

    Layer 1: Executive 1-line summary.
    Layer 2: Key factors (positive & negative factor highlights).
    Layer 3: Comprehensive detailed analytical narrative.
    """
    yield_val = prediction.get("yield", 0.0)
    unit = prediction.get("unit", TARGET_UNIT)
    crop = context.get("crop", "the crop")
    rel_pos = context.get("relative_position", "relative to historical baseline")
    ref_median = context.get("reference_median", 0.0)
    risk_level = risk.get("risk_level", "MODERATE")
    risk_score = risk.get("risk_score", 50)
    unc_class = uncertainty.get("classification", "MODERATE")

    top_pos = explanation.get("top_positive_factors", [])
    top_neg = explanation.get("top_negative_factors", [])

    # -------------------------------------------------------------
    # Layer 1: Executive One-Line Summary
    # -------------------------------------------------------------
    layer_1 = (
        f"Estimated {crop} yield is {yield_val:.2f} {unit} ({risk_level} Risk, score {risk_score}/100), "
        f"{rel_pos}."
    )

    # -------------------------------------------------------------
    # Layer 2: Key Contributing Factors
    # -------------------------------------------------------------
    pos_bullets = []
    for item in top_pos:
        pos_bullets.append(
            f"{item['display_name']} (Observed: {item['observed_value']}) contributed positively "
            f"({item['contribution']:+.2f} {unit}) to the prediction based on learned patterns."
        )

    neg_bullets = []
    for item in top_neg:
        neg_bullets.append(
            f"{item['display_name']} (Observed: {item['observed_value']}) contributed negatively "
            f"({item['contribution']:+.2f} {unit}) to the prediction based on learned patterns."
        )

    layer_2 = {
        "positive_factors": pos_bullets or ["No strong positive factor identified above baseline."],
        "negative_factors": neg_bullets or ["No major negative factor pulling the prediction downward."],
    }

    # -------------------------------------------------------------
    # Layer 3: Comprehensive Detailed Narrative
    # -------------------------------------------------------------
    paragraphs = []

    # Paragraph 1: Model Prediction & Historical Context
    p1 = (
        f"The CropIQ prediction pipeline estimated a yield of {yield_val:.2f} {unit} for {crop}. "
        f"In historical data, the benchmark reference median for {crop} is {ref_median:.2f} {unit}. "
        f"The current prediction places this field {rel_pos}."
    )
    paragraphs.append(p1)

    # Paragraph 2: Core Predictive Influences
    influences = []
    if top_pos:
        influences.append(f"{top_pos[0]['display_name']} as the primary upward-adjusting factor ({top_pos[0]['contribution']:+.2f})")
    if top_neg:
        influences.append(f"{top_neg[0]['display_name']} as the primary downward-adjusting factor ({top_neg[0]['contribution']:+.2f})")

    if influences:
        p2 = (
            f"Model explanation identified {' and '.join(influences)}. "
            f"These factor contributions reflect learned empirical associations in historical training data "
            f"and represent predictive adjustments relative to the model baseline, rather than deterministic causal guarantees."
        )
    else:
        p2 = "Observed conditions align closely with baseline expectations without extreme feature contributions."
    paragraphs.append(p2)

    # Paragraph 3: Risk & Prediction Uncertainty
    unc_spread = uncertainty.get("relative_uncertainty", 0.15) * 100
    p3 = (
        f"Yield Risk Level is evaluated as {risk_level} (risk score {risk_score}/100). "
        f"Prediction uncertainty across the 300-tree ensemble is {unc_class} "
        f"(model-derived uncertainty range: [{uncertainty.get('lower', 0.0):.2f}, {uncertainty.get('upper', 0.0):.2f}] {unit}, "
        f"approx. {unc_spread:.1f}% spread). "
    )
    if data_quality.get("warnings"):
        p3 += " Note: " + " ".join(data_quality["warnings"])
    paragraphs.append(p3)

    layer_3 = "\n\n".join(paragraphs)

    return {
        "layer_1_summary": layer_1,
        "layer_2_key_factors": layer_2,
        "layer_3_detailed_explanation": layer_3,
    }

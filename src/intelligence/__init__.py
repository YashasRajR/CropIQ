"""
CropIQ Phase 3 - Intelligence Layer Package
Exposes core prediction, explainability, uncertainty, risk indicator,
and natural language insights functions.
"""

from typing import Any, Dict, List, Optional, Union
import pandas as pd

from ..ml.predict import load_prediction_model, validate_input_features
from ..ml.utils import PREDICTIVE_FEATURES, TARGET_UNIT
from .confidence import estimate_prediction_uncertainty
from .explain import (
    explain_prediction,
    extract_and_save_global_feature_importance,
)
from .insights import generate_agricultural_insights
from .risk import compute_yield_risk
from .utils import (
    FEATURE_METADATA,
    detect_out_of_distribution,
    get_feature_display_name,
    load_crop_reference_distributions,
    load_training_feature_bounds,
)
from .validation import IntelligenceValidationError, validate_intelligence_output

__all__ = [
    "analyze_crop_prediction",
    "explain_prediction",
    "estimate_prediction_uncertainty",
    "compute_yield_risk",
    "generate_agricultural_insights",
    "detect_out_of_distribution",
    "validate_intelligence_output",
    "extract_and_save_global_feature_importance",
    "FEATURE_METADATA",
    "get_feature_display_name",
    "load_crop_reference_distributions",
    "load_training_feature_bounds",
]


def analyze_crop_prediction(
    input_data: Union[Dict[str, Any], pd.DataFrame],
    pipeline=None,
    force_fallback: bool = False,
    validate_output: bool = True,
) -> Dict[str, Any]:
    """
    Main reusable intelligence entry point for CropIQ Phase 3.

    Transforms farm conditions into complete structured intelligence:
    - ML Prediction
    - Historical Yield Reference Context
    - Local Feature Contributions (SHAP or Fallback)
    - Ensemble Prediction Uncertainty
    - Crop Yield Risk Indicator (0-100 Score & Level)
    - Deterministic Multi-Layered Natural Language Insights
    - Data Quality & Out-of-Distribution Diagnostics

    Parameters:
    -----------
    input_data: dict or DataFrame with predictive features.
    pipeline: optional pre-loaded model pipeline.
    force_fallback: if True, skips SHAP and uses feature ablation fallback.
    validate_output: if True, validates mathematical identity and schema.

    Returns:
    --------
    dict adhering to the Phase 4 Contract Schema.
    """
    df = pd.DataFrame([input_data]) if isinstance(input_data, dict) else input_data.copy()

    # 1. Input Validation & Out-of-Distribution Checks
    input_warnings = validate_input_features(df)
    ood_warnings, is_ood, extrapolation_warning = detect_out_of_distribution(df)
    all_warnings = input_warnings + ood_warnings

    pipe = pipeline or load_prediction_model()
    crop_type = str(df["crop_type"].values[0])

    # 2. Local Explanation & Point Prediction
    explanation_res = explain_prediction(df, pipeline=pipe, force_fallback=force_fallback)
    predicted_yield = explanation_res["predicted_yield"]

    # 3. Model Uncertainty (Tree Dispersion)
    uncertainty_res = estimate_prediction_uncertainty(df, pipeline=pipe)

    # 4. Crop Yield Risk Assessment
    risk_res = compute_yield_risk(
        predicted_yield=predicted_yield,
        crop_type=crop_type,
        explanation_result=explanation_res,
        uncertainty_result=uncertainty_res,
        quality_warnings=all_warnings,
        is_out_of_distribution=is_ood,
        extrapolation_warning=extrapolation_warning,
    )

    # 5. Prediction Context
    yield_context = risk_res["yield_context"]

    # 6. Prediction Payload
    prediction_payload = {
        "yield": predicted_yield,
        "unit": TARGET_UNIT,
    }

    # 7. Data Quality Payload
    data_quality_payload = {
        "warnings": all_warnings,
        "out_of_distribution": is_ood,
        "extrapolation_warning": extrapolation_warning,
    }

    # 8. Natural Language Insights Generation (3 Layers)
    insights_payload = generate_agricultural_insights(
        prediction=prediction_payload,
        explanation=explanation_res,
        context=yield_context,
        risk=risk_res,
        uncertainty=uncertainty_res,
        data_quality=data_quality_payload,
    )

    # 9. Assembled Response
    result = {
        "prediction": prediction_payload,
        "context": yield_context,
        "explanation": {
            "baseline": explanation_res["baseline_yield"],
            "method": explanation_res["method"],
            "top_positive_factors": explanation_res["top_positive_factors"],
            "top_negative_factors": explanation_res["top_negative_factors"],
            "top_overall_factors": explanation_res["top_overall_factors"],
            "all_contributions": explanation_res["all_contributions"],
            "explanation_identity_verified": explanation_res["explanation_identity_verified"],
            "identity_discrepancy": explanation_res["identity_discrepancy"],
        },
        "uncertainty": uncertainty_res,
        "risk": {
            "level": risk_res["risk_level"],
            "risk_level": risk_res["risk_level"],
            "score": risk_res["risk_score"],
            "risk_score": risk_res["risk_score"],
            "drivers": risk_res["risk_drivers"],
            "risk_drivers": risk_res["risk_drivers"],
            "protective_factors": risk_res["protective_factors"],
            "component_scores": risk_res["component_scores"],
        },
        "data_quality": data_quality_payload,
        "insights": insights_payload,
    }

    # 10. Output Validation
    if validate_output:
        is_valid, validation_issues = validate_intelligence_output(result)
        if not is_valid:
            raise IntelligenceValidationError(
                f"Intelligence output failed validation: {'; '.join(validation_issues)}"
            )

    return result

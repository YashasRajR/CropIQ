"""
CropIQ Explainability API Route
Exposes local feature attributions (TreeSHAP and feature ablation).
"""

from fastapi import APIRouter, Depends, Query
from ...dependencies.services import get_explanation_service
from ...schemas.farm import FarmInput
from ...schemas.explanation import ExplanationResponse
from ...services.explanation_service import ExplanationService

router = APIRouter(tags=["Explainability"])


@router.post(
    "/explain",
    response_model=ExplanationResponse,
    summary="Local Prediction Feature Contributions",
    description="Calculates local feature importance (SHAP values) explaining how features influenced the prediction from baseline.",
)
async def explain_farm_prediction(
    farm_input: FarmInput,
    force_fallback: bool = Query(
        default=False,
        description="If True, bypasses TreeSHAP and uses deterministic feature ablation fallback",
    ),
    explanation_service: ExplanationService = Depends(get_explanation_service),
) -> ExplanationResponse:
    """Generate local feature attributions for farm conditions."""
    explanation = explanation_service.explain(
        farm_input=farm_input,
        force_fallback=force_fallback,
    )
    return ExplanationResponse(**explanation)

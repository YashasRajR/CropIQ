"""
CropIQ Prediction API Route
Primary endpoint serving unified yield predictions, explainability, risk, and recommendations.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query
from ...dependencies.services import get_pipeline_service
from ...schemas.farm import FarmInput
from ...schemas.prediction import PredictionResponse
from ...services.pipeline_service import PipelineService

router = APIRouter(tags=["Prediction"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Unified Crop Yield Prediction Pipeline",
    description=(
        "Executes the full CropIQ intelligence pipeline: Farm Input -> ML Prediction -> "
        "Explainability -> Risk Assessment -> Uncertainty -> Prioritized Recommendations."
    ),
)
async def predict_yield(
    farm_input: FarmInput,
    mode: str = Query(
        default="farmer",
        pattern="^(farmer|technical)$",
        description="Recommendation formatting mode: 'farmer' (plain language) or 'technical' (auditable rule scores)",
    ),
    top_n: int = Query(
        default=5,
        ge=1,
        le=20,
        description="Maximum number of prioritized recommendations to return",
    ),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
) -> PredictionResponse:
    """Execute unified inference and intelligence pipeline."""
    result = pipeline_service.run_full_pipeline(
        farm_input=farm_input,
        mode=mode,
        top_n=top_n,
    )
    return PredictionResponse(**result)

"""
CropIQ Risk Assessment API Route
Exposes standalone 4-component crop yield risk indicator.
"""

from fastapi import APIRouter, Depends
from ...dependencies.services import get_pipeline_service
from ...schemas.farm import FarmInput
from ...schemas.prediction import RiskPayload
from ...services.pipeline_service import PipelineService

router = APIRouter(tags=["Risk Assessment"])


@router.post(
    "/risk",
    response_model=RiskPayload,
    summary="Crop Yield Risk Assessment",
    description="Evaluates composite agricultural risk score (0-100) and risk tier (LOW, MODERATE, HIGH) based on multi-factor analysis.",
)
async def assess_yield_risk(
    farm_input: FarmInput,
    pipeline_service: PipelineService = Depends(get_pipeline_service),
) -> RiskPayload:
    """Assess crop yield risk for farm observation."""
    full_result = pipeline_service.run_full_pipeline(farm_input=farm_input)
    return RiskPayload(**full_result["risk"])

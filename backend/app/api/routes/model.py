"""
CropIQ Model Metadata Routes
Exposes safe model metrics, feature catalogs, and scenario configuration metadata.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends
from ...dependencies.services import get_model_service
from ...schemas.common import ModelInfoResponse
from ...services.model_service import ModelService

router = APIRouter(tags=["Model Information"])


@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    summary="Model Information and Metrics",
    description="Returns public metadata, training metrics, target unit, and candidate model evaluation.",
)
async def get_model_information(
    model_service: ModelService = Depends(get_model_service),
) -> ModelInfoResponse:
    """Return model specifications, feature lists, and validation metrics."""
    info = model_service.get_model_info()
    return ModelInfoResponse(**info)


@router.get(
    "/metadata/scenario-features",
    summary="Scenario Feature Metadata Catalog",
    description="Returns scenario slider ranges, controllability classifications, and training quantiles for UI controls.",
)
async def get_scenario_feature_metadata(
    model_service: ModelService = Depends(get_model_service),
) -> Dict[str, Any]:
    """Return scenario feature definitions for frontend sliders and validation."""
    return model_service.get_scenario_metadata()

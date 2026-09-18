"""
CropIQ Health Check Route
Provides lightweight system and model readiness status.
"""

from fastapi import APIRouter, Depends
from ...core.config import get_settings
from ...dependencies.services import get_model_service
from ...schemas.common import HealthResponse
from ...services.model_service import ModelService

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="API Health Check",
    description="Returns service status and ML model readiness without executing inference.",
)
async def check_health(
    model_service: ModelService = Depends(get_model_service),
) -> HealthResponse:
    """Lightweight operational health probe."""
    settings = get_settings()
    is_ready = model_service.is_loaded
    status_str = "ok" if is_ready else "degraded"
    version = model_service.get_metadata().get("model_version", settings.APP_VERSION)

    return HealthResponse(
        status=status_str,
        service=settings.APP_NAME,
        model_loaded=is_ready,
        model_version=version,
        environment=settings.ENVIRONMENT,
    )

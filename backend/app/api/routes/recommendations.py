"""
CropIQ Recommendations API Route
Exposes prioritized agricultural recommendations based on Phase 4 rule evaluation.
"""

from fastapi import APIRouter, Depends, Query
from ...dependencies.services import get_recommendation_service
from ...schemas.farm import FarmInput
from ...schemas.recommendation import RecommendationResponse
from ...services.recommendation_service import RecommendationService

router = APIRouter(tags=["Recommendations"])


@router.post(
    "/recommendations",
    response_model=RecommendationResponse,
    summary="Actionable Agricultural Recommendations",
    description="Evaluates agronomic rules against farm observations and model risk to generate prioritized, non-causal guidance.",
)
async def get_farm_recommendations(
    farm_input: FarmInput,
    mode: str = Query(
        default="farmer",
        pattern="^(farmer|technical)$",
        description="Output language mode: 'farmer' (farmer-friendly phrasing) or 'technical' (auditable rule conditions and scores)",
    ),
    top_n: int = Query(
        default=5,
        ge=1,
        le=20,
        description="Maximum number of recommendations to return",
    ),
    rec_service: RecommendationService = Depends(get_recommendation_service),
) -> RecommendationResponse:
    """Generate prioritized agricultural recommendations."""
    recs = rec_service.recommend(
        farm_input=farm_input,
        mode=mode,
        top_n=top_n,
    )
    return RecommendationResponse(**recs)

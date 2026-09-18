"""
CropIQ Recommendation Service
Connects predictions, explainability, and risk intelligence to Phase 4 recommendation engine.
"""

from typing import Any, Dict, Optional, Union
import pandas as pd

from .model_service import ModelService, get_model_service
from ..core.exceptions import InvalidFarmInputException, CropIQException
from ..core.logging import get_logger
from ..schemas.farm import FarmInput
from ..utils.serialization import sanitize_for_json
from src.intelligence import analyze_crop_prediction
from src.recommendations import generate_recommendations

logger = get_logger("cropiq.recommendation_service")


class RecommendationService:
    """Service for generating prioritized, non-causal agricultural recommendations."""

    def __init__(self, model_service: ModelService):
        self.model_service = model_service

    def recommend(
        self,
        farm_input: Union[FarmInput, Dict[str, Any]],
        mode: str = "farmer",
        top_n: int = 5,
        intelligence_payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate structured agronomic recommendations."""
        if isinstance(farm_input, FarmInput):
            features_dict = farm_input.to_feature_dict()
        elif isinstance(farm_input, dict):
            from ..utils.validation import prepare_feature_vector
            features_dict = prepare_feature_vector(farm_input)
        else:
            raise InvalidFarmInputException(f"Unsupported input type: {type(farm_input)}")

        pipeline = self.model_service.get_pipeline()

        # Generate Phase 3 intelligence payload if not supplied
        if intelligence_payload is None:
            try:
                intelligence_payload = analyze_crop_prediction(
                    features_dict,
                    pipeline=pipeline,
                    validate_output=False,
                )
            except Exception as e:
                logger.exception(f"Intelligence calculation for recommendations failed: {e}")
                raise CropIQException(
                    message=f"Failed to generate intelligence context: {str(e)}",
                    code="RECOMMENDATION_ERROR",
                    status_code=500,
                )

        try:
            rec_result = generate_recommendations(
                input_data=features_dict,
                intelligence_payload=intelligence_payload,
                mode=mode,
                top_n=top_n,
                validate_output=True,
            )
        except Exception as e:
            logger.exception(f"Recommendation generation failed: {e}")
            raise CropIQException(
                message=f"Recommendation engine failed: {str(e)}",
                code="RECOMMENDATION_ERROR",
                status_code=500,
            )

        return sanitize_for_json(rec_result)


def get_recommendation_service() -> RecommendationService:
    return RecommendationService(get_model_service())

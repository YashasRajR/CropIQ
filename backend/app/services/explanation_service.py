"""
CropIQ Explanation Service
Orchestrates Phase 3 local explainability using TreeSHAP and feature ablation.
Preserves strict non-causal framing and returns standardized attribution schemas.
"""

from typing import Any, Dict, Union
import pandas as pd

from .model_service import ModelService, get_model_service
from ..core.exceptions import InvalidFarmInputException, CropIQException
from ..core.logging import get_logger
from ..schemas.farm import FarmInput
from ..utils.serialization import sanitize_for_json
from src.intelligence.explain import explain_prediction

logger = get_logger("cropiq.explanation_service")


class ExplanationService:
    """Service for generating local feature attributions."""

    def __init__(self, model_service: ModelService):
        self.model_service = model_service

    def explain(
        self,
        farm_input: Union[FarmInput, Dict[str, Any]],
        force_fallback: bool = False,
    ) -> Dict[str, Any]:
        """Generate feature contributions for farm observation."""
        if isinstance(farm_input, FarmInput):
            features_dict = farm_input.to_feature_dict()
        elif isinstance(farm_input, dict):
            from ..utils.validation import prepare_feature_vector
            features_dict = prepare_feature_vector(farm_input)
        else:
            raise InvalidFarmInputException(f"Unsupported input type: {type(farm_input)}")

        df = pd.DataFrame([features_dict])
        pipeline = self.model_service.get_pipeline()

        try:
            explanation = explain_prediction(
                df,
                pipeline=pipeline,
                force_fallback=force_fallback,
            )
        except Exception as e:
            logger.exception(f"Explainability execution failed: {e}")
            raise CropIQException(
                message=f"Explainability calculation failed: {str(e)}",
                code="EXPLANATION_ERROR",
                status_code=500,
            )

        explanation["non_causal_statement"] = (
            "Feature contributions describe mathematical model importance under the trained "
            "regressor and do not imply real-world causal mechanisms."
        )

        return sanitize_for_json(explanation)


def get_explanation_service() -> ExplanationService:
    return ExplanationService(get_model_service())

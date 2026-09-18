"""
CropIQ Unified Pipeline Service
Orchestrates end-to-end intelligence: Prediction -> Explanation -> Risk -> Recommendations.
Zero HTTP self-calls; pure internal service invocation.
"""

from typing import Any, Dict, Union

from .model_service import ModelService, get_model_service
from ..core.exceptions import InvalidFarmInputException, CropIQException
from ..core.logging import get_logger
from ..schemas.farm import FarmInput
from ..utils.serialization import sanitize_for_json
from src.intelligence import analyze_crop_prediction
from src.recommendations import generate_recommendations

logger = get_logger("cropiq.pipeline_service")


class PipelineService:
    """Orchestrates unified end-to-end CropIQ prediction intelligence."""

    def __init__(self, model_service: ModelService):
        self.model_service = model_service

    def run_full_pipeline(
        self,
        farm_input: Union[FarmInput, Dict[str, Any]],
        mode: str = "farmer",
        top_n: int = 5,
    ) -> Dict[str, Any]:
        """
        Execute the complete CropIQ intelligence pipeline:
        FarmInput -> Prediction -> Explainability -> Risk -> Uncertainty -> Recommendations.
        """
        if isinstance(farm_input, FarmInput):
            features_dict = farm_input.to_feature_dict()
        elif isinstance(farm_input, dict):
            from ..utils.validation import prepare_feature_vector
            features_dict = prepare_feature_vector(farm_input)
        else:
            raise InvalidFarmInputException(f"Unsupported input type: {type(farm_input)}")

        pipeline = self.model_service.get_pipeline()
        metadata = self.model_service.get_metadata()

        # 1. Run Phase 3 Core Intelligence
        try:
            intelligence = analyze_crop_prediction(
                features_dict,
                pipeline=pipeline,
                validate_output=False,
            )
        except Exception as e:
            logger.exception(f"Intelligence pipeline analysis failed: {e}")
            raise CropIQException(
                message=f"Prediction and intelligence analysis failed: {str(e)}",
                code="PREDICTION_PIPELINE_FAILED",
                status_code=500,
            )

        # 2. Run Phase 4 Recommendations Engine
        try:
            rec_result = generate_recommendations(
                input_data=features_dict,
                intelligence_payload=intelligence,
                mode=mode,
                top_n=top_n,
                validate_output=False,
            )
            recommendations_list = rec_result.get("recommendations", [])
        except Exception as e:
            logger.warning(f"Recommendation generation encountered non-fatal error: {e}")
            recommendations_list = []

        # 3. Assemble Unified Response
        response = {
            "prediction": intelligence["prediction"],
            "context": intelligence.get("context"),
            "risk": intelligence["risk"],
            "uncertainty": intelligence["uncertainty"],
            "explanation": intelligence["explanation"],
            "recommendations": recommendations_list,
            "data_quality": intelligence.get("data_quality", {}),
            "insights": intelligence.get("insights", {}),
            "metadata": {
                "project": metadata.get("project", "CropIQ"),
                "model_name": metadata.get("model", "Random Forest"),
                "model_version": metadata.get("model_version", "1.0.0"),
                "target": metadata.get("target", "yield"),
                "target_unit": metadata.get("target_unit", "unconfirmed"),
            },
        }

        return sanitize_for_json(response)


def get_pipeline_service() -> PipelineService:
    return PipelineService(get_model_service())

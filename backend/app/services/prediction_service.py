"""
CropIQ Prediction Service
Manages validated ML inference using the singleton ModelService.
"""

from typing import Any, Dict, Union
import pandas as pd

from .model_service import ModelService, get_model_service
from ..core.exceptions import InvalidFarmInputException, CropIQException
from ..core.logging import get_logger
from ..schemas.farm import FarmInput
from ..utils.serialization import sanitize_for_json
from src.ml.predict import validate_input_features
from src.ml.utils import PREDICTIVE_FEATURES, TARGET_UNIT

logger = get_logger("cropiq.prediction_service")


class PredictionService:
    """Service for running machine learning yield predictions."""

    def __init__(self, model_service: ModelService):
        self.model_service = model_service

    def predict(self, farm_input: Union[FarmInput, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Execute deterministic yield prediction for farm observation.

        Parameters:
        -----------
        farm_input: FarmInput model or feature dictionary.

        Returns:
        --------
        dict: {"yield": float, "unit": "unconfirmed", "warnings": list}
        """
        if isinstance(farm_input, FarmInput):
            features_dict = farm_input.to_feature_dict()
        elif isinstance(farm_input, dict):
            from ..utils.validation import prepare_feature_vector
            features_dict = prepare_feature_vector(farm_input)
        else:
            raise InvalidFarmInputException(f"Unsupported input type: {type(farm_input)}")

        df = pd.DataFrame([features_dict])

        # Validate features using Phase 2 rules
        try:
            warnings_list = validate_input_features(df)
        except Exception as e:
            raise InvalidFarmInputException(str(e))

        # Retrieve loaded pipeline
        pipeline = self.model_service.get_pipeline()

        try:
            X = df[PREDICTIVE_FEATURES]
            raw_prediction = pipeline.predict(X)[0]
            pred_float = float(raw_prediction)
        except Exception as e:
            logger.exception(f"Inference execution failed: {e}")
            raise CropIQException(
                message=f"Model prediction failed: {str(e)}",
                code="MODEL_PREDICTION_FAILED",
                status_code=500,
            )

        result = {
            "yield": round(pred_float, 4),
            "raw_yield": pred_float,
            "unit": TARGET_UNIT,
            "warnings": warnings_list,
        }
        return sanitize_for_json(result)


def get_prediction_service() -> PredictionService:
    """Helper to obtain PredictionService."""
    return PredictionService(get_model_service())

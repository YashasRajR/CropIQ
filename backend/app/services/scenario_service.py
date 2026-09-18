"""
CropIQ Scenario Service
Orchestrates Phase 5 what-if simulation, presets generation, and 1D sensitivity curves.
Ensures immutability of baseline inputs, uses the singleton model, and maps validation errors.
"""

from typing import Any, Dict, Optional, Union
import copy

from .model_service import ModelService, get_model_service
from ..core.exceptions import (
    InvalidFarmInputException,
    UnsupportedScenarioException,
    CropIQException,
)
from ..core.logging import get_logger
from ..schemas.farm import FarmInput
from ..utils.serialization import sanitize_for_json
from src.simulator import (
    simulate_scenario,
    compute_feature_sensitivity,
    create_preset_scenario,
)
from src.simulator.validator import ScenarioValidationError

logger = get_logger("cropiq.scenario_service")


class ScenarioService:
    """Service for running what-if scenario simulations on the trained model."""

    def __init__(self, model_service: ModelService):
        self.model_service = model_service

    def simulate(
        self,
        current_input: Union[FarmInput, Dict[str, Any]],
        scenario_changes: Dict[str, float],
        scenario_name: Optional[str] = None,
        run_explanation: bool = True,
    ) -> Dict[str, Any]:
        """
        Execute what-if simulation against baseline observation.
        """
        if isinstance(current_input, FarmInput):
            baseline_dict = current_input.to_feature_dict()
        elif isinstance(current_input, dict):
            from ..utils.validation import prepare_feature_vector
            baseline_dict = prepare_feature_vector(current_input)
        else:
            raise InvalidFarmInputException(f"Unsupported input type: {type(current_input)}")

        # Ensure deep-copy immutability
        safe_baseline = copy.deepcopy(baseline_dict)
        safe_changes = copy.deepcopy(scenario_changes)

        pipeline = self.model_service.get_pipeline()

        try:
            result = simulate_scenario(
                current_input=safe_baseline,
                scenario_changes=safe_changes,
                scenario_name=scenario_name,
                pipeline=pipeline,
                run_explanation=run_explanation,
            )
        except ScenarioValidationError as sve:
            logger.warning(f"Scenario validation error: {sve}")
            raise UnsupportedScenarioException(message=str(sve))
        except Exception as e:
            logger.exception(f"Scenario simulation failed: {e}")
            raise CropIQException(
                message=f"Scenario simulation failed: {str(e)}",
                code="SCENARIO_ERROR",
                status_code=500,
            )

        return sanitize_for_json(result)

    def sensitivity(
        self,
        current_input: Union[FarmInput, Dict[str, Any]],
        feature_name: str,
        num_points: int = 10,
    ) -> Dict[str, Any]:
        """Compute 1D feature sensitivity curve holding other features constant."""
        if isinstance(current_input, FarmInput):
            baseline_dict = current_input.to_feature_dict()
        elif isinstance(current_input, dict):
            from ..utils.validation import prepare_feature_vector
            baseline_dict = prepare_feature_vector(current_input)
        else:
            raise InvalidFarmInputException(f"Unsupported input type: {type(current_input)}")

        safe_baseline = copy.deepcopy(baseline_dict)
        pipeline = self.model_service.get_pipeline()
        metadata = self.model_service.get_scenario_metadata()

        try:
            result = compute_feature_sensitivity(
                current_input=safe_baseline,
                feature_name=feature_name,
                num_points=num_points,
                pipeline=pipeline,
                metadata=metadata if metadata else None,
            )
        except ScenarioValidationError as sve:
            logger.warning(f"Sensitivity validation error: {sve}")
            raise UnsupportedScenarioException(message=str(sve))
        except Exception as e:
            logger.exception(f"Sensitivity computation failed: {e}")
            raise CropIQException(
                message=f"Sensitivity calculation failed: {str(e)}",
                code="SENSITIVITY_ERROR",
                status_code=500,
            )

        return sanitize_for_json(result)

    def presets(
        self,
        current_input: Union[FarmInput, Dict[str, Any]],
        preset_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate empirical quantile presets for the current observation."""
        if isinstance(current_input, FarmInput):
            baseline_dict = current_input.to_feature_dict()
        elif isinstance(current_input, dict):
            from ..utils.validation import prepare_feature_vector
            baseline_dict = prepare_feature_vector(current_input)
        else:
            raise InvalidFarmInputException(f"Unsupported input type: {type(current_input)}")

        safe_baseline = copy.deepcopy(baseline_dict)
        all_presets = [
            "improve_moisture",
            "historical_median_moisture",
            "drought_stress",
            "higher_rainfall",
            "lower_rainfall",
            "warmer_temperature",
            "cooler_temperature",
        ]

        if preset_type:
            try:
                preset_changes = create_preset_scenario(safe_baseline, preset_type)
                return sanitize_for_json({"preset": preset_type, "changes": preset_changes})
            except Exception as e:
                raise UnsupportedScenarioException(f"Preset '{preset_type}' failed: {e}")

        generated = {}
        for p in all_presets:
            try:
                generated[p] = create_preset_scenario(safe_baseline, p)
            except Exception:
                pass

        return sanitize_for_json({"presets": generated})


def get_scenario_service() -> ScenarioService:
    return ScenarioService(get_model_service())

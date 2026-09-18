"""
CropIQ Phase 5 - What-If Scenario Input & Change Validator
Protects against target/identifier mutation, verifies physical plausibility,
checks empirical training bounds, and generates reliability warnings.
"""

from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

from .utils import load_scenario_metadata
from ..ml.utils import NUMERICAL_FEATURES, PREDICTIVE_FEATURES, TARGET_COLUMN


class ScenarioValidationError(Exception):
    """Raised when a scenario definition violates integrity, target protection, or physical bounds."""
    pass


def validate_baseline_input(
    current_input: Union[Dict[str, Any], pd.DataFrame]
) -> Dict[str, Any]:
    """
    Validate current farm observation input before simulation.
    Ensures target is absent, required features exist, and values are finite.
    """
    if isinstance(current_input, pd.DataFrame):
        if len(current_input) == 0:
            raise ScenarioValidationError("Input DataFrame is empty.")
        data_dict = current_input.iloc[0].to_dict()
    elif isinstance(current_input, dict):
        data_dict = current_input.copy()
    else:
        raise ScenarioValidationError(
            f"Unsupported input type: {type(current_input)}. Expected dict or DataFrame."
        )

    # 1. Target leakage check
    if TARGET_COLUMN in data_dict:
        raise ScenarioValidationError(
            f"Target column '{TARGET_COLUMN}' cannot be present in simulation input. "
            "The simulator predicts yield; users cannot provide the target."
        )

    # 2. Check for missing predictive features
    missing = [col for col in PREDICTIVE_FEATURES if col not in data_dict]
    if missing:
        raise ScenarioValidationError(
            f"Simulation input missing {len(missing)} required feature(s): {missing}"
        )

    # 3. Numeric checks
    for col in NUMERICAL_FEATURES:
        val = data_dict.get(col)
        if val is not None:
            try:
                num_val = float(val)
                if np.isinf(num_val):
                    raise ScenarioValidationError(
                        f"Feature '{col}' contains infinite value in baseline input."
                    )
                if np.isnan(num_val):
                    if "expanding" in col:
                        # Allowed by Phase 1 design for first field observations; imputed by pipeline
                        pass
                    else:
                        # Non-expanding NaN will be imputed by model pipeline with warning
                        pass
            except (ValueError, TypeError):
                raise ScenarioValidationError(
                    f"Feature '{col}' must be numeric, got: {val}"
                )

    return data_dict


def validate_scenario_changes(
    current_input: Dict[str, Any],
    scenario_changes: Dict[str, Any],
    metadata: Optional[Dict[str, Any]] = None,
) -> Tuple[bool, Dict[str, float], List[str]]:
    """
    Validate proposed scenario changes against integrity constraints,
    physical limits, and empirical training ranges.

    Returns:
    - (is_valid: bool, validated_changes: Dict[str, float], warnings: List[str])
    """
    if not isinstance(scenario_changes, dict):
        raise ScenarioValidationError(
            f"Scenario changes must be a dictionary, got: {type(scenario_changes)}"
        )

    meta = metadata or load_scenario_metadata()
    features_meta = meta.get("features", {})
    blocked_targets = meta.get("blocked_targets", ["yield"])
    blocked_identifiers = meta.get("blocked_identifiers", [])

    validated_changes: Dict[str, float] = {}
    warnings: List[str] = []

    for key, val in scenario_changes.items():
        # 1. Target mutation rejection (Rule 65)
        if key in blocked_targets or key == TARGET_COLUMN:
            raise ScenarioValidationError(
                f"Modification of target '{key}' is strictly forbidden. "
                "Crop yield is an estimated outcome, not a controllable scenario parameter."
            )

        # 2. Identifier mutation rejection (Rule 66)
        if key in blocked_identifiers or key in ("field_id", "date_of_image", "raw_row_index"):
            raise ScenarioValidationError(
                f"Modification of metadata identifier '{key}' is not allowed in scenario simulations."
            )

        # 3. Crop categorical change rejection (Rule 67)
        if key == "crop_type":
            raise ScenarioValidationError(
                "Changing crop_type inside an environmental scenario is not supported. "
                "Crop changes represent systemic system shifts rather than localized what-if conditions."
            )

        # 4. Unknown feature check
        if key not in PREDICTIVE_FEATURES:
            raise ScenarioValidationError(
                f"Unknown feature '{key}' cannot be simulated. Feature is not recognized by the model."
            )

        # 5. Type and finiteness validation
        try:
            num_val = float(val)
            if np.isnan(num_val) or np.isinf(num_val):
                raise ScenarioValidationError(
                    f"Scenario value for '{key}' cannot be NaN or infinite."
                )
        except (ValueError, TypeError):
            raise ScenarioValidationError(
                f"Scenario value for '{key}' must be a numerical value, got: {val}"
            )

        # 6. Physical bounds check (Physical Invalidity - Rule 16, 20)
        f_info = features_meta.get(key, {})
        phys_bounds = f_info.get("physical_bounds")
        if phys_bounds:
            p_min, p_max = phys_bounds
            if num_val < p_min or num_val > p_max:
                raise ScenarioValidationError(
                    f"Physically impossible value for '{key}': {num_val}. "
                    f"Allowed physical range is [{p_min}, {p_max}]."
                )

        # 7. Training range check (Rule 18, 19)
        training_stats = f_info.get("training_stats")
        if training_stats:
            t_min = training_stats.get("min", -np.inf)
            t_max = training_stats.get("max", np.inf)
            p05 = training_stats.get("p05", t_min)
            p95 = training_stats.get("p95", t_max)

            if num_val < t_min or num_val > t_max:
                # Extrapolative: allow with clear warning
                msg = (
                    f"Scenario value for '{key}' ({num_val}) is outside the model's observed "
                    f"training range [{t_min:.2f}, {t_max:.2f}]. The model estimate requires "
                    "extrapolation and may be less reliable."
                )
                warnings.append(msg)
            elif num_val < p05 or num_val > p95:
                # Unusual tail value
                msg = (
                    f"Scenario value for '{key}' ({num_val}) is in the extreme tails "
                    f"of the training distribution (outside 5th-95th percentiles [{p05:.2f}, {p95:.2f}])."
                )
                warnings.append(msg)

        # 8. Actionability context check (Rule 14, 71, 72, 73)
        classification = f_info.get("classification")
        if classification == "CONTEXTUAL_SIMULATABLE":
            warnings.append(
                f"Note: '{key}' is an external contextual variable; this scenario simulates "
                "hypothetical environmental conditions, not a farmer-controlled action."
            )
        elif classification == "MONITORING_ONLY":
            warnings.append(
                f"Note: '{key}' is an observational vegetation index; this simulates model "
                "sensitivity rather than a directly dialable field intervention."
            )

        validated_changes[key] = round(num_val, 4)

    return True, validated_changes, warnings

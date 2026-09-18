"""
CropIQ Phase 5 - Scenario Constraints & Feature Dependencies
Enforces deep-copy immutability, manages derived feature dependencies,
and emits multi-variable interaction and co-variation warnings.
"""

from typing import Any, Dict, List, Tuple
import copy


def apply_scenario_constraints(
    current_input: Dict[str, Any],
    scenario_changes: Dict[str, float],
) -> Tuple[Dict[str, Any], List[str]]:
    """
    Safely creates a scenario input by deep-copying current_input,
    applying validated changes, and generating feature interaction warnings.

    Returns:
    - (scenario_input: Dict[str, Any], interaction_warnings: List[str])
    """
    # 1. Strict Immutability (Rule 7)
    scenario_input = copy.deepcopy(current_input)
    interaction_warnings: List[str] = []

    changed_keys = list(scenario_changes.keys())

    # 2. Multi-variable interaction warning (Rule 33, 55, 101)
    if len(changed_keys) > 1:
        interaction_warnings.append(
            "Because multiple inputs were changed together, the estimated difference "
            "cannot be attributed to one variable alone; joint interactions may influence the model."
        )

    # 3. Vegetation index co-variation check (Rule 102)
    veg_indices = {"NDVI", "GNDVI", "NDWI", "SAVI"}
    changed_veg = [k for k in changed_keys if k in veg_indices]
    if 0 < len(changed_veg) < len(veg_indices):
        interaction_warnings.append(
            f"Vegetation indices naturally co-vary in crop canopies. Simulating changes to {changed_veg} "
            "while holding other indices fixed represents a synthetic model sensitivity exploration."
        )

    # 4. Apply changes
    for key, val in scenario_changes.items():
        scenario_input[key] = val

    # 5. Note on engineered expanding features (Rule 69, 70)
    # In CropIQ Phase 1, expanding features (e.g. soil_moisture_field_expanding_mean)
    # are calculated strictly over prior observations (shift(1).expanding()).
    # Therefore, modifying the current observation does not alter historical stats from prior dates.

    return scenario_input, interaction_warnings

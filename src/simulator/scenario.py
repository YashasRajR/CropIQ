"""
CropIQ Phase 5 - Scenario Presets, Batch Runner, and State Reset
Provides dynamic empirical presets, multiple-scenario comparative ranking,
and scenario reset routines.
"""

from typing import Any, Dict, List, Optional, Tuple
from .utils import load_scenario_metadata


PRESET_DEFINITIONS = {
    "improve_moisture": {
        "name": "Favorable Moisture Scenario",
        "description": "Adjusts root-zone soil moisture toward the upper historical quartile (75th percentile).",
        "feature": "soil_moisture",
        "target_stat": "p75",
    },
    "historical_median_moisture": {
        "name": "Historical Median Moisture Scenario",
        "description": "Adjusts soil moisture toward the model training median.",
        "feature": "soil_moisture",
        "target_stat": "median",
    },
    "drought_stress": {
        "name": "Drought Moisture Stress Scenario",
        "description": "Simulates depressed root-zone moisture near the historical 10th percentile.",
        "feature": "soil_moisture",
        "target_stat": "p05",
    },
    "higher_rainfall": {
        "name": "Higher Precipitation Scenario",
        "description": "Simulates elevated contextual rainfall toward the 75th percentile.",
        "feature": "rainfall",
        "target_stat": "p75",
    },
    "lower_rainfall": {
        "name": "Precipitation Deficit Scenario",
        "description": "Simulates low rainfall near the 5th percentile.",
        "feature": "rainfall",
        "target_stat": "p05",
    },
    "elevated_temperature": {
        "name": "Elevated Temperature Scenario",
        "description": "Simulates an ambient heat wave (+5°C above current observation).",
        "feature": "temperature",
        "offset": 5.0,
    },
    "cooler_temperature": {
        "name": "Cooler Temperature Scenario",
        "description": "Simulates cooler weather conditions (-5°C below current observation).",
        "feature": "temperature",
        "offset": -5.0,
    },
}


def create_preset_scenario(
    current_input: Dict[str, Any],
    preset_type: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generate dynamic scenario changes based on empirical training quantiles.

    Parameters:
    -----------
    current_input: baseline farm observation.
    preset_type: one of PRESET_DEFINITIONS keys.
    metadata: optional scenario metadata dict.

    Returns:
    --------
    Dict with 'name', 'description', 'changes'.
    """
    if preset_type not in PRESET_DEFINITIONS:
        raise ValueError(
            f"Unknown preset '{preset_type}'. Available presets: {list(PRESET_DEFINITIONS.keys())}"
        )

    preset = PRESET_DEFINITIONS[preset_type]
    meta = metadata or load_scenario_metadata()
    features_meta = meta.get("features", {})

    feat = preset["feature"]
    f_info = features_meta.get(feat, {})
    stats = f_info.get("training_stats", {})

    changes: Dict[str, float] = {}

    if "target_stat" in preset:
        target_val = stats.get(preset["target_stat"])
        if target_val is None:
            target_val = stats.get("median", current_input.get(feat, 0.0))
        changes[feat] = round(float(target_val), 4)
    elif "offset" in preset:
        cur_val = current_input.get(feat, stats.get("median", 20.0))
        target_val = float(cur_val) + float(preset["offset"])
        # Clamp to physical bounds
        phys_bounds = f_info.get("physical_bounds", [-50, 70])
        target_val = max(phys_bounds[0], min(phys_bounds[1], target_val))
        changes[feat] = round(target_val, 4)

    return {
        "preset_id": preset_type,
        "name": preset["name"],
        "description": preset["description"],
        "changes": changes,
    }


def reset_scenario(current_input: Dict[str, Any]) -> Dict[str, Any]:
    """
    Reset scenario changes to empty state, restoring the baseline observation.
    """
    return {
        "status": "reset",
        "changes": {},
        "current_input": current_input.copy(),
        "message": "Scenario reset to baseline observation.",
    }

"""
CropIQ Phase 5 - What-If Scenario Simulator Utilities
Provides scenario metadata loaders, standardized distance calculators for scenario realism,
and an in-memory session history manager.
"""

from datetime import datetime, timezone
import json
import math
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[2]
SCENARIO_METADATA_PATH = REPO_ROOT / "knowledge" / "scenario_features.json"
DEFAULT_MATERIAL_THRESHOLD = 0.9765  # Phase 2 Validation MAE

_CACHED_SCENARIO_METADATA: Optional[Dict[str, Any]] = None


def load_scenario_metadata(filepath: Optional[Path] = None, reload: bool = False) -> Dict[str, Any]:
    """
    Load scenario feature metadata and empirical training statistics.
    """
    global _CACHED_SCENARIO_METADATA
    if _CACHED_SCENARIO_METADATA is not None and not reload:
        return _CACHED_SCENARIO_METADATA

    path = filepath or SCENARIO_METADATA_PATH
    if not path.exists():
        raise FileNotFoundError(f"Scenario features metadata not found at: {path}")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    _CACHED_SCENARIO_METADATA = data
    return data


def calculate_scenario_distance(
    current_input: Dict[str, Any],
    scenario_input: Dict[str, Any],
    metadata: Optional[Dict[str, Any]] = None,
) -> Tuple[float, str]:
    """
    Calculate standardized Euclidean distance (Z-score space) between scenario and
    training distribution to evaluate scenario realism.

    Returns:
    - (distance: float, classification: 'NORMAL' | 'UNUSUAL' | 'EXTRAPOLATIVE')
    """
    meta = metadata or load_scenario_metadata()
    features_meta = meta.get("features", {})

    squared_z_diffs = []

    for feat, f_info in features_meta.items():
        if feat in scenario_input and scenario_input[feat] is not None:
            stats = f_info.get("training_stats", {})
            mean = stats.get("mean", 0.0)
            std = stats.get("std", 1.0)
            val = float(scenario_input[feat])
            p01 = stats.get("p01", stats.get("min", -np.inf))
            p99 = stats.get("p99", stats.get("max", np.inf))

            # Standardized deviation from training mean
            z = (val - mean) / (std if std > 1e-6 else 1.0)
            squared_z_diffs.append(z ** 2)

    if not squared_z_diffs:
        return 0.0, "NORMAL"

    dist = math.sqrt(sum(squared_z_diffs) / len(squared_z_diffs))

    # Classify realism distance
    if dist < 1.5:
        classification = "NORMAL"
    elif dist < 3.0:
        classification = "UNUSUAL"
    else:
        classification = "EXTRAPOLATIVE"

    return round(dist, 4), classification


class SessionScenarioHistory:
    """
    In-memory temporary session history for saving and comparing simulated scenarios.
    """

    def __init__(self, max_history: int = 10):
        self.max_history = max_history
        self._history: List[Dict[str, Any]] = []

    def record_scenario(
        self,
        scenario_name: str,
        changes: Dict[str, Any],
        baseline_prediction: float,
        scenario_prediction: float,
        difference: float,
        percentage_change: Optional[float],
        risk_level: str,
        uncertainty_level: str,
        warnings: List[str],
    ) -> Dict[str, Any]:
        """Record a completed scenario into session history."""
        entry = {
            "id": f"scenario_{len(self._history) + 1}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "name": scenario_name,
            "changes": changes,
            "baseline_yield": baseline_prediction,
            "scenario_yield": scenario_prediction,
            "difference": difference,
            "percentage_change": percentage_change,
            "risk_level": risk_level,
            "uncertainty_level": uncertainty_level,
            "warnings": warnings,
        }
        self._history.append(entry)
        if len(self._history) > self.max_history:
            self._history.pop(0)
        return entry

    def get_history(self) -> List[Dict[str, Any]]:
        return list(self._history)

    def clear(self):
        self._history.clear()


# Default singleton session history
session_history = SessionScenarioHistory()

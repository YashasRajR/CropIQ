"""
CropIQ Phase 5 - What-If Scenario Simulator Package
Enables interactive exploration of hypothetical farm conditions on the trained ML engine,
with strict non-causal safeguards, delta explainability, and sensitivity analysis.
"""

from .comparison import compare_scenarios
from .constraints import apply_scenario_constraints
from .explanation import (
    compute_delta_explanations,
    evaluate_scenario_reliability,
    format_scenario_summary,
)
from .scenario import (
    PRESET_DEFINITIONS,
    create_preset_scenario,
    reset_scenario,
)
from .simulator import (
    compute_feature_sensitivity,
    simulate_multiple_scenarios,
    simulate_scenario,
)
from .utils import (
    DEFAULT_MATERIAL_THRESHOLD,
    SessionScenarioHistory,
    calculate_scenario_distance,
    load_scenario_metadata,
    session_history,
)
from .validator import (
    ScenarioValidationError,
    validate_baseline_input,
    validate_scenario_changes,
)

__all__ = [
    "simulate_scenario",
    "simulate_multiple_scenarios",
    "compute_feature_sensitivity",
    "create_preset_scenario",
    "reset_scenario",
    "compare_scenarios",
    "apply_scenario_constraints",
    "compute_delta_explanations",
    "evaluate_scenario_reliability",
    "format_scenario_summary",
    "calculate_scenario_distance",
    "load_scenario_metadata",
    "validate_baseline_input",
    "validate_scenario_changes",
    "ScenarioValidationError",
    "SessionScenarioHistory",
    "session_history",
    "PRESET_DEFINITIONS",
    "DEFAULT_MATERIAL_THRESHOLD",
]

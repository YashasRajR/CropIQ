"""
CropIQ What-If Scenarios API Routes
Exposes interactive scenario simulation, sensitivity curve analysis, and empirical presets.
"""

from fastapi import APIRouter, Depends
from ...dependencies.services import get_scenario_service
from ...schemas.scenario import (
    ScenarioRequest,
    ScenarioResponse,
    SensitivityRequest,
    SensitivityResponse,
    PresetsRequest,
    PresetsResponse,
)
from ...services.scenario_service import ScenarioService

router = APIRouter(tags=["What-If Scenarios"])


@router.post(
    "/scenario",
    response_model=ScenarioResponse,
    summary="Simulate What-If Farm Scenario",
    description=(
        "Simulates hypothetical agronomic changes against baseline observations on the SAME trained model. "
        "Returns yield differences, MAE materiality assessment, delta SHAP, risk progression, and non-causal interpretation."
    ),
)
async def run_scenario(
    request: ScenarioRequest,
    scenario_service: ScenarioService = Depends(get_scenario_service),
) -> ScenarioResponse:
    """Execute scenario simulation and compare against baseline observation."""
    result = scenario_service.simulate(
        current_input=request.current_input,
        scenario_changes=request.changes,
        scenario_name=request.scenario_name,
        run_explanation=request.run_explanation,
    )
    return ScenarioResponse(**result)


@router.post(
    "/scenario/sensitivity",
    response_model=SensitivityResponse,
    summary="1D Feature Sensitivity Analysis",
    description="Sweeps a feature across empirical training percentiles [p01, p99] while holding other inputs constant.",
)
async def run_sensitivity(
    request: SensitivityRequest,
    scenario_service: ScenarioService = Depends(get_scenario_service),
) -> SensitivityResponse:
    """Compute sensitivity curve for a feature."""
    result = scenario_service.sensitivity(
        current_input=request.current_input,
        feature_name=request.feature,
        num_points=request.num_points,
    )
    return SensitivityResponse(**result)


@router.post(
    "/scenario/presets",
    response_model=PresetsResponse,
    summary="Generate Empirical Scenario Presets",
    description="Generates standardized what-if modifications derived from training distribution quantiles.",
)
async def run_presets(
    request: PresetsRequest,
    scenario_service: ScenarioService = Depends(get_scenario_service),
) -> PresetsResponse:
    """Generate preset scenario parameter dictionaries."""
    result = scenario_service.presets(
        current_input=request.current_input,
        preset_type=request.preset_type,
    )
    return PresetsResponse(**result)

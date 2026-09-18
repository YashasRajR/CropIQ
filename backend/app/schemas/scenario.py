"""
CropIQ Scenario Pydantic Schemas
Defines request and response contracts for what-if simulations, sensitivity curves, and presets.
"""

from typing import Any, Dict, List, Optional
import math
from pydantic import BaseModel, Field, field_validator
from .farm import FarmInput


class ScenarioRequest(BaseModel):
    current_input: FarmInput = Field(..., description="Baseline farm observation")
    changes: Dict[str, float] = Field(
        ...,
        description="Features to modify and their new hypothetical values",
        example={"soil_moisture": 34.0},
    )
    scenario_name: Optional[str] = Field(None, example="Supplemental Irrigation")
    run_explanation: bool = Field(default=True, description="Whether to compute delta SHAP contributions")

    @field_validator("changes")
    @classmethod
    def validate_changes(cls, changes: Dict[str, float]) -> Dict[str, float]:
        if not changes and changes != {}:
            raise ValueError("Changes must be a dictionary.")

        # Reject target mutation
        if "yield" in changes:
            raise ValueError(
                "Modification of target 'yield' is strictly forbidden. "
                "Crop yield is an estimated outcome, not an input parameter."
            )

        # Reject metadata / identifier mutation
        for ident in ("field_id", "date_of_image", "raw_row_index", "source_dataset"):
            if ident in changes:
                raise ValueError(f"Modification of metadata '{ident}' is not allowed in scenarios.")

        # Reject crop_type change
        if "crop_type" in changes:
            raise ValueError(
                "Modifying crop_type inside what-if scenario is not supported. "
                "Crop substitutions represent systemic transitions."
            )

        for feat, val in changes.items():
            if val is None or math.isnan(val) or math.isinf(val):
                raise ValueError(f"Value for '{feat}' cannot be NaN or infinite.")

        return changes


class ScenarioBaseline(BaseModel):
    input: Optional[Dict[str, Any]] = None
    predicted_yield: float
    unit: str = "unconfirmed"
    risk: Dict[str, Any] = Field(default_factory=dict)
    uncertainty: Dict[str, Any] = Field(default_factory=dict)


class ScenarioResult(BaseModel):
    name: str
    input: Optional[Dict[str, Any]] = None
    changes: Dict[str, float]
    predicted_yield: float
    unit: str = "unconfirmed"
    risk: Dict[str, Any] = Field(default_factory=dict)
    uncertainty: Dict[str, Any] = Field(default_factory=dict)


class ScenarioComparison(BaseModel):
    absolute_change: float
    percentage_change: Optional[float] = None
    direction: str
    is_material: bool
    materiality_label: str
    material_threshold: float
    feature_diffs: Dict[str, Any]


class ScenarioResponse(BaseModel):
    baseline: ScenarioBaseline
    scenario: ScenarioResult
    comparison: ScenarioComparison
    progression: Dict[str, Any]
    explanation: Dict[str, Any]
    validation: Dict[str, Any]
    interpretation: Dict[str, Any]


class SensitivityRequest(BaseModel):
    current_input: FarmInput = Field(...)
    feature: str = Field(..., example="soil_moisture")
    num_points: int = Field(default=10, ge=3, le=50)


class SensitivityPoint(BaseModel):
    feature_value: float
    predicted_yield: float
    difference: float


class SensitivityResponse(BaseModel):
    feature: str
    display_name: str
    unit: str
    baseline_value: Optional[float] = None
    baseline_yield: float
    points: List[SensitivityPoint]
    disclaimer: str


class PresetsRequest(BaseModel):
    current_input: FarmInput = Field(...)
    preset_type: Optional[str] = Field(
        default=None,
        description="Optional specific preset name (e.g., improve_moisture, drought_stress)",
    )


class PresetsResponse(BaseModel):
    presets: Dict[str, Any]

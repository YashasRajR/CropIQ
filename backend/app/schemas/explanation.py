"""
CropIQ Explanation Pydantic Schemas
Defines local SHAP and feature contribution payloads.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FeatureContribution(BaseModel):
    feature: str = Field(..., example="soil_moisture")
    display_name: str = Field(..., example="Soil Moisture")
    observed_value: Optional[float] = Field(None, example=21.98)
    contribution: float = Field(..., example=-1.45)
    direction: str = Field(..., example="negative")
    magnitude: float = Field(..., example=1.45)
    interpretation: str = Field(
        ...,
        example="Soil Moisture was associated with an estimated 1.45 reduction from baseline.",
    )


class ExplanationResponse(BaseModel):
    baseline_yield: float = Field(..., description="Model expected value across training dataset")
    predicted_yield: Optional[float] = Field(None, description="Model point estimate for this observation")
    method: str = Field(..., example="TreeSHAP")
    top_positive_factors: List[Dict[str, Any]] = Field(default_factory=list)
    top_negative_factors: List[Dict[str, Any]] = Field(default_factory=list)
    top_overall_factors: List[Dict[str, Any]] = Field(default_factory=list)
    all_contributions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    explanation_identity_verified: bool = Field(True)
    identity_discrepancy: Optional[float] = Field(None)
    non_causal_statement: str = Field(
        default=(
            "Feature contributions describe mathematical model importance, "
            "not verified real-world causal mechanisms."
        )
    )

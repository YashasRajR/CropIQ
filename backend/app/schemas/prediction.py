"""
CropIQ Prediction Pydantic Schemas
Defines structured responses for the unified /predict endpoint.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PredictionValue(BaseModel):
    yield_: float = Field(..., alias="yield", description="Point prediction for crop yield")
    unit: str = Field(default="unconfirmed", description="Unit of yield as validated in Phase 1/2")


class ContextPayload(BaseModel):
    crop: str = Field(...)
    historical_mean: Optional[float] = None
    historical_median: Optional[float] = None
    historical_min: Optional[float] = None
    historical_max: Optional[float] = None
    percentile_rank: Optional[float] = None
    comparison_label: Optional[str] = None


class RiskPayload(BaseModel):
    level: str = Field(..., example="MODERATE")
    score: Optional[int] = Field(None, example=45)
    drivers: List[str] = Field(default_factory=list)
    protective_factors: List[str] = Field(default_factory=list)
    component_scores: Optional[Dict[str, Any]] = None


class UncertaintyPayload(BaseModel):
    classification: str = Field(..., example="LOW")
    std_yield: Optional[float] = None
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None
    relative_uncertainty: Optional[float] = None
    n_trees: int = Field(default=300)


class PredictionResponse(BaseModel):
    prediction: PredictionValue
    context: Optional[ContextPayload] = None
    risk: RiskPayload
    uncertainty: UncertaintyPayload
    explanation: Dict[str, Any]
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    data_quality: Dict[str, Any] = Field(default_factory=dict)
    insights: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        populate_by_name = True

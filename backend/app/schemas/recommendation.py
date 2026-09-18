"""
CropIQ Recommendation Pydantic Schemas
Defines structured, auditable agronomic action recommendations.
"""

from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class RecommendationItem(BaseModel):
    id: str = Field(..., example="REC_WATER_LOW_01")
    title: str = Field(..., example="Address Soil Moisture Deficit")
    category: str = Field(..., example="WATER")
    priority: str = Field(..., example="HIGH")
    actionability: str = Field(..., example="ACTIONABLE")
    summary: str = Field(..., example="Soil moisture is below optimal threshold.")
    reason: str = Field(..., example="Observed moisture level is restricting yield potential.")
    action: str = Field(..., example="Initiate supplemental irrigation.")
    evidence: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    confidence: str = Field(..., example="HIGH")
    limitations: Union[str, List[str]] = Field(
        ..., example="Model association; verify field drainage before heavy watering."
    )
    what_if_supported: bool = Field(False)
    what_if_variable: Optional[str] = None
    trade_offs: Optional[List[str]] = None


class RecommendationSummary(BaseModel):
    total_generated: int = Field(...)
    displayed: int = Field(...)
    high_priority: int = Field(...)
    medium_priority: int = Field(...)
    low_priority: int = Field(...)
    crop_specific_recommendations_available: bool = Field(...)
    executive_summary: str = Field(...)


class RecommendationResponse(BaseModel):
    summary: RecommendationSummary
    recommendations: List[RecommendationItem]
    all_candidates: Optional[List[RecommendationItem]] = None
    rule_trace: Optional[List[Dict[str, Any]]] = None
    warnings: List[str] = Field(default_factory=list)

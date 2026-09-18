"""
CropIQ Common Pydantic Schemas
Defines reusable schemas for errors, health check, and model metadata.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class APIErrorDetail(BaseModel):
    code: str = Field(..., description="Standardized error code")
    message: str = Field(..., description="Human-readable error description")
    details: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context or validation errors")


class APIErrorResponse(BaseModel):
    error: APIErrorDetail


class HealthResponse(BaseModel):
    status: str = Field(..., example="ok")
    service: str = Field(..., example="CropIQ API")
    model_loaded: bool = Field(..., example=True)
    model_version: Optional[str] = Field(None, example="1.0.0")
    environment: str = Field(..., example="development")


class ModelInfoResponse(BaseModel):
    project: str = Field(..., example="CropIQ")
    model_name: str = Field(..., example="Random Forest")
    model_type: str = Field(..., example="RandomForestRegressor")
    model_version: str = Field(..., example="1.0.0")
    target: str = Field(..., example="yield")
    target_unit: str = Field(..., example="unconfirmed")
    features: List[str] = Field(..., description="Full list of predictive features")
    categorical_features: List[str] = Field(..., example=["crop_type"])
    numerical_features: List[str] = Field(..., description="List of 29 numerical features")
    metrics: Dict[str, Any] = Field(..., description="Validation and test metrics from training")
    dataset_summary: Optional[Dict[str, Any]] = Field(None, description="Training dataset breakdown")
    candidate_comparison: Optional[Dict[str, Any]] = Field(None, description="Comparison of candidate ML models")

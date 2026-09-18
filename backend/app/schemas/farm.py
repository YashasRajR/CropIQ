"""
CropIQ Farm Input Pydantic Schema
Defines validated input representations for farm observations.
"""

from typing import Any, Dict, Optional
import math
from pydantic import BaseModel, Field, field_validator
from ..utils.validation import prepare_feature_vector


class FarmInput(BaseModel):
    """
    Farm observation parameters for yield prediction, explanation, and recommendations.
    Accepts both standard field survey forms and full model-ready vectors.
    """

    # Categorical
    crop_type: str = Field(
        ...,
        description="Target crop species (e.g., Rice, Maize, Wheat, Chickpea, Cotton)",
        example="Rice",
    )

    # Core Geographic Features
    latitude: float = Field(..., description="Geographic latitude coordinate", example=22.625)
    longitude: float = Field(..., description="Geographic longitude coordinate", example=88.498)

    # Remote Sensing Vegetation Indices
    NDVI: float = Field(
        ...,
        description="Normalized Difference Vegetation Index [-1.0, 1.0]",
        example=0.511,
    )
    GNDVI: float = Field(
        ...,
        description="Green Normalized Difference Vegetation Index [-1.0, 1.0]",
        example=0.467,
    )
    NDWI: float = Field(
        ...,
        description="Normalized Difference Water Index [-1.0, 1.0]",
        example=-0.467,
    )
    SAVI: float = Field(
        ...,
        description="Soil Adjusted Vegetation Index [-1.0, 1.5]",
        example=0.767,
    )

    # Soil & Meteorological Conditions
    soil_moisture: float = Field(
        ...,
        description="Volumetric or relative soil moisture measurement",
        example=21.98,
    )
    temperature: float = Field(
        ...,
        description="Ambient air temperature (approx Celsius)",
        example=14.6,
    )
    rainfall: float = Field(
        ...,
        description="Cumulative or precipitation depth (approx mm)",
        example=17.5,
    )

    # Optional Metadata & Temporal Tracking
    field_id: Optional[str] = Field(
        default=None,
        description="Field / plot identifier (used for metadata only, excluded from predictive features)",
        example="Field_1",
    )
    date_of_image: Optional[str] = Field(
        default=None,
        description="Observation date (YYYY-MM-DD)",
        example="2023-01-04",
    )

    # Optional Derived Temporal Features
    year: Optional[float] = Field(default=None, example=2023)
    month: Optional[float] = Field(default=None, example=1)
    day_of_year: Optional[float] = Field(default=None, example=4)
    month_sin: Optional[float] = None
    month_cos: Optional[float] = None
    doy_sin: Optional[float] = None
    doy_cos: Optional[float] = None
    field_obs_number: Optional[float] = None

    # Optional Expanding Statistics (auto-imputed if omitted)
    NDVI_field_expanding_mean: Optional[float] = None
    GNDVI_field_expanding_mean: Optional[float] = None
    SAVI_field_expanding_mean: Optional[float] = None
    soil_moisture_field_expanding_mean: Optional[float] = None
    rainfall_field_expanding_mean: Optional[float] = None
    temperature_field_expanding_mean: Optional[float] = None
    NDVI_field_expanding_std: Optional[float] = None
    GNDVI_field_expanding_std: Optional[float] = None
    SAVI_field_expanding_std: Optional[float] = None
    soil_moisture_field_expanding_std: Optional[float] = None
    rainfall_field_expanding_std: Optional[float] = None
    temperature_field_expanding_std: Optional[float] = None

    @field_validator("rainfall")
    @classmethod
    def validate_rainfall(cls, v: float) -> float:
        if v < 0:
            raise ValueError("rainfall must be non-negative.")
        if math.isnan(v) or math.isinf(v):
            raise ValueError("rainfall cannot be NaN or infinite.")
        return v

    @field_validator("soil_moisture")
    @classmethod
    def validate_soil_moisture(cls, v: float) -> float:
        if v < 0:
            raise ValueError("soil_moisture must be non-negative.")
        if math.isnan(v) or math.isinf(v):
            raise ValueError("soil_moisture cannot be NaN or infinite.")
        return v

    @field_validator("temperature")
    @classmethod
    def validate_temperature(cls, v: float) -> float:
        if v < -60.0 or v > 70.0:
            raise ValueError(f"temperature {v} is outside physical terrestrial bounds [-60, 70].")
        if math.isnan(v) or math.isinf(v):
            raise ValueError("temperature cannot be NaN or infinite.")
        return v

    @field_validator("NDVI", "GNDVI", "NDWI", "SAVI")
    @classmethod
    def validate_indices(cls, v: float, info) -> float:
        if math.isnan(v) or math.isinf(v):
            raise ValueError(f"{info.field_name} cannot be NaN or infinite.")
        if v < -2.0 or v > 2.0:
            raise ValueError(f"{info.field_name} value {v} is outside plausible spectral index bounds [-2.0, 2.0].")
        return v

    def to_feature_dict(self) -> Dict[str, Any]:
        """Convert input model into a complete, 30-feature vector dictionary for inference."""
        raw_dict = self.model_dump(exclude_unset=False)
        return prepare_feature_vector(raw_dict)

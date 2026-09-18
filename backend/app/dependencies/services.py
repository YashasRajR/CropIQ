"""
CropIQ FastAPI Dependency Providers
Allows clean, testable dependency injection across route handlers.
"""

from ..services.model_service import ModelService, get_model_service
from ..services.prediction_service import PredictionService, get_prediction_service
from ..services.explanation_service import ExplanationService, get_explanation_service
from ..services.recommendation_service import RecommendationService, get_recommendation_service
from ..services.scenario_service import ScenarioService, get_scenario_service
from ..services.pipeline_service import PipelineService, get_pipeline_service

__all__ = [
    "get_model_service",
    "get_prediction_service",
    "get_explanation_service",
    "get_recommendation_service",
    "get_scenario_service",
    "get_pipeline_service",
]

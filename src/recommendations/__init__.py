"""
CropIQ Phase 4 - Actionable Agricultural Recommendation Engine Package
Converts Phase 2 yield predictions and Phase 3 explainability & risk intelligence
into deterministic, prioritized, auditable, and non-causal agronomic recommendations.
"""

from .engine import generate_recommendations
from .evaluator import evaluate_candidate_rules
from .formatter import (
    format_recommendation_farmer_mode,
    format_recommendation_technical_mode,
    generate_executive_summary,
)
from .prioritizer import prioritize_and_rank_recommendations
from .rules import evaluate_atomic_condition, evaluate_composite_condition
from .utils import (
    ACTIONABILITY_TYPES,
    CATEGORIES,
    CONFIDENCE_LEVELS,
    EVIDENCE_LEVELS,
    PRIORITY_LEVELS,
    PROHIBITED_PHRASES,
    RuleTracer,
    load_agricultural_rules,
    load_crop_profiles,
    load_recommendation_metadata,
)
from .validator import (
    RecommendationValidationError,
    scan_for_prohibited_language,
    validate_rule_catalog,
    validate_single_recommendation,
)

__all__ = [
    "generate_recommendations",
    "evaluate_candidate_rules",
    "prioritize_and_rank_recommendations",
    "format_recommendation_farmer_mode",
    "format_recommendation_technical_mode",
    "generate_executive_summary",
    "evaluate_atomic_condition",
    "evaluate_composite_condition",
    "load_agricultural_rules",
    "load_crop_profiles",
    "load_recommendation_metadata",
    "validate_rule_catalog",
    "validate_single_recommendation",
    "scan_for_prohibited_language",
    "RecommendationValidationError",
    "RuleTracer",
    "CATEGORIES",
    "ACTIONABILITY_TYPES",
    "PRIORITY_LEVELS",
    "CONFIDENCE_LEVELS",
    "EVIDENCE_LEVELS",
    "PROHIBITED_PHRASES",
]

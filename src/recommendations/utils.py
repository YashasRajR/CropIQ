"""
CropIQ Phase 4 - Recommendation Engine Utilities
Provides loaders for external knowledge bases, constants, vocabularies,
and a diagnostic rule tracer.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import json
import os

# Root directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
KNOWLEDGE_DIR = BASE_DIR / "knowledge"

# Core vocabularies
CATEGORIES = [
    "WATER",
    "SOIL",
    "WEATHER",
    "VEGETATION",
    "CROP",
    "MONITORING",
    "RISK",
    "DATA_QUALITY",
    "GENERAL",
]

ACTIONABILITY_TYPES = [
    "ACTIONABLE",
    "MONITOR",
    "INFORMATIONAL",
]

PRIORITY_LEVELS = ["HIGH", "MEDIUM", "LOW"]
CONFIDENCE_LEVELS = ["HIGH", "MEDIUM", "LOW"]
EVIDENCE_LEVELS = ["HIGH", "MEDIUM", "LOW"]

PROHIBITED_PHRASES = [
    "guarantee",
    "guaranteed",
    "will definitely",
    "100% effective",
    "will increase",
    "will prevent",
    "cure",
    "diagnose",
    "exact dosage",
    "guaranteed yield",
    "crop will fail",
]


class RuleTracer:
    """
    Diagnostic logger to track rule evaluation, matching, merging, and conflict resolution.
    """

    def __init__(self):
        self.logs: List[Dict[str, Any]] = []

    def record(
        self,
        rule_id: str,
        status: str,
        details: Optional[str] = None,
        category: Optional[str] = None,
    ):
        """
        Record a rule lifecycle event.
        Status: 'EVALUATED', 'MATCHED', 'NO_MATCH', 'SKIPPED_CROP',
                'SKIPPED_FEATURE', 'MERGED', 'CONFLICT_RESOLVED'
        """
        self.logs.append({
            "rule_id": rule_id,
            "status": status,
            "category": category,
            "details": details or "",
        })

    def get_logs(self) -> List[Dict[str, Any]]:
        return self.logs


_CACHED_RULES: Optional[List[Dict[str, Any]]] = None
_CACHED_CROP_PROFILES: Optional[Dict[str, Any]] = None
_CACHED_METADATA: Optional[Dict[str, Any]] = None


def load_agricultural_rules(
    filepath: Optional[Path] = None, reload: bool = False
) -> List[Dict[str, Any]]:
    """
    Load and cache agricultural rules from knowledge/agricultural_rules.json.
    """
    global _CACHED_RULES
    if _CACHED_RULES is not None and not reload:
        return _CACHED_RULES

    path = filepath or (KNOWLEDGE_DIR / "agricultural_rules.json")
    if not path.exists():
        raise FileNotFoundError(f"Agricultural rules file not found at: {path}")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    rules = data.get("rules", [])
    _CACHED_RULES = rules
    return rules


def load_crop_profiles(
    filepath: Optional[Path] = None, reload: bool = False
) -> Dict[str, Any]:
    """
    Load and cache crop profiles from knowledge/crop_profiles.json.
    """
    global _CACHED_CROP_PROFILES
    if _CACHED_CROP_PROFILES is not None and not reload:
        return _CACHED_CROP_PROFILES

    path = filepath or (KNOWLEDGE_DIR / "crop_profiles.json")
    if not path.exists():
        raise FileNotFoundError(f"Crop profiles file not found at: {path}")

    with open(path, "r", encoding="utf-8") as f:
        profiles = json.load(f)

    _CACHED_CROP_PROFILES = profiles
    return profiles


def load_recommendation_metadata(
    filepath: Optional[Path] = None, reload: bool = False
) -> Dict[str, Any]:
    """
    Load recommendation metadata vocabularies from knowledge/recommendation_metadata.json.
    """
    global _CACHED_METADATA
    if _CACHED_METADATA is not None and not reload:
        return _CACHED_METADATA

    path = filepath or (KNOWLEDGE_DIR / "recommendation_metadata.json")
    if not path.exists():
        raise FileNotFoundError(f"Metadata file not found at: {path}")

    with open(path, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    _CACHED_METADATA = metadata
    return metadata

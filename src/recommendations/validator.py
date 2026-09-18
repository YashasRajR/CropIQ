"""
CropIQ Phase 4 - Recommendation & Knowledge Base Validator
Validates schema contracts, audits safety rules, checks for prohibited causal phrases,
and enforces agronomic non-causal integrity.
"""

import re
from typing import Any, Dict, List, Tuple

from .utils import (
    ACTIONABILITY_TYPES,
    CATEGORIES,
    CONFIDENCE_LEVELS,
    PRIORITY_LEVELS,
    PROHIBITED_PHRASES,
)


class RecommendationValidationError(Exception):
    """Raised when recommendations or knowledge rules violate contract or safety standards."""
    pass


REQUIRED_REC_FIELDS = [
    "id",
    "title",
    "category",
    "priority",
    "actionability",
    "reason",
    "action",
    "evidence",
    "confidence",
    "limitations",
    "what_if_supported",
]

# Regex pattern for prohibited exact chemical/fertilizer dosage patterns (e.g., '20 kg/ha', '50 kg of nitrogen')
UNSUPPORTED_DOSAGE_PATTERN = re.compile(
    r"\b\d+(\.\d+)?\s*(kg/ha|kg\s+of\s+\w+|litres/ha|grams/ha|bags/acre)\b",
    re.IGNORECASE,
)


def scan_for_prohibited_language(text: str) -> List[str]:
    """
    Scans a block of text for prohibited causal, guarantee, or diagnostic phrases.
    """
    found_issues = []
    text_lower = text.lower()

    for phrase in PROHIBITED_PHRASES:
        if phrase in text_lower:
            found_issues.append(f"Contains prohibited phrase: '{phrase}'")

    if UNSUPPORTED_DOSAGE_PATTERN.search(text):
        found_issues.append("Contains unsupported specific chemical/fertilizer dosage prescription")

    return found_issues


def validate_single_recommendation(rec: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate a single formatted recommendation against schema and safety guidelines.
    """
    issues = []

    # 1. Required fields
    for field in REQUIRED_REC_FIELDS:
        if field not in rec or rec[field] is None:
            issues.append(f"Missing required field: '{field}'")

    # 2. Category check
    category = rec.get("category")
    if category and category not in CATEGORIES:
        issues.append(f"Invalid category '{category}'; must be one of {CATEGORIES}")

    # 3. Priority check
    priority = rec.get("priority")
    if priority and priority not in PRIORITY_LEVELS:
        issues.append(f"Invalid priority '{priority}'; must be one of {PRIORITY_LEVELS}")

    # 4. Actionability check
    actionability = rec.get("actionability")
    if actionability and actionability not in ACTIONABILITY_TYPES:
        issues.append(f"Invalid actionability '{actionability}'; must be one of {ACTIONABILITY_TYPES}")

    # 5. Confidence check
    confidence = rec.get("confidence")
    if confidence and confidence not in CONFIDENCE_LEVELS:
        issues.append(f"Invalid confidence '{confidence}'; must be one of {CONFIDENCE_LEVELS}")

    # 6. Evidence presence
    evidence = rec.get("evidence", [])
    if not isinstance(evidence, list) or len(evidence) == 0:
        issues.append("Evidence list must be non-empty")

    # 7. Limitations presence for ACTIONABLE recommendations
    limitations = rec.get("limitations", [])
    if actionability == "ACTIONABLE" and (not isinstance(limitations, list) or len(limitations) == 0):
        issues.append("Actionable recommendations must state at least one agronomic limitation/caveat")

    # 8. Sourced rule validation
    if rec.get("source_type") == "sourced" and not rec.get("source"):
        issues.append("Rules marked as 'sourced' must provide a valid citation in 'source'")

    # 9. Language safety audit
    combined_text = f"{rec.get('title', '')} {rec.get('reason', '')} {rec.get('action', '')}"
    lang_issues = scan_for_prohibited_language(combined_text)
    issues.extend(lang_issues)

    return (len(issues) == 0, issues)


def validate_rule_catalog(rules: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    """
    Validate knowledge base rules at loading / test time.
    """
    issues = []
    seen_ids = set()

    for idx, rule in enumerate(rules):
        rule_id = rule.get("id")
        if not rule_id:
            issues.append(f"Rule at index {idx} has no 'id'")
            continue

        if rule_id in seen_ids:
            issues.append(f"Duplicate rule ID found: '{rule_id}'")
        seen_ids.add(rule_id)

        # Version check
        if not rule.get("version"):
            issues.append(f"Rule '{rule_id}' missing 'version'")

        # Category check
        if rule.get("category") not in CATEGORIES:
            issues.append(f"Rule '{rule_id}' has invalid category '{rule.get('category')}'")

        # Prohibited language check
        text = f"{rule.get('title', '')} {rule.get('reason', '')} {rule.get('action', '')}"
        lang_issues = scan_for_prohibited_language(text)
        if lang_issues:
            issues.extend([f"Rule '{rule_id}': {li}" for li in lang_issues])

        # Sourced check
        if rule.get("source_type") == "sourced" and not rule.get("source"):
            issues.append(f"Rule '{rule_id}' is marked 'sourced' but source citation is null")

    return (len(issues) == 0, issues)

"""
Unit tests for CropIQ Phase 4 Recommendation and Knowledge Base Validator.
"""

import unittest
from src.recommendations.utils import load_agricultural_rules
from src.recommendations.validator import (
    scan_for_prohibited_language,
    validate_rule_catalog,
    validate_single_recommendation,
)


class TestValidator(unittest.TestCase):
    """Test suite for schema contract, safety constraints, and prohibited language."""

    def setUp(self):
        self.valid_rec = {
            "id": "water_001",
            "title": "Review soil moisture conditions",
            "category": "WATER",
            "priority": "HIGH",
            "actionability": "ACTIONABLE",
            "reason": "Soil moisture is below benchmark and contributing negatively to prediction.",
            "action": "Check field moisture and review irrigation requirements.",
            "evidence": ["Soil moisture was below benchmark."],
            "confidence": "HIGH",
            "limitations": ["Depends on localized soil conditions."],
            "what_if_supported": True,
        }

    def test_valid_recommendation_passes(self):
        is_valid, issues = validate_single_recommendation(self.valid_rec)
        self.assertTrue(is_valid, f"Expected valid recommendation, got issues: {issues}")
        self.assertEqual(len(issues), 0)

    def test_missing_required_field(self):
        bad_rec = self.valid_rec.copy()
        del bad_rec["action"]
        is_valid, issues = validate_single_recommendation(bad_rec)
        self.assertFalse(is_valid)
        self.assertTrue(any("action" in iss for iss in issues))

    def test_invalid_category_and_priority(self):
        bad_rec = self.valid_rec.copy()
        bad_rec["category"] = "FINANCE"
        bad_rec["priority"] = "SUPER_CRITICAL"
        is_valid, issues = validate_single_recommendation(bad_rec)
        self.assertFalse(is_valid)
        self.assertTrue(any("FINANCE" in iss for iss in issues))
        self.assertTrue(any("SUPER_CRITICAL" in iss for iss in issues))

    def test_prohibited_language_scanner(self):
        # 1. Prohibited causal/guarantee phrase
        text_guarantee = "This irrigation will guarantee maximum yield and cure drought."
        issues = scan_for_prohibited_language(text_guarantee)
        self.assertTrue(any("guarantee" in iss for iss in issues))
        self.assertTrue(any("cure" in iss for iss in issues))

        # 2. Prohibited exact fertilizer dosage prescription
        text_dosage = "Apply 25 kg/ha of nitrogen fertilizer tomorrow."
        issues_dosage = scan_for_prohibited_language(text_dosage)
        self.assertTrue(any("dosage" in iss.lower() for iss in issues_dosage))

        # 3. Valid safe probabilistic phrasing
        text_safe = "Consider reviewing soil moisture and evaluating irrigation timing based on field tests."
        issues_safe = scan_for_prohibited_language(text_safe)
        self.assertEqual(len(issues_safe), 0)

    def test_knowledge_base_catalog_validity(self):
        rules = load_agricultural_rules()
        self.assertTrue(len(rules) >= 10, "Knowledge base should contain at least 10 rules")
        is_valid, issues = validate_rule_catalog(rules)
        self.assertTrue(is_valid, f"Knowledge base catalog validation failed: {issues}")


if __name__ == "__main__":
    unittest.main()

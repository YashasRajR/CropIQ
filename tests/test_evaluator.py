"""
Unit tests for CropIQ Phase 4 Rule Evaluator, Crop Filtering, and Feature Checks.
"""

import unittest
from src.recommendations.evaluator import evaluate_candidate_rules
from src.recommendations.utils import RuleTracer


class TestRuleEvaluator(unittest.TestCase):
    """Test suite for candidate rule evaluation and filtering."""

    def setUp(self):
        self.dummy_rules = [
            {
                "id": "rule_general_water",
                "version": "1.0",
                "enabled": True,
                "category": "WATER",
                "priority": "HIGH",
                "actionability": "ACTIONABLE",
                "supported_crops": [],
                "required_features": ["soil_moisture"],
                "trigger": {
                    "all": [
                        {"feature": "soil_moisture", "operator": "less_than", "value": 0.25}
                    ]
                },
                "title": "General water check",
                "reason": "Soil moisture low",
                "action": "Check irrigation",
                "evidence": [],
                "confidence": "HIGH",
                "source_type": "sourced",
                "source": "FAO 56",
                "limitations": ["Depends on soil type"],
                "what_if_supported": True,
            },
            {
                "id": "rule_rice_only",
                "version": "1.0",
                "enabled": True,
                "category": "CROP",
                "priority": "HIGH",
                "actionability": "ACTIONABLE",
                "supported_crops": ["Rice"],
                "required_features": ["soil_moisture"],
                "trigger": {
                    "all": [
                        {"feature": "soil_moisture", "operator": "less_than", "value": 0.30}
                    ]
                },
                "title": "Rice specific water check",
                "reason": "Rice water low",
                "action": "Check paddy bunds",
                "evidence": [],
                "confidence": "HIGH",
                "source_type": "sourced",
                "source": "ICAR NRRI",
                "limitations": ["Varietal difference"],
                "what_if_supported": True,
            },
            {
                "id": "rule_wheat_only",
                "version": "1.0",
                "enabled": True,
                "category": "CROP",
                "priority": "HIGH",
                "actionability": "ACTIONABLE",
                "supported_crops": ["Wheat"],
                "required_features": ["temperature"],
                "trigger": {
                    "all": [
                        {"feature": "temperature", "operator": "greater_than", "value": 25.0}
                    ]
                },
                "title": "Wheat heat stress",
                "reason": "Wheat heat",
                "action": "Check canopy",
                "evidence": [],
                "confidence": "HIGH",
                "source_type": "sourced",
                "source": "CIMMYT",
                "limitations": ["Anthesis vs vegetative"],
                "what_if_supported": False,
            },
            {
                "id": "rule_disabled",
                "version": "1.0",
                "enabled": False,
                "category": "GENERAL",
                "priority": "LOW",
                "actionability": "INFORMATIONAL",
                "supported_crops": [],
                "required_features": [],
                "trigger": {},
                "title": "Disabled rule",
                "reason": "Disabled",
                "action": "None",
                "evidence": [],
                "confidence": "LOW",
                "source_type": "prototype_heuristic",
                "source": None,
                "limitations": [],
                "what_if_supported": False,
            },
            {
                "id": "rule_needs_missing_feature",
                "version": "1.0",
                "enabled": True,
                "category": "SOIL",
                "priority": "LOW",
                "actionability": "MONITOR",
                "supported_crops": [],
                "required_features": ["nitrogen_sensor_reading"],
                "trigger": {
                    "all": [
                        {"feature": "nitrogen_sensor_reading", "operator": "less_than", "value": 10.0}
                    ]
                },
                "title": "Nitrogen check",
                "reason": "Low N",
                "action": "Test soil",
                "evidence": [],
                "confidence": "LOW",
                "source_type": "prototype_heuristic",
                "source": None,
                "limitations": [],
                "what_if_supported": False,
            },
        ]

        self.payload = {
            "prediction": {"yield": 35.0, "unit": "unconfirmed"},
            "explanation": {"all_contributions": []},
            "context": {"crop": "Rice", "reference_median": 45.0},
            "risk": {"level": "LOW", "score": 25},
            "uncertainty": {"classification": "LOW"},
            "data_quality": {"warnings": [], "out_of_distribution": False, "extrapolation_warning": False},
        }

    def test_crop_filtering_and_matching(self):
        tracer = RuleTracer()
        input_data = {
            "crop_type": "Rice",
            "soil_moisture": 0.20,
            "temperature": 28.0,
        }
        candidates = evaluate_candidate_rules(
            intelligence_payload=self.payload,
            input_data=input_data,
            rules=self.dummy_rules,
            tracer=tracer,
        )

        matched_ids = [c["id"] for c in candidates]
        # General water rule should match
        self.assertIn("rule_general_water", matched_ids)
        # Rice rule should match
        self.assertIn("rule_rice_only", matched_ids)
        # Wheat rule should be filtered out by crop filter
        self.assertNotIn("rule_wheat_only", matched_ids)
        # Disabled rule should be skipped
        self.assertNotIn("rule_disabled", matched_ids)
        # Rule with missing feature should be skipped
        self.assertNotIn("rule_needs_missing_feature", matched_ids)

        # Check tracer logs
        log_statuses = {l["rule_id"]: l["status"] for l in tracer.get_logs()}
        self.assertEqual(log_statuses["rule_wheat_only"], "SKIPPED_CROP")
        self.assertEqual(log_statuses["rule_disabled"], "DISABLED")
        self.assertEqual(log_statuses["rule_needs_missing_feature"], "SKIPPED_FEATURE")

    def test_unsupported_crop_fallback(self):
        tracer = RuleTracer()
        input_data = {
            "crop_type": "Quinoa",  # Unsupported / unfamiliar crop
            "soil_moisture": 0.20,
            "temperature": 28.0,
        }
        candidates = evaluate_candidate_rules(
            intelligence_payload=self.payload,
            input_data=input_data,
            rules=self.dummy_rules,
            tracer=tracer,
        )
        matched_ids = [c["id"] for c in candidates]
        # General water rule still applies
        self.assertIn("rule_general_water", matched_ids)
        # Crop-specific rules do not apply
        self.assertNotIn("rule_rice_only", matched_ids)
        self.assertNotIn("rule_wheat_only", matched_ids)


if __name__ == "__main__":
    unittest.main()

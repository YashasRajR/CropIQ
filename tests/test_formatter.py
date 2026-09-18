"""
Unit tests for CropIQ Phase 4 Formatter (Farmer & Technical Modes, Executive Summary).
"""

import unittest
from src.recommendations.formatter import (
    format_recommendation_farmer_mode,
    format_recommendation_technical_mode,
    generate_executive_summary,
)


class TestFormatter(unittest.TestCase):
    """Test suite for recommendation presentation formatting."""

    def setUp(self):
        self.raw_candidate = {
            "id": "water_001",
            "version": "1.0",
            "category": "WATER",
            "priority": "HIGH",
            "priority_score": 82,
            "actionability": "ACTIONABLE",
            "title": "Review soil moisture and irrigation needs",
            "reason": "Soil moisture is below typical reference levels and contributed negatively to the model prediction.",
            "action": "Check root-zone moisture conditions and evaluate whether supplemental irrigation is needed.",
            "evidence": [
                {
                    "type": "negative_model_contribution",
                    "feature": "soil_moisture",
                    "contribution": -1.25,
                    "observed": 0.22,
                }
            ],
            "evidence_strength": "HIGH",
            "confidence": "HIGH",
            "source_type": "sourced",
            "source": "FAO 56",
            "limitations": [
                "Actual irrigation requirements depend on crop growth stage.",
            ],
            "what_if_supported": True,
            "trigger_spec": {"all": []},
        }

        self.payload = {
            "prediction": {"yield": 38.5, "unit": "unconfirmed"},
            "context": {"crop": "Rice"},
            "risk": {"level": "MODERATE", "score": 52},
            "uncertainty": {"classification": "MODERATE"},
        }

    def test_farmer_mode_formatting(self):
        farmer_view = format_recommendation_farmer_mode(self.raw_candidate)
        required_keys = [
            "id",
            "title",
            "category",
            "priority",
            "actionability",
            "summary",
            "reason",
            "action",
            "evidence",
            "confidence",
            "limitations",
            "what_if_supported",
        ]
        for k in required_keys:
            self.assertIn(k, farmer_view)
        # Evidence should be formatted as clean string bullets
        self.assertIsInstance(farmer_view["evidence"], list)
        self.assertTrue(len(farmer_view["evidence"]) >= 1)
        self.assertIsInstance(farmer_view["evidence"][0], str)
        self.assertIn("Soil Moisture", farmer_view["evidence"][0])

    def test_technical_mode_formatting(self):
        tech_view = format_recommendation_technical_mode(self.raw_candidate)
        # Includes all farmer fields plus audit fields
        self.assertEqual(tech_view["priority_score"], 82)
        self.assertEqual(tech_view["source"], "FAO 56")
        self.assertEqual(tech_view["source_type"], "sourced")
        self.assertIn("raw_evidence", tech_view)

    def test_executive_summary_synthesis(self):
        recs = [format_recommendation_farmer_mode(self.raw_candidate)]
        summary = generate_executive_summary(recs, self.payload)
        self.assertIn("Rice", summary)
        self.assertIn("38.50", summary)
        self.assertIn("moderate", summary.lower())
        self.assertIn("irrigation", summary.lower())
        # Check non-empty coherent length
        self.assertTrue(len(summary) > 50)


if __name__ == "__main__":
    unittest.main()

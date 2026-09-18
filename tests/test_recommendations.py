"""
End-to-end integration tests for CropIQ Phase 4 Recommendation Engine across 9 key scenarios.
"""

import unittest
import pandas as pd

from src.intelligence import analyze_crop_prediction
from src.recommendations import generate_recommendations


class TestRecommendationEngineScenarios(unittest.TestCase):
    """Test suite covering the 9 required demonstration and edge-case scenarios."""

    @classmethod
    def setUpClass(cls):
        df = pd.read_csv("data/processed/crop_yield_model_data.csv")
        # Base realistic sample
        cls.base_row = df.iloc[0].to_dict()
        cls.base_row.pop("yield", None)

    def test_scenario_1_normal_conditions(self):
        """Scenario 1: Balanced, favorable farm conditions."""
        sample = self.base_row.copy()
        sample["soil_moisture"] = 28.0
        sample["NDVI"] = 0.70
        sample["rainfall"] = 15.0
        sample["temperature"] = 24.0

        p3 = analyze_crop_prediction(sample)
        p4 = generate_recommendations(intelligence_payload=p3, input_data=sample)

        self.assertIn("summary", p4)
        self.assertIn("recommendations", p4)
        # Normal favorable conditions should have zero or minimal HIGH priority urgent actions
        self.assertLessEqual(p4["summary"]["high_priority"], 1)

    def test_scenario_2_low_soil_moisture(self):
        """Scenario 2: Low soil moisture triggering actionable water recommendation."""
        sample = self.base_row.copy()
        sample["soil_moisture"] = 12.0

        p3 = analyze_crop_prediction(sample)
        p4 = generate_recommendations(intelligence_payload=p3, input_data=sample)

        rec_categories = [r["category"] for r in p4["recommendations"]]
        self.assertTrue(
            "WATER" in rec_categories or "CROP" in rec_categories,
            f"Expected WATER or CROP recommendation, got: {rec_categories}",
        )
        water_rec = next(r for r in p4["recommendations"] if r["category"] in ("WATER", "CROP"))
        self.assertEqual(water_rec["actionability"], "ACTIONABLE")
        self.assertTrue(water_rec["what_if_supported"])

    def test_scenario_3_negative_vegetation_trend(self):
        """Scenario 3: Depressed NDVI triggering vegetation monitoring recommendation."""
        sample = self.base_row.copy()
        sample["NDVI"] = 0.28
        sample["GNDVI"] = 0.25
        sample["SAVI"] = 0.20

        p3 = analyze_crop_prediction(sample)
        p4 = generate_recommendations(intelligence_payload=p3, input_data=sample)

        rec_categories = [r["category"] for r in p4["recommendations"]]
        self.assertIn("VEGETATION", rec_categories)
        veg_rec = next(r for r in p4["recommendations"] if r["category"] == "VEGETATION")
        self.assertEqual(veg_rec["actionability"], "MONITOR")
        self.assertFalse(veg_rec["what_if_supported"])

    def test_scenario_4_high_yield_risk(self):
        """Scenario 4: Severe deficit triggering high yield risk recommendations."""
        sample = self.base_row.copy()
        # Create severe adverse conditions to trigger high risk
        sample["NDVI"] = 0.15
        sample["soil_moisture"] = 8.0
        sample["rainfall"] = 0.0
        sample["temperature"] = 42.0

        p3 = analyze_crop_prediction(sample)
        p4 = generate_recommendations(intelligence_payload=p3, input_data=sample)

        self.assertGreaterEqual(p4["summary"]["high_priority"], 1)
        titles = [r["title"].lower() for r in p4["recommendations"]]
        self.assertTrue(
            any("risk" in t or "moisture" in t or "heat" in t for t in titles),
            f"Expected risk or stress alert in titles: {titles}",
        )

    def test_scenario_5_high_uncertainty(self):
        """Scenario 5: High tree variance triggering cautious verification recommendation."""
        sample = self.base_row.copy()
        p3 = analyze_crop_prediction(sample)
        # Mock high uncertainty to test trigger behavior directly
        p3["uncertainty"]["classification"] = "HIGH"
        p3["uncertainty"]["relative_uncertainty"] = 0.35

        p4 = generate_recommendations(intelligence_payload=p3, input_data=sample)

        titles = [r["title"].lower() for r in p4["recommendations"]]
        self.assertTrue(
            any("uncertainty" in t or "verify" in t for t in titles),
            f"Expected uncertainty or verification recommendation, got: {titles}",
        )

    def test_scenario_6_out_of_distribution(self):
        """Scenario 6: Out-of-distribution input generating data reliability alert."""
        sample = self.base_row.copy()
        # Outlandish temperature and rainfall
        sample["temperature"] = 75.0
        sample["rainfall"] = 650.0

        p3 = analyze_crop_prediction(sample)
        p4 = generate_recommendations(intelligence_payload=p3, input_data=sample)

        rec_categories = [r["category"] for r in p4["recommendations"]]
        self.assertIn("DATA_QUALITY", rec_categories)

    def test_scenario_7_missing_rainfall_data(self):
        """Scenario 7: Input with missing rainfall triggering data collection recommendation."""
        sample = self.base_row.copy()
        sample["rainfall"] = None  # Missing

        p3 = analyze_crop_prediction(sample)
        p4 = generate_recommendations(intelligence_payload=p3, input_data=sample)

        rec_categories = [r["category"] for r in p4["recommendations"]]
        self.assertIn("DATA_QUALITY", rec_categories)

    def test_scenario_8_unsupported_crop(self):
        """Scenario 8: Novel / unsupported crop falling back gracefully without failure."""
        sample = self.base_row.copy()
        sample["crop_type"] = "Dragonfruit"

        p3 = analyze_crop_prediction(sample)
        p4 = generate_recommendations(intelligence_payload=p3, input_data=sample)

        self.assertFalse(p4["summary"]["crop_specific_recommendations_available"])
        self.assertTrue(len(p4["recommendations"]) > 0)
        # Check no crop-specific recommendation erroneously applied
        for rec in p4["recommendations"]:
            self.assertNotEqual(rec.get("category"), "CROP")

    def test_scenario_9_conflicting_triggers(self):
        """Scenario 9: Conflicting signals triggering clean conflict resolution."""
        sample = self.base_row.copy()
        # Contradictory: very low moisture but high rainfall
        sample["soil_moisture"] = 10.0
        sample["rainfall"] = 45.0

        p3 = analyze_crop_prediction(sample)
        p4 = generate_recommendations(intelligence_payload=p3, input_data=sample)

        # Confirm conflict resolution logged and no mutually contradictory advice displayed
        titles = [r["title"].lower() for r in p4["recommendations"]]
        # Shouldn't show both "avoid over-irrigation" and "review irrigation needs"
        has_over_irr = any("over-irrigation" in t for t in titles)
        has_deficit = any("moisture" in t and "review" in t for t in titles)
        self.assertFalse(has_over_irr and has_deficit)


if __name__ == "__main__":
    unittest.main()

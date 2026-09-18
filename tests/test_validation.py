"""
CropIQ Phase 3 - Validation & End-to-End Contract Unit Tests
Tests complete analyze_crop_prediction response contract, schema validation,
missing inputs, unknown crops, and out-of-distribution warnings.
"""

import unittest
from pathlib import Path

from src.intelligence import analyze_crop_prediction
from src.intelligence.validation import validate_intelligence_output
from src.ml.utils import PREDICTIVE_FEATURES, load_model_data


class TestIntelligenceValidation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.df = load_model_data()
        cls.normal_input = cls.df[PREDICTIVE_FEATURES].iloc[0].to_dict()

    def test_01_full_response_contract_schema(self):
        """Verify analyze_crop_prediction returns all required top-level contract keys."""
        res = analyze_crop_prediction(self.normal_input)
        is_valid, issues = validate_intelligence_output(res)
        self.assertTrue(is_valid, f"Validation issues: {issues}")

        self.assertIn("prediction", res)
        self.assertIn("context", res)
        self.assertIn("explanation", res)
        self.assertIn("uncertainty", res)
        self.assertIn("risk", res)
        self.assertIn("data_quality", res)
        self.assertIn("insights", res)

    def test_02_insights_layers_complete(self):
        """Verify deterministic natural language insights contain all 3 layers."""
        res = analyze_crop_prediction(self.normal_input)
        insights = res["insights"]
        self.assertIn("layer_1_summary", insights)
        self.assertIn("layer_2_key_factors", insights)
        self.assertIn("layer_3_detailed_explanation", insights)

        self.assertGreater(len(insights["layer_1_summary"]), 10)
        self.assertIn("positive_factors", insights["layer_2_key_factors"])
        self.assertIn("negative_factors", insights["layer_2_key_factors"])
        self.assertGreater(len(insights["layer_3_detailed_explanation"]), 50)

    def test_03_missing_feature_raises_error(self):
        """Verify missing feature is rejected before inference."""
        bad_input = dict(self.normal_input)
        del bad_input["rainfall"]
        with self.assertRaises(ValueError):
            analyze_crop_prediction(bad_input)

    def test_04_target_presence_raises_error(self):
        """Verify target column in input is strictly rejected (leakage prevention)."""
        bad_input = dict(self.normal_input)
        bad_input["yield"] = 45.0
        with self.assertRaises(ValueError):
            analyze_crop_prediction(bad_input)

    def test_05_unknown_crop_handling(self):
        """Verify unseen crop types emit a warning and execute safely."""
        unseen_input = dict(self.normal_input)
        unseen_input["crop_type"] = "Blueberry"
        res = analyze_crop_prediction(unseen_input)
        self.assertIn("warnings", res["data_quality"])
        self.assertTrue(any("Blueberry" in w for w in res["data_quality"]["warnings"]))
        self.assertGreater(res["prediction"]["yield"], 0)

    def test_06_out_of_distribution_input_warning(self):
        """Verify extreme values trigger OOD warnings without throwing exceptions."""
        extreme_input = dict(self.normal_input)
        extreme_input["rainfall"] = 999.0  # extreme rainfall
        extreme_input["temperature"] = 75.0  # extreme temperature
        res = analyze_crop_prediction(extreme_input)
        self.assertTrue(res["data_quality"]["out_of_distribution"])
        self.assertTrue(res["data_quality"]["extrapolation_warning"])
        self.assertGreaterEqual(res["risk"]["score"], 40)


if __name__ == "__main__":
    unittest.main()

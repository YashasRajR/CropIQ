"""
Unit tests for CropIQ Phase 5 1D Feature Sensitivity Analysis.
Tests sensitivity grid generation, holding other inputs fixed, and non-causal disclaimers.
"""

import unittest
import pandas as pd

from src.simulator import compute_feature_sensitivity, ScenarioValidationError


class TestFeatureSensitivity(unittest.TestCase):
    """Test suite for 1D model sensitivity analysis."""

    @classmethod
    def setUpClass(cls):
        df = pd.read_csv("data/processed/crop_yield_model_data.csv")
        cls.sample = df.iloc[0].to_dict()
        cls.sample.pop("yield", None)

    def test_01_sensitivity_curve_generation(self):
        """Test sensitivity curve generation for soil_moisture."""
        sens = compute_feature_sensitivity(
            current_input=self.sample,
            feature_name="soil_moisture",
            num_points=6,
        )
        self.assertEqual(sens["feature"], "soil_moisture")
        self.assertIn("points", sens)
        self.assertEqual(len(sens["points"]), 6)
        self.assertIn("disclaimer", sens)
        self.assertIn("not a physical crop response curve", sens["disclaimer"])

        # Check point structure
        p0 = sens["points"][0]
        self.assertIn("feature_value", p0)
        self.assertIn("predicted_yield", p0)
        self.assertIn("difference", p0)

    def test_02_unknown_feature_sensitivity_rejection(self):
        """Test rejection when computing sensitivity for an unregistered feature."""
        with self.assertRaises(ScenarioValidationError):
            compute_feature_sensitivity(self.sample, "non_existent_feature_xyz")


if __name__ == "__main__":
    unittest.main()

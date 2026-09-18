"""
Unit tests for CropIQ Phase 5 Scenario Comparison Engine.
Tests absolute differences, percentage changes, zero-baseline safeguards,
and MAE-grounded materiality thresholds.
"""

import unittest
from src.simulator import compare_scenarios


class TestScenarioComparison(unittest.TestCase):
    """Test suite for scenario comparison, materiality, and diffs."""

    def setUp(self):
        self.current_input = {"soil_moisture": 25.0, "temperature": 22.0}
        self.scenario_input = {"soil_moisture": 35.0, "temperature": 22.0}
        self.changed_features = {"soil_moisture": 35.0}

    def test_01_material_increase(self):
        """Test calculation of material positive difference exceeding MAE threshold."""
        comp = compare_scenarios(
            baseline_yield=40.0,
            scenario_yield=42.5,
            current_input=self.current_input,
            scenario_input=self.scenario_input,
            changed_features=self.changed_features,
            material_threshold=0.9765,
        )
        self.assertAlmostEqual(comp["absolute_change"], 2.5, places=4)
        self.assertAlmostEqual(comp["percentage_change"], 6.25, places=2)
        self.assertEqual(comp["direction"], "increase")
        self.assertTrue(comp["is_material"])
        self.assertIn("soil_moisture", comp["feature_diffs"])
        self.assertEqual(comp["feature_diffs"]["soil_moisture"]["difference"], 10.0)

    def test_02_non_material_fluctuation(self):
        """Test small changes below validation MAE are classified as non-material."""
        comp = compare_scenarios(
            baseline_yield=40.0,
            scenario_yield=40.3,  # Diff = 0.3 < 0.9765 MAE
            current_input=self.current_input,
            scenario_input=self.scenario_input,
            changed_features=self.changed_features,
            material_threshold=0.9765,
        )
        self.assertAlmostEqual(comp["absolute_change"], 0.3, places=4)
        self.assertFalse(comp["is_material"])
        self.assertEqual(comp["direction"], "no_material_change")
        self.assertEqual(comp["materiality_label"], "small model-estimated difference")

    def test_03_zero_baseline_safeguard(self):
        """Test zero baseline handles percentage change safely without ZeroDivisionError."""
        comp = compare_scenarios(
            baseline_yield=0.0,
            scenario_yield=5.0,
            current_input=self.current_input,
            scenario_input=self.scenario_input,
            changed_features=self.changed_features,
        )
        self.assertIsNone(comp["percentage_change"])
        self.assertIsNotNone(comp["percentage_explanation"])
        self.assertEqual(comp["absolute_change"], 5.0)


if __name__ == "__main__":
    unittest.main()

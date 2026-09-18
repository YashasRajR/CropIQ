"""
Unit tests for CropIQ Phase 5 Simulator Core Functionality.
Tests baseline consistency, single/multi-variable changes, and reproducibility.
"""

import unittest
import pandas as pd

from src.simulator import simulate_scenario, session_history


class TestSimulatorCore(unittest.TestCase):
    """Test suite for simulate_scenario core behavior."""

    @classmethod
    def setUpClass(cls):
        df = pd.read_csv("data/processed/crop_yield_model_data.csv")
        cls.sample = df.iloc[0].to_dict()
        cls.sample.pop("yield", None)

    def setUp(self):
        session_history.clear()

    def test_01_baseline_consistency(self):
        """Test 1: When no changes are provided, scenario yield equals baseline yield."""
        res = simulate_scenario(self.sample, {})
        base_y = res["baseline"]["predicted_yield"]
        scen_y = res["scenario"]["predicted_yield"]
        self.assertAlmostEqual(base_y, scen_y, places=4)
        self.assertAlmostEqual(res["comparison"]["absolute_change"], 0.0, places=4)
        self.assertEqual(res["comparison"]["direction"], "no_material_change")

    def test_02_single_variable_scenario(self):
        """Test 2: Single-variable modification produces valid prediction, difference, and diffs."""
        res = simulate_scenario(
            self.sample,
            {"soil_moisture": 32.0},
            scenario_name="Elevated Soil Moisture",
        )
        self.assertIn("baseline", res)
        self.assertIn("scenario", res)
        self.assertIn("comparison", res)
        self.assertIn("interpretation", res)
        self.assertFalse(res["interpretation"]["causal_claim"])

        # Check diff dictionary
        diffs = res["comparison"]["feature_diffs"]
        self.assertIn("soil_moisture", diffs)
        self.assertEqual(diffs["soil_moisture"]["scenario"], 32.0)

    def test_03_multi_variable_scenario(self):
        """Test 3: Multi-variable modification updates all changed features and warns on interactions."""
        res = simulate_scenario(
            self.sample,
            {"soil_moisture": 30.0, "rainfall": 15.0},
            scenario_name="Moisture and Rain Scenario",
        )
        self.assertEqual(len(res["scenario"]["changes"]), 2)
        diffs = res["comparison"]["feature_diffs"]
        self.assertIn("soil_moisture", diffs)
        self.assertIn("rainfall", diffs)

        # Multi-variable interaction warning check
        warnings_str = " ".join(res["validation"]["warnings"])
        self.assertIn("multiple inputs were changed together", warnings_str)

    def test_04_scenario_reproducibility(self):
        """Test 4: Simulating identical input and changes produces mathematically identical results."""
        changes = {"soil_moisture": 25.0}
        res1 = simulate_scenario(self.sample, changes)
        res2 = simulate_scenario(self.sample, changes)

        self.assertEqual(res1["scenario"]["predicted_yield"], res2["scenario"]["predicted_yield"])
        self.assertEqual(res1["comparison"]["absolute_change"], res2["comparison"]["absolute_change"])
        self.assertEqual(res1["interpretation"]["summary"], res2["interpretation"]["summary"])

    def test_05_session_history_recording(self):
        """Test 5: Completed scenarios are automatically logged in session history."""
        self.assertEqual(len(session_history.get_history()), 0)
        simulate_scenario(self.sample, {"soil_moisture": 28.0}, scenario_name="History Test")
        history = session_history.get_history()
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]["name"], "History Test")
        self.assertIn("soil_moisture", history[0]["changes"])


if __name__ == "__main__":
    unittest.main()

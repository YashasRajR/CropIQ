"""
Unit tests for CropIQ Phase 5 Scenario Presets, Batch Simulation, and Reset.
"""

import unittest
import pandas as pd

from src.simulator import (
    create_preset_scenario,
    reset_scenario,
    simulate_multiple_scenarios,
    PRESET_DEFINITIONS,
)


class TestScenarioManagement(unittest.TestCase):
    """Test suite for presets, multi-scenario comparisons, and reset behavior."""

    @classmethod
    def setUpClass(cls):
        df = pd.read_csv("data/processed/crop_yield_model_data.csv")
        cls.sample = df.iloc[0].to_dict()
        cls.sample.pop("yield", None)

    def test_01_create_presets(self):
        """Test preset generation across defined scenarios."""
        for preset_id in PRESET_DEFINITIONS:
            preset = create_preset_scenario(self.sample, preset_id)
            self.assertIn("name", preset)
            self.assertIn("description", preset)
            self.assertIn("changes", preset)
            self.assertTrue(len(preset["changes"]) > 0)

        # Specifically check moisture preset values
        p_moist = create_preset_scenario(self.sample, "improve_moisture")
        self.assertIn("soil_moisture", p_moist["changes"])
        self.assertGreaterEqual(p_moist["changes"]["soil_moisture"], 25.0)

    def test_02_unknown_preset_rejection(self):
        """Test rejection of non-existent preset types."""
        with self.assertRaises(ValueError):
            create_preset_scenario(self.sample, "non_existent_preset_xyz")

    def test_03_reset_scenario(self):
        """Test scenario reset restores baseline observation."""
        reset_res = reset_scenario(self.sample)
        self.assertEqual(reset_res["status"], "reset")
        self.assertEqual(len(reset_res["changes"]), 0)
        self.assertEqual(reset_res["current_input"], self.sample)

    def test_04_simulate_multiple_scenarios(self):
        """Test batch simulation of multiple named scenarios and comparative ranking."""
        scenarios = [
            create_preset_scenario(self.sample, "improve_moisture"),
            create_preset_scenario(self.sample, "drought_stress"),
            create_preset_scenario(self.sample, "elevated_temperature"),
        ]
        batch_res = simulate_multiple_scenarios(self.sample, scenarios)
        self.assertEqual(batch_res["total_scenarios"], 3)
        self.assertIn("comparative_summary", batch_res)
        self.assertIn("scenarios_ranked", batch_res)

        ranked = batch_res["scenarios_ranked"]
        self.assertEqual(len(ranked), 3)
        # Check sorting by estimated yield descending
        self.assertGreaterEqual(ranked[0]["scenario_yield"], ranked[1]["scenario_yield"])
        self.assertGreaterEqual(ranked[1]["scenario_yield"], ranked[2]["scenario_yield"])


if __name__ == "__main__":
    unittest.main()

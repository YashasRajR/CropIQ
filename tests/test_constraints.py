"""
Unit tests for CropIQ Phase 5 Scenario Constraints and Feature Dependencies.
"""

import unittest
import copy
import pandas as pd

from src.simulator import apply_scenario_constraints, simulate_scenario


class TestScenarioConstraints(unittest.TestCase):
    """Test suite for immutability, interaction warnings, and co-variation checks."""

    @classmethod
    def setUpClass(cls):
        df = pd.read_csv("data/processed/crop_yield_model_data.csv")
        cls.sample = df.iloc[0].to_dict()
        cls.sample.pop("yield", None)

    def test_01_input_immutability(self):
        """Test strict immutability: baseline input is never mutated in-place."""
        original_copy = copy.deepcopy(self.sample)
        original_moisture = self.sample["soil_moisture"]

        # Run scenario modifying moisture
        simulate_scenario(self.sample, {"soil_moisture": original_moisture + 15.0})

        # Verify baseline sample remains exactly identical
        self.assertEqual(self.sample, original_copy)
        self.assertEqual(self.sample["soil_moisture"], original_moisture)

    def test_02_vegetation_covariation_warning(self):
        """Test vegetation index warning when partial indices are modified."""
        scenario_input, warnings = apply_scenario_constraints(
            current_input=self.sample,
            scenario_changes={"NDVI": 0.65},  # Only NDVI modified, not GNDVI or SAVI
        )
        self.assertEqual(scenario_input["NDVI"], 0.65)
        self.assertTrue(any("Vegetation indices naturally co-vary" in w for w in warnings))

    def test_03_multivariable_interaction_warning(self):
        """Test interaction warning emitted when multiple inputs are changed simultaneously."""
        _, warnings = apply_scenario_constraints(
            current_input=self.sample,
            scenario_changes={"soil_moisture": 30.0, "rainfall": 20.0, "temperature": 25.0},
        )
        self.assertTrue(any("multiple inputs were changed together" in w for w in warnings))


if __name__ == "__main__":
    unittest.main()

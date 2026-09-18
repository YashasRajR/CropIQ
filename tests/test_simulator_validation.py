"""
Unit tests for CropIQ Phase 5 Scenario Input & Change Validation.
Tests target protection, identifier protection, physical bounds, and OOD handling.
"""

import unittest
import pandas as pd

from src.simulator import (
    ScenarioValidationError,
    validate_baseline_input,
    validate_scenario_changes,
)


class TestSimulatorValidation(unittest.TestCase):
    """Test suite for integrity constraints, target protection, and validation."""

    @classmethod
    def setUpClass(cls):
        df = pd.read_csv("data/processed/crop_yield_model_data.csv")
        cls.sample = df.iloc[0].to_dict()
        cls.sample.pop("yield", None)

    def test_01_target_modification_rejection(self):
        """Test rule 65: attempting to modify target 'yield' is strictly rejected."""
        with self.assertRaises(ScenarioValidationError):
            validate_scenario_changes(self.sample, {"yield": 55.0})

    def test_02_identifier_modification_rejection(self):
        """Test rule 66: attempting to modify metadata identifiers is rejected."""
        with self.assertRaises(ScenarioValidationError):
            validate_scenario_changes(self.sample, {"field_id": "field_999"})

    def test_03_crop_type_change_rejection(self):
        """Test rule 67: attempting to change crop_type inside environmental scenario is rejected."""
        with self.assertRaises(ScenarioValidationError):
            validate_scenario_changes(self.sample, {"crop_type": "Wheat"})

    def test_04_unknown_feature_rejection(self):
        """Test rejection of non-existent features."""
        with self.assertRaises(ScenarioValidationError):
            validate_scenario_changes(self.sample, {"fake_unknown_feature": 12.5})

    def test_05_physical_invalidity_rejection(self):
        """Test rule 16, 20: physically impossible values are strictly rejected."""
        # Negative rainfall
        with self.assertRaises(ScenarioValidationError):
            validate_scenario_changes(self.sample, {"rainfall": -5.0})

        # Negative soil moisture
        with self.assertRaises(ScenarioValidationError):
            validate_scenario_changes(self.sample, {"soil_moisture": -2.0})

        # Impossible temperature
        with self.assertRaises(ScenarioValidationError):
            validate_scenario_changes(self.sample, {"temperature": 150.0})

    def test_06_extrapolative_value_warning(self):
        """Test rule 19: physically valid but out-of-training-range values are permitted with warning."""
        # Physical bounds for rainfall are [0, 200]; training max is 93.36.
        # A scenario with rainfall = 120.0 is physically plausible but extrapolative.
        is_valid, validated_changes, warnings = validate_scenario_changes(
            self.sample, {"rainfall": 120.0}
        )
        self.assertTrue(is_valid)
        self.assertIn("rainfall", validated_changes)
        self.assertTrue(any("outside the model's observed training range" in w for w in warnings))


if __name__ == "__main__":
    unittest.main()

"""
Unit tests for ScenarioService.
"""

import unittest
import pandas as pd
from backend.app.schemas.farm import FarmInput
from backend.app.services.model_service import get_model_service
from backend.app.services.scenario_service import ScenarioService


class TestScenarioService(unittest.TestCase):
    """Test suite for ScenarioService."""

    @classmethod
    def setUpClass(cls):
        cls.model_service = get_model_service()
        cls.model_service.load()
        cls.scenario_service = ScenarioService(cls.model_service)

        df = pd.read_csv("data/processed/crop_yield_model_data.csv")
        sample = df.iloc[0].to_dict()

        cls.farm_input = FarmInput(
            crop_type=sample.get("crop_type", "Rice"),
            latitude=float(sample.get("latitude", 22.625)),
            longitude=float(sample.get("longitude", 88.498)),
            NDVI=float(sample.get("NDVI", 0.511)),
            GNDVI=float(sample.get("GNDVI", 0.467)),
            NDWI=float(sample.get("NDWI", -0.467)),
            SAVI=float(sample.get("SAVI", 0.767)),
            soil_moisture=float(sample.get("soil_moisture", 21.98)),
            temperature=float(sample.get("temperature", 14.6)),
            rainfall=float(sample.get("rainfall", 17.5)),
        )

    def test_01_simulate_scenario(self):
        """Test simulate with moisture change produces diffs and non-causal interpretation."""
        res = self.scenario_service.simulate(
            current_input=self.farm_input,
            scenario_changes={"soil_moisture": 35.0},
        )
        self.assertIn("baseline", res)
        self.assertIn("scenario", res)
        self.assertIn("comparison", res)
        self.assertFalse(res["interpretation"]["causal_claim"])

    def test_02_sensitivity_service(self):
        """Test sensitivity curve generation."""
        res = self.scenario_service.sensitivity(
            current_input=self.farm_input,
            feature_name="soil_moisture",
            num_points=5,
        )
        self.assertEqual(len(res["points"]), 5)

    def test_03_presets_service(self):
        """Test preset scenarios generation."""
        res = self.scenario_service.presets(current_input=self.farm_input)
        self.assertIn("presets", res)


if __name__ == "__main__":
    unittest.main()

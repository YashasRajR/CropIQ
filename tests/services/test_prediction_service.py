"""
Unit tests for PredictionService.
"""

import unittest
import pandas as pd
from backend.app.schemas.farm import FarmInput
from backend.app.services.model_service import get_model_service
from backend.app.services.prediction_service import PredictionService


class TestPredictionService(unittest.TestCase):
    """Test suite for PredictionService inference logic."""

    @classmethod
    def setUpClass(cls):
        cls.model_service = get_model_service()
        cls.model_service.load()
        cls.pred_service = PredictionService(cls.model_service)

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

    def test_01_predict_returns_valid_yield(self):
        """Test predict method returns expected numeric prediction and unit."""
        result = self.pred_service.predict(self.farm_input)
        self.assertIn("yield", result)
        self.assertIn("unit", result)
        self.assertEqual(result["unit"], "unconfirmed")
        self.assertGreater(result["yield"], 0.0)

    def test_02_predict_preserves_numerical_precision(self):
        """Test raw unrounded prediction is preserved internally."""
        result = self.pred_service.predict(self.farm_input)
        self.assertIn("raw_yield", result)
        self.assertIsInstance(result["raw_yield"], float)


if __name__ == "__main__":
    unittest.main()

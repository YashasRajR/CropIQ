"""
Unit tests for CropIQ POST /risk API endpoint.
"""

import unittest
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app


class TestRiskEndpoint(unittest.TestCase):
    """Test suite for POST /risk."""

    @classmethod
    def setUpClass(cls):
        cls.client_ctx = TestClient(app)
        cls.client = cls.client_ctx.__enter__()

        df = pd.read_csv("data/processed/crop_yield_model_data.csv")
        sample = df.iloc[0].to_dict()

        cls.payload = {
            "crop_type": sample.get("crop_type", "Rice"),
            "latitude": float(sample.get("latitude", 22.625)),
            "longitude": float(sample.get("longitude", 88.498)),
            "NDVI": float(sample.get("NDVI", 0.511)),
            "GNDVI": float(sample.get("GNDVI", 0.467)),
            "NDWI": float(sample.get("NDWI", -0.467)),
            "SAVI": float(sample.get("SAVI", 0.767)),
            "soil_moisture": float(sample.get("soil_moisture", 21.98)),
            "temperature": float(sample.get("temperature", 14.6)),
            "rainfall": float(sample.get("rainfall", 17.5)),
        }

    @classmethod
    def tearDownClass(cls):
        cls.client_ctx.__exit__(None, None, None)

    def test_01_risk_assessment_success(self):
        """Test that /risk returns structured risk tier and drivers."""
        response = self.client.post("/risk", json=self.payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("level", data)
        self.assertIn(data["level"], ["LOW", "MODERATE", "HIGH"])
        self.assertIn("drivers", data)
        self.assertIn("protective_factors", data)
        if data.get("score") is not None:
            self.assertGreaterEqual(data["score"], 0)
            self.assertLessEqual(data["score"], 100)


if __name__ == "__main__":
    unittest.main()

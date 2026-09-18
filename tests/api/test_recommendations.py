"""
Unit tests for CropIQ POST /recommendations API endpoint.
Tests agronomic rule evaluation, prioritization, and formatting modes.
"""

import unittest
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app


class TestRecommendationsEndpoint(unittest.TestCase):
    """Test suite for POST /recommendations."""

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

    def test_01_recommendations_success(self):
        """Test that recommendations return structured actionable items with evidence."""
        response = self.client.post("/recommendations", json=self.payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("summary", data)
        self.assertIn("recommendations", data)
        self.assertIn("total_generated", data["summary"])

        if data["recommendations"]:
            rec = data["recommendations"][0]
            self.assertIn("id", rec)
            self.assertIn("title", rec)
            self.assertIn("category", rec)
            self.assertIn("priority", rec)
            self.assertIn("actionability", rec)
            self.assertIn("action", rec)
            self.assertIn("evidence", rec)
            self.assertIn("confidence", rec)
            self.assertIn("limitations", rec)
            self.assertIn("what_if_supported", rec)

    def test_02_top_n_limiting(self):
        """Test that top_n parameter limits displayed recommendations."""
        response = self.client.post("/recommendations?top_n=2", json=self.payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertLessEqual(len(data["recommendations"]), 2)

    def test_03_technical_mode(self):
        """Test that mode=technical executes and returns recommendations."""
        response = self.client.post("/recommendations?mode=technical", json=self.payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("recommendations", data)


if __name__ == "__main__":
    unittest.main()

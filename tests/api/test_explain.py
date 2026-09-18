"""
Unit tests for CropIQ POST /explain API endpoint.
Tests local feature attributions, fallback mode, and non-causal language safeguards.
"""

import unittest
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app


class TestExplainEndpoint(unittest.TestCase):
    """Test suite for POST /explain."""

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

    def test_01_explain_success(self):
        """Test that /explain returns local feature attributions and non-causal disclaimer."""
        response = self.client.post("/explain", json=self.payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("baseline_yield", data)
        self.assertIn("method", data)
        self.assertIn("top_overall_factors", data)
        self.assertIn("non_causal_statement", data)
        self.assertIn("mathematical model importance", data["non_causal_statement"])

    def test_02_explain_fallback_mode(self):
        """Test that force_fallback=true uses deterministic feature ablation."""
        response = self.client.post("/explain?force_fallback=true", json=self.payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["method"], "Fallback Feature Ablation")
        self.assertIn("top_overall_factors", data)


if __name__ == "__main__":
    unittest.main()

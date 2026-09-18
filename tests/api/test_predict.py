"""
Unit tests for CropIQ POST /predict API endpoint.
Tests inference execution, validation rejections, and prediction determinism.
"""

import unittest
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app


class TestPredictEndpoint(unittest.TestCase):
    """Test suite for POST /predict."""

    @classmethod
    def setUpClass(cls):
        cls.client_ctx = TestClient(app)
        cls.client = cls.client_ctx.__enter__()

        # Load a real valid row from processed dataset
        df = pd.read_csv("data/processed/crop_yield_model_data.csv")
        sample = df.iloc[0].to_dict()
        sample.pop("yield", None)

        cls.valid_payload = {
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
            "field_id": sample.get("field_id", "Field_1"),
            "date_of_image": sample.get("date_of_image", "2023-01-04"),
        }

    @classmethod
    def tearDownClass(cls):
        cls.client_ctx.__exit__(None, None, None)

    def test_01_predict_success(self):
        """Test successful unified prediction with all intelligence components."""
        response = self.client.post("/predict", json=self.valid_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 1. Prediction payload
        self.assertIn("prediction", data)
        pred = data["prediction"]
        self.assertIn("yield", pred)
        self.assertIsInstance(pred["yield"], float)
        self.assertGreater(pred["yield"], 0)
        self.assertEqual(pred["unit"], "unconfirmed")

        # 2. Risk payload
        self.assertIn("risk", data)
        self.assertIn(data["risk"]["level"], ["LOW", "MODERATE", "HIGH"])
        self.assertIn("drivers", data["risk"])

        # 3. Uncertainty payload
        self.assertIn("uncertainty", data)
        self.assertIn(data["uncertainty"]["classification"], ["LOW", "MODERATE", "HIGH"])

        # 4. Explanation payload
        self.assertIn("explanation", data)
        exp = data["explanation"]
        self.assertIn("top_overall_factors", exp)
        self.assertIn("baseline", exp)

        # 5. Recommendations payload
        self.assertIn("recommendations", data)
        self.assertIsInstance(data["recommendations"], list)

        # 6. Metadata
        self.assertIn("metadata", data)
        self.assertEqual(data["metadata"]["target_unit"], "unconfirmed")

    def test_02_predict_determinism(self):
        """Test that identical requests return identical predictions."""
        res1 = self.client.post("/predict", json=self.valid_payload).json()
        res2 = self.client.post("/predict", json=self.valid_payload).json()
        self.assertEqual(res1["prediction"]["yield"], res2["prediction"]["yield"])

    def test_03_missing_required_field(self):
        """Test that omitting a required feature returns HTTP 422."""
        invalid = self.valid_payload.copy()
        invalid.pop("crop_type")
        response = self.client.post("/predict", json=invalid)
        self.assertEqual(response.status_code, 422)
        data = response.json()
        self.assertEqual(data["error"]["code"], "INVALID_INPUT")

    def test_04_wrong_type(self):
        """Test that sending string for numeric feature returns HTTP 422."""
        invalid = self.valid_payload.copy()
        invalid["rainfall"] = "excessive"
        response = self.client.post("/predict", json=invalid)
        self.assertEqual(response.status_code, 422)

    def test_05_negative_rainfall_rejected(self):
        """Test that negative rainfall returns validation error HTTP 422."""
        invalid = self.valid_payload.copy()
        invalid["rainfall"] = -10.0
        response = self.client.post("/predict", json=invalid)
        self.assertEqual(response.status_code, 422)

    def test_06_technical_mode(self):
        """Test that mode=technical formats recommendations in auditable mode."""
        response = self.client.post("/predict?mode=technical", json=self.valid_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("recommendations", data)


if __name__ == "__main__":
    unittest.main()

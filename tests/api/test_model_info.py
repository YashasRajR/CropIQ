"""
Unit tests for CropIQ Model Information and Scenario Metadata endpoints.
"""

import unittest
from fastapi.testclient import TestClient
from backend.app.main import app


class TestModelInfoEndpoint(unittest.TestCase):
    """Test suite for GET /model-info and GET /metadata/scenario-features."""

    @classmethod
    def setUpClass(cls):
        cls.client_ctx = TestClient(app)
        cls.client = cls.client_ctx.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client_ctx.__exit__(None, None, None)

    def test_01_model_info_schema(self):
        """Test that /model-info returns verified metadata and target unit 'unconfirmed'."""
        response = self.client.get("/model-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["project"], "CropIQ")
        self.assertEqual(data["model_name"], "Random Forest")
        self.assertEqual(data["model_type"], "RandomForestRegressor")
        self.assertEqual(data["target"], "yield")
        self.assertEqual(data["target_unit"], "unconfirmed")

        self.assertEqual(len(data["features"]), 30)
        self.assertEqual(data["categorical_features"], ["crop_type"])
        self.assertEqual(len(data["numerical_features"]), 29)

        # Check evaluation metrics
        metrics = data["metrics"]
        self.assertIn("val_mae", metrics)
        self.assertIn("test_mae", metrics)
        self.assertIn("test_r2", metrics)
        self.assertAlmostEqual(metrics["val_mae"], 0.9765, places=3)

    def test_02_scenario_metadata_endpoint(self):
        """Test that /metadata/scenario-features returns slider bounds and classifications."""
        response = self.client.get("/metadata/scenario-features")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("features", data)
        features = data["features"]
        self.assertIn("soil_moisture", features)
        self.assertIn("rainfall", features)
        self.assertIn("temperature", features)

        sm_info = features["soil_moisture"]
        self.assertEqual(sm_info["classification"], "ACTIONABLE_SIMULATABLE")
        self.assertIn("slider", sm_info)
        self.assertIn("min", sm_info["slider"])
        self.assertIn("max", sm_info["slider"])


if __name__ == "__main__":
    unittest.main()

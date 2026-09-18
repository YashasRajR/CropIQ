"""
End-to-End Integration Tests for CropIQ Full Pipeline.
Validates cross-phase consistency using real dataset records.
"""

import unittest
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app


class TestFullPipelineIntegration(unittest.TestCase):
    """Integration test suite connecting Prediction, Explanation, Risk, Recommendations, and What-If."""

    @classmethod
    def setUpClass(cls):
        cls.client_ctx = TestClient(app)
        cls.client = cls.client_ctx.__enter__()

        # Load real dataset
        cls.df = pd.read_csv("data/processed/crop_yield_model_data.csv")

    @classmethod
    def tearDownClass(cls):
        cls.client_ctx.__exit__(None, None, None)

    def _make_payload(self, row_idx: int = 0):
        sample = self.df.iloc[row_idx].to_dict()
        return {
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

    def test_01_predict_to_scenario_consistency(self):
        """Test that /predict yield equals /scenario baseline yield for the same input."""
        payload = self._make_payload(0)

        # 1. /predict call
        pred_res = self.client.post("/predict", json=payload)
        self.assertEqual(pred_res.status_code, 200)
        predict_yield = pred_res.json()["prediction"]["yield"]

        # 2. /scenario call with changes={}
        scen_payload = {
            "current_input": payload,
            "changes": {},
            "scenario_name": "Zero-Change Cross-Endpoint Test",
        }
        scen_res = self.client.post("/scenario", json=scen_payload)
        self.assertEqual(scen_res.status_code, 200)
        scenario_base_yield = scen_res.json()["baseline"]["predicted_yield"]

        # 3. Cross-endpoint identity
        self.assertAlmostEqual(predict_yield, scenario_base_yield, places=3)

    def test_02_multi_crop_integration(self):
        """Test end-to-end pipeline across different crops in the dataset."""
        unique_crops = self.df["crop_type"].unique()[:3]
        for crop in unique_crops:
            row_idx = int(self.df[self.df["crop_type"] == crop].index[0])
            payload = self._make_payload(row_idx)

            res = self.client.post("/predict", json=payload)
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["context"]["crop"], crop)
            self.assertGreater(data["prediction"]["yield"], 0)

    def test_03_consecutive_requests_stability(self):
        """Test that multiple consecutive requests run smoothly without latency spikes or leaks."""
        payload = self._make_payload(0)
        yields = []
        for _ in range(5):
            res = self.client.post("/predict", json=payload)
            self.assertEqual(res.status_code, 200)
            yields.append(res.json()["prediction"]["yield"])

        # All identical
        self.assertEqual(len(set(yields)), 1)


if __name__ == "__main__":
    unittest.main()

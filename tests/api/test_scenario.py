"""
Unit tests for CropIQ What-If Scenario API endpoints.
Tests baseline consistency, single/multi-variable what-if, target protection, and sensitivity.
"""

import unittest
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app


class TestScenarioEndpoints(unittest.TestCase):
    """Test suite for POST /scenario, /scenario/sensitivity, and /scenario/presets."""

    @classmethod
    def setUpClass(cls):
        cls.client_ctx = TestClient(app)
        cls.client = cls.client_ctx.__enter__()

        df = pd.read_csv("data/processed/crop_yield_model_data.csv")
        sample = df.iloc[0].to_dict()

        cls.current_input = {
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

    def test_01_baseline_consistency(self):
        """CRITICAL TEST: changes={} must produce scenario == baseline."""
        payload = {
            "current_input": self.current_input,
            "changes": {},
            "scenario_name": "Zero-Change Baseline Test",
        }
        response = self.client.post("/scenario", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        base_y = data["baseline"]["predicted_yield"]
        scen_y = data["scenario"]["predicted_yield"]
        self.assertAlmostEqual(base_y, scen_y, places=4)
        self.assertAlmostEqual(data["comparison"]["absolute_change"], 0.0, places=4)
        self.assertEqual(data["comparison"]["direction"], "no_material_change")
        self.assertFalse(data["interpretation"]["causal_claim"])

    def test_02_single_variable_scenario(self):
        """Test single-variable modification with comparison and diffs."""
        payload = {
            "current_input": self.current_input,
            "changes": {"soil_moisture": 32.0},
            "scenario_name": "Moisture Adjustment",
        }
        response = self.client.post("/scenario", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("comparison", data)
        self.assertIn("soil_moisture", data["comparison"]["feature_diffs"])
        self.assertEqual(
            data["comparison"]["feature_diffs"]["soil_moisture"]["scenario"],
            32.0,
        )
        self.assertFalse(data["interpretation"]["causal_claim"])

    def test_03_multi_variable_scenario(self):
        """Test multi-variable modification generates interaction caveat warning."""
        payload = {
            "current_input": self.current_input,
            "changes": {"soil_moisture": 30.0, "rainfall": 15.0},
        }
        response = self.client.post("/scenario", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        warnings = data["validation"]["warnings"]
        has_interaction_warning = any("multiple inputs" in w.lower() for w in warnings)
        self.assertTrue(has_interaction_warning)

    def test_04_target_mutation_rejected(self):
        """Test that attempting to modify target 'yield' is strictly rejected."""
        payload = {
            "current_input": self.current_input,
            "changes": {"yield": 50.0},
        }
        response = self.client.post("/scenario", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_05_identifier_mutation_rejected(self):
        """Test that attempting to modify metadata 'field_id' is rejected."""
        payload = {
            "current_input": self.current_input,
            "changes": {"field_id": "Field_999"},
        }
        response = self.client.post("/scenario", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_06_sensitivity_endpoint(self):
        """Test 1D sensitivity curve generation."""
        payload = {
            "current_input": self.current_input,
            "feature": "soil_moisture",
            "num_points": 5,
        }
        response = self.client.post("/scenario/sensitivity", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["feature"], "soil_moisture")
        self.assertEqual(len(data["points"]), 5)
        self.assertIn("disclaimer", data)

    def test_07_presets_endpoint(self):
        """Test generation of empirical scenario presets."""
        payload = {"current_input": self.current_input}
        response = self.client.post("/scenario/presets", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("presets", data)
        self.assertIn("improve_moisture", data["presets"])


if __name__ == "__main__":
    unittest.main()

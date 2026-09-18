"""
CropIQ Phase 3 - Risk Engine Unit Tests
Tests Crop Yield Risk Indicator scoring, level thresholds, component weighting,
and risk driver generation.
"""

import unittest
from pathlib import Path

from src.intelligence.confidence import estimate_prediction_uncertainty
from src.intelligence.explain import explain_prediction
from src.intelligence.risk import (
    RISK_COMPONENT_WEIGHTS,
    RISK_LEVEL_THRESHOLDS,
    compute_yield_risk,
)
from src.ml.predict import load_prediction_model
from src.ml.utils import PREDICTIVE_FEATURES, load_model_data


class TestRiskEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.df = load_model_data()
        cls.pipeline = load_prediction_model()
        cls.sample_row = cls.df[PREDICTIVE_FEATURES].iloc[0].to_dict()
        cls.exp = explain_prediction(cls.sample_row, pipeline=cls.pipeline)
        cls.unc = estimate_prediction_uncertainty(cls.sample_row, pipeline=cls.pipeline)

    def test_01_weights_sum_to_one(self):
        """Verify explicit risk component weights sum to 1.0."""
        total_weight = sum(RISK_COMPONENT_WEIGHTS.values())
        self.assertAlmostEqual(total_weight, 1.0, places=5)

    def test_02_score_bounds_and_levels(self):
        """Verify risk score stays within [0, 100] and risk level matches documented thresholds."""
        res = compute_yield_risk(
            predicted_yield=self.exp["predicted_yield"],
            crop_type="Rice",
            explanation_result=self.exp,
            uncertainty_result=self.unc,
            quality_warnings=[],
        )
        self.assertGreaterEqual(res["risk_score"], 0)
        self.assertLessEqual(res["risk_score"], 100)
        self.assertIn(res["risk_level"], {"LOW", "MODERATE", "HIGH"})

        if res["risk_score"] < RISK_LEVEL_THRESHOLDS["low_max"]:
            self.assertEqual(res["risk_level"], "LOW")
        elif res["risk_score"] < RISK_LEVEL_THRESHOLDS["moderate_max"]:
            self.assertEqual(res["risk_level"], "MODERATE")
        else:
            self.assertEqual(res["risk_level"], "HIGH")

    def test_03_high_yield_reduces_risk(self):
        """Verify a yield well above the crop median yields lower risk score."""
        res_high = compute_yield_risk(
            predicted_yield=65.0,  # well above Rice median (~45)
            crop_type="Rice",
            explanation_result=self.exp,
            uncertainty_result=self.unc,
            quality_warnings=[],
        )
        res_low = compute_yield_risk(
            predicted_yield=25.0,  # well below Rice median (~45)
            crop_type="Rice",
            explanation_result=self.exp,
            uncertainty_result=self.unc,
            quality_warnings=[],
        )
        self.assertLess(res_high["risk_score"], res_low["risk_score"])
        self.assertTrue(any("at or above" in p.lower() for p in res_high["protective_factors"]))

    def test_04_extrapolation_warning_escalates_risk(self):
        """Verify data quality / extrapolation elevates risk score and adds driver."""
        res_normal = compute_yield_risk(
            predicted_yield=45.0,
            crop_type="Rice",
            explanation_result=self.exp,
            uncertainty_result=self.unc,
            quality_warnings=[],
            extrapolation_warning=False,
        )
        res_extrap = compute_yield_risk(
            predicted_yield=45.0,
            crop_type="Rice",
            explanation_result=self.exp,
            uncertainty_result=self.unc,
            quality_warnings=["Extrapolation warning"],
            extrapolation_warning=True,
        )
        self.assertGreater(res_extrap["risk_score"], res_normal["risk_score"])
        self.assertTrue(any("outside what cropiq usually sees" in d.lower() for d in res_extrap["risk_drivers"]))


if __name__ == "__main__":
    unittest.main()

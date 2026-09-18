"""
CropIQ Phase 3 - Explainability Unit Tests
Tests global feature importance, local SHAP explainability, fallback feature ablation,
conservation identity, factor rankings, and one-hot category mapping.
"""

import unittest
from pathlib import Path
import numpy as np
import pandas as pd

from src.intelligence.explain import (
    explain_prediction,
    extract_and_save_global_feature_importance,
)
from src.ml.predict import load_prediction_model
from src.ml.utils import PREDICTIVE_FEATURES, load_model_data


class TestExplainabilityEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.df = load_model_data()
        cls.pipeline = load_prediction_model()
        cls.sample_row = cls.df[PREDICTIVE_FEATURES].iloc[0].to_dict()

    def test_01_global_feature_importance(self):
        """Verify global feature importances are extracted, ranked, and non-empty."""
        global_imp = extract_and_save_global_feature_importance(self.pipeline)
        self.assertEqual(len(global_imp), 30)
        self.assertEqual(global_imp[0]["rank"], 1)
        self.assertGreater(global_imp[0]["importance"], 0)
        self.assertTrue(all("display_name" in x for x in global_imp))

        # Check rainfall is in the top features
        top_features = [x["feature"] for x in global_imp[:3]]
        self.assertIn("rainfall", top_features)

    def test_02_local_explanation_shap(self):
        """Verify local SHAP explanation computes baseline and factor contributions."""
        res = explain_prediction(self.sample_row, pipeline=self.pipeline, force_fallback=False)
        self.assertIn("predicted_yield", res)
        self.assertIn("baseline_yield", res)
        self.assertEqual(res["method"], "SHAP (TreeExplainer)")
        self.assertTrue(res["explanation_identity_verified"])
        self.assertLess(res["identity_discrepancy"], 0.05)
        self.assertEqual(len(res["all_contributions"]), 30)

    def test_03_local_explanation_fallback(self):
        """Verify local fallback feature ablation preserves exact mathematical conservation identity."""
        res = explain_prediction(self.sample_row, pipeline=self.pipeline, force_fallback=True)
        self.assertEqual(res["method"], "Fallback Feature Ablation")
        self.assertTrue(res["explanation_identity_verified"])
        self.assertLess(res["identity_discrepancy"], 0.05)

    def test_04_factor_ranking(self):
        """Verify top positive and negative factors are properly signed and sorted."""
        res = explain_prediction(self.sample_row, pipeline=self.pipeline)
        pos = res["top_positive_factors"]
        neg = res["top_negative_factors"]

        if pos:
            self.assertGreater(pos[0]["contribution"], 0)
            for i in range(len(pos) - 1):
                self.assertGreaterEqual(pos[i]["contribution"], pos[i + 1]["contribution"])

        if neg:
            self.assertLess(neg[0]["contribution"], 0)
            for i in range(len(neg) - 1):
                self.assertLessEqual(neg[i]["contribution"], neg[i + 1]["contribution"])

    def test_05_one_hot_category_consolidation(self):
        """Verify one-hot encoded crop terms are consolidated into a single human-readable feature."""
        res = explain_prediction(self.sample_row, pipeline=self.pipeline)
        crop_entries = [c for c in res["all_contributions"] if c["feature"] == "crop_type"]
        self.assertEqual(len(crop_entries), 1)
        self.assertIn("Rice", crop_entries[0]["display_name"])


if __name__ == "__main__":
    unittest.main()

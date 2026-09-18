"""
CropIQ Phase 3 - Confidence & Uncertainty Unit Tests
Tests prediction interval ordering, ensemble tree dispersion, relative uncertainty,
and classification levels.
"""

import unittest
from pathlib import Path
import numpy as np

from src.intelligence.confidence import estimate_prediction_uncertainty
from src.ml.predict import load_prediction_model
from src.ml.utils import PREDICTIVE_FEATURES, load_model_data


class TestConfidenceEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.df = load_model_data()
        cls.pipeline = load_prediction_model()
        cls.sample_row = cls.df[PREDICTIVE_FEATURES].iloc[0].to_dict()

    def test_01_uncertainty_interval_ordering(self):
        """Verify lower <= estimate <= upper across ensemble decision trees."""
        res = estimate_prediction_uncertainty(self.sample_row, pipeline=self.pipeline)
        self.assertIn("estimate", res)
        self.assertIn("lower", res)
        self.assertIn("upper", res)
        self.assertLessEqual(res["lower"], res["estimate"] + 1e-4)
        self.assertLessEqual(res["estimate"], res["upper"] + 1e-4)

    def test_02_tree_std_positive(self):
        """Verify standard deviation among 300 estimators is positive and finite."""
        res = estimate_prediction_uncertainty(self.sample_row, pipeline=self.pipeline)
        self.assertGreater(res["std"], 0)
        self.assertEqual(res["n_trees_evaluated"], 300)

    def test_03_classification_valid(self):
        """Verify uncertainty classification is one of LOW, MODERATE, HIGH."""
        res = estimate_prediction_uncertainty(self.sample_row, pipeline=self.pipeline)
        self.assertIn(res["classification"], {"LOW", "MODERATE", "HIGH"})

    def test_04_disclaimer_present(self):
        """Verify model-derived proxy disclaimer is present."""
        res = estimate_prediction_uncertainty(self.sample_row, pipeline=self.pipeline)
        self.assertIn("disclaimer", res)
        self.assertIn("not a guaranteed statistical", res["disclaimer"].lower())


if __name__ == "__main__":
    unittest.main()

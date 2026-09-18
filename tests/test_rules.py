"""
Unit tests for CropIQ Phase 4 Condition Evaluators and Composite Logic.
"""

import unittest
from src.recommendations.rules import (
    evaluate_atomic_condition,
    evaluate_composite_condition,
)


class TestRulesEvaluator(unittest.TestCase):
    """Test suite for condition evaluation operators."""

    def setUp(self):
        self.context = {
            "input_data": {
                "crop_type": "Rice",
                "soil_moisture": 0.22,
                "temperature": 32.5,
                "rainfall": 2.0,
                "NDVI": 0.35,
                "NDWI": -0.10,
                "soil_moisture_field_expanding_mean": 0.35,
            },
            "prediction": {
                "yield": 32.0,
                "unit": "unconfirmed",
            },
            "explanation": {
                "all_contributions": [
                    {"feature": "soil_moisture", "contribution": -1.25, "observed_value": 0.22},
                    {"feature": "temperature", "contribution": 0.45, "observed_value": 32.5},
                    {"feature": "rainfall", "contribution": -0.80, "observed_value": 2.0},
                    {"feature": "NDVI", "contribution": -0.60, "observed_value": 0.35},
                ]
            },
            "yield_context": {
                "reference_median": 45.0,
                "reference_q1": 38.0,
                "reference_q3": 52.0,
                "relative_position": "in the lower historical quartile (below 25th percentile)",
            },
            "risk": {
                "level": "HIGH",
                "score": 75,
                "drivers": ["Estimated yield is 28.9% below historical median"],
            },
            "uncertainty": {
                "classification": "HIGH",
                "relative_uncertainty": 0.28,
            },
            "data_quality": {
                "out_of_distribution": False,
                "extrapolation_warning": False,
                "warnings": [],
            },
        }

    def test_numerical_comparisons(self):
        # less_than
        cond = {"feature": "soil_moisture", "operator": "less_than", "value": 0.25}
        matched, ev = evaluate_atomic_condition(cond, self.context)
        self.assertTrue(matched)
        self.assertEqual(ev["type"], "feature_threshold")
        self.assertEqual(ev["comparison"], "<")

        # greater_than
        cond = {"feature": "temperature", "operator": "greater_than", "value": 30.0}
        matched, ev = evaluate_atomic_condition(cond, self.context)
        self.assertTrue(matched)
        self.assertEqual(ev["comparison"], ">")

        # equals
        cond = {"feature": "crop_type", "operator": "equals", "value": "Rice"}
        matched, ev = evaluate_atomic_condition(cond, self.context)
        self.assertTrue(matched)

        # between
        cond = {"feature": "temperature", "operator": "between", "range": [30.0, 35.0]}
        matched, ev = evaluate_atomic_condition(cond, self.context)
        self.assertTrue(matched)

        # outside_range
        cond = {"feature": "rainfall", "operator": "outside_range", "range": [10.0, 50.0]}
        matched, ev = evaluate_atomic_condition(cond, self.context)
        self.assertTrue(matched)

        # less_than_feature with margin
        cond = {
            "feature": "soil_moisture",
            "operator": "less_than_feature",
            "target_feature": "soil_moisture_field_expanding_mean",
            "margin_factor": 0.80,
        }
        matched, ev = evaluate_atomic_condition(cond, self.context)
        self.assertTrue(matched)
        self.assertEqual(ev["type"], "feature_comparison")

    def test_model_contributions(self):
        # negative contribution
        cond = {"feature": "soil_moisture", "operator": "negative_contribution"}
        matched, ev = evaluate_atomic_condition(cond, self.context)
        self.assertTrue(matched)
        self.assertEqual(ev["type"], "negative_model_contribution")
        self.assertEqual(ev["contribution"], -1.25)

        # positive contribution
        cond = {"feature": "temperature", "operator": "positive_contribution"}
        matched, ev = evaluate_atomic_condition(cond, self.context)
        self.assertTrue(matched)
        self.assertEqual(ev["type"], "positive_model_contribution")

        # non-matching positive contribution
        cond = {"feature": "rainfall", "operator": "positive_contribution"}
        matched, ev = evaluate_atomic_condition(cond, self.context)
        self.assertFalse(matched)

    def test_reference_and_system_state(self):
        # below_q1
        cond = {"operator": "relative_to_reference", "value": "below_q1"}
        matched, ev = evaluate_atomic_condition(cond, self.context)
        self.assertTrue(matched)
        self.assertEqual(ev["position"], "below_q1")

        # risk_level_equals
        cond = {"operator": "risk_level_equals", "value": "HIGH"}
        matched, ev = evaluate_atomic_condition(cond, self.context)
        self.assertTrue(matched)

        # uncertainty_level_equals
        cond = {"operator": "uncertainty_level_equals", "value": "HIGH"}
        matched, ev = evaluate_atomic_condition(cond, self.context)
        self.assertTrue(matched)

    def test_composite_conditions(self):
        # AND (all)
        composite_and = {
            "all": [
                {"feature": "soil_moisture", "operator": "less_than", "value": 0.28},
                {"feature": "soil_moisture", "operator": "negative_contribution"},
                {"operator": "risk_level_equals", "value": "HIGH"},
            ]
        }
        matched, ev_list = evaluate_composite_condition(composite_and, self.context)
        self.assertTrue(matched)
        self.assertEqual(len(ev_list), 3)

        # OR (any)
        composite_or = {
            "any": [
                {"feature": "soil_moisture", "operator": "greater_than", "value": 0.50},  # False
                {"feature": "temperature", "operator": "greater_than", "value": 30.0},  # True
            ]
        }
        matched, ev_list = evaluate_composite_condition(composite_or, self.context)
        self.assertTrue(matched)
        self.assertEqual(len(ev_list), 1)

        # NOT (not)
        composite_not = {
            "not": {
                "feature": "crop_type", "operator": "equals", "value": "Wheat"
            }
        }
        matched, ev_list = evaluate_composite_condition(composite_not, self.context)
        self.assertTrue(matched)


if __name__ == "__main__":
    unittest.main()

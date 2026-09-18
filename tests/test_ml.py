"""
CropIQ Phase 2 - ML Engine Verification Suite
Tests data loading, leakage-safe group splitting, pipeline building,
model serialization, prediction inference, and input validation.
"""

import unittest
from pathlib import Path
import sys
import numpy as np
import pandas as pd

# Path setup
REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "src"))

from ml.utils import (
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    PREDICTIVE_FEATURES,
    TARGET_COLUMN,
    TARGET_UNIT,
    build_preprocessor,
    calculate_metrics,
    check_prediction_sanity,
    group_train_val_test_split,
    load_model_data,
)
from ml.predict import predict_yield, validate_input_features


class TestCropIQMLEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.df = load_model_data()

    def test_01_dataset_integrity(self):
        """Verify processed dataset satisfies Phase 1 contract."""
        self.assertEqual(len(self.df), 1625)
        self.assertIn(TARGET_COLUMN, self.df.columns)
        self.assertEqual(self.df[TARGET_COLUMN].isna().sum(), 0)
        self.assertTrue(np.issubdtype(self.df[TARGET_COLUMN].dtype, np.number))

        for feat in PREDICTIVE_FEATURES:
            self.assertIn(feat, self.df.columns)

    def test_02_group_splitting_leakage_free(self):
        """Verify GroupShuffleSplit prevents any field_id leakage across splits."""
        train_df, val_df, test_df = group_train_val_test_split(
            self.df, group_col="field_id", test_size=0.15, val_size=0.15, random_state=42
        )
        train_fields = set(train_df["field_id"])
        val_fields = set(val_df["field_id"])
        test_fields = set(test_df["field_id"])

        self.assertEqual(len(train_fields.intersection(val_fields)), 0)
        self.assertEqual(len(train_fields.intersection(test_fields)), 0)
        self.assertEqual(len(val_fields.intersection(test_fields)), 0)
        self.assertEqual(len(train_fields) + len(val_fields) + len(test_fields), self.df["field_id"].nunique())

    def test_03_preprocessor_pipeline(self):
        """Verify ColumnTransformer handles median imputation and One-Hot encoding."""
        preprocessor = build_preprocessor()
        sample_X = self.df[PREDICTIVE_FEATURES].head(20)
        transformed = preprocessor.fit_transform(sample_X)
        self.assertFalse(np.isnan(transformed).any())
        self.assertGreater(transformed.shape[1], len(PREDICTIVE_FEATURES))

    def test_04_metrics_calculation(self):
        """Verify metric functions calculate expected values."""
        y_true = np.array([40.0, 50.0, 60.0])
        y_pred = np.array([42.0, 48.0, 61.0])
        metrics = calculate_metrics(y_true, y_pred)
        self.assertAlmostEqual(metrics["mae"], 1.6667, places=3)
        self.assertGreater(metrics["r2"], 0.8)

    def test_05_prediction_sanity(self):
        """Verify prediction sanity checker correctly detects anomalies."""
        normal_preds = np.array([35.2, 41.8, 52.0])
        sanity = check_prediction_sanity(normal_preds)
        self.assertFalse(sanity["has_nan"])
        self.assertFalse(sanity["has_inf"])
        self.assertEqual(sanity["negative_predictions"], 0)

    def test_06_target_leakage_rejection(self):
        """Verify predict_yield strictly rejects inputs containing the target column."""
        sample_row = self.df[PREDICTIVE_FEATURES].iloc[0].to_dict()
        sample_row[TARGET_COLUMN] = 42.0  # Attempt target leakage
        with self.assertRaises(ValueError):
            predict_yield(sample_row)

    def test_07_missing_feature_rejection(self):
        """Verify predict_yield rejects inputs missing required predictive features."""
        sample_row = self.df[PREDICTIVE_FEATURES].iloc[0].to_dict()
        del sample_row["NDVI"]
        with self.assertRaises(ValueError):
            predict_yield(sample_row)

    def test_08_predict_yield_single_and_batch(self):
        """Verify predict_yield works for single dictionary and batch DataFrame."""
        sample_row = self.df[PREDICTIVE_FEATURES].iloc[0].to_dict()
        res_single = predict_yield(sample_row)
        self.assertIn("predicted_yield", res_single)
        self.assertEqual(res_single["unit"], TARGET_UNIT)
        self.assertGreater(res_single["predicted_yield"], 0)

        # Batch
        sample_batch = self.df[PREDICTIVE_FEATURES].iloc[:5]
        res_batch = predict_yield(sample_batch)
        self.assertEqual(len(res_batch), 5)
        for item in res_batch:
            self.assertIn("predicted_yield", item)
            self.assertEqual(item["unit"], TARGET_UNIT)

    def test_09_unknown_crop_warning(self):
        """Verify unseen crop types emit a warning but successfully predict."""
        sample_row = self.df[PREDICTIVE_FEATURES].iloc[0].to_dict()
        sample_row["crop_type"] = "Dragonfruit"  # Unseen crop
        res = predict_yield(sample_row)
        self.assertIn("warnings", res)
        self.assertTrue(any("Dragonfruit" in w for w in res["warnings"]))
        self.assertGreater(res["predicted_yield"], 0)

    def test_10_model_metadata_structure(self):
        """Verify model_metadata.json exists, contains all required fields, and non-empty metrics."""
        import json
        from ml.utils import MODELS_DIR
        meta_path = MODELS_DIR / "model_metadata.json"
        self.assertTrue(meta_path.exists())
        with open(meta_path, "r") as f:
            meta = json.load(f)
        self.assertEqual(meta["project"], "CropIQ")
        self.assertEqual(meta["task"], "crop_yield_regression")
        self.assertEqual(meta["target"], TARGET_COLUMN)
        self.assertEqual(meta["target_unit"], TARGET_UNIT)
        self.assertIn("metrics", meta)
        self.assertGreater(meta["metrics"]["test_r2"], 0.8)


if __name__ == "__main__":
    unittest.main()

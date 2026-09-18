"""
CropIQ Phase 2 - Standalone Evaluation Script
Loads serialized model pipeline and evaluates against test data or a custom dataset.
Outputs MAE, RMSE, R², residual statistics, and error analysis.

Usage:
    python src/ml/evaluate.py
    python src/ml/evaluate.py --data path/to/dataset.csv
"""

import argparse
from pathlib import Path
import sys
import joblib
import numpy as np
import pandas as pd

# Local imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from ml.utils import (
    MODELS_DIR,
    PREDICTIVE_FEATURES,
    RANDOM_STATE,
    TARGET_COLUMN,
    TARGET_UNIT,
    calculate_metrics,
    check_prediction_sanity,
    group_train_val_test_split,
    load_model_data,
)


def evaluate_model(
    model_path: Path = MODELS_DIR / "cropiq_yield_model.joblib",
    data_path: Path = None,
):
    print("=" * 65)
    print("CropIQ Phase 2 — Model Evaluation Suite")
    print("=" * 65)

    if not model_path.exists():
        raise FileNotFoundError(f"Trained model not found at {model_path}. Run train.py first.")

    print(f"Loading pipeline from: {model_path}")
    pipeline = joblib.load(model_path)

    if data_path:
        print(f"Loading evaluation dataset from: {data_path}")
        eval_df = load_model_data(data_path)
    else:
        print("Loading default test split from processed dataset...")
        full_df = load_model_data()
        _, _, eval_df = group_train_val_test_split(
            full_df, group_col="field_id", test_size=0.15, val_size=0.15, random_state=RANDOM_STATE
        )

    X = eval_df[PREDICTIVE_FEATURES]
    y = eval_df[TARGET_COLUMN]

    print(f"Evaluation samples: {len(X)} records | Fields: {eval_df['field_id'].nunique()} | Crops: {eval_df['crop_type'].nunique()}")

    preds = pipeline.predict(X)
    metrics = calculate_metrics(y, preds)
    sanity = check_prediction_sanity(preds, y)

    residuals = np.asarray(y) - np.asarray(preds)

    print("\n--- Headline Performance Metrics ---")
    print(f"  MAE:   {metrics['mae']:.4f} {TARGET_UNIT}")
    print(f"  RMSE:  {metrics['rmse']:.4f} {TARGET_UNIT}")
    print(f"  R²:    {metrics['r2']:.4f}")
    if metrics["mape"]:
        print(f"  MAPE:  {metrics['mape']:.2f}%")

    print("\n--- Prediction Sanity Summary ---")
    print(f"  Sample count match:  {sanity['shape_matches']}")
    print(f"  Has NaN:             {sanity['has_nan']}")
    print(f"  Has Inf:             {sanity['has_inf']}")
    print(f"  Negative yields:     {sanity['negative_predictions']}")
    print(f"  Pred range:          [{sanity['min_pred']:.2f}, {sanity['max_pred']:.2f}]")
    print(f"  Actual range:        [{y.min():.2f}, {y.max():.2f}]")

    print("\n--- Residual Summary ---")
    print(f"  Mean error:          {np.mean(residuals):.4f}")
    print(f"  Median error:        {np.median(residuals):.4f}")
    print(f"  Std error:           {np.std(residuals):.4f}")
    print("=" * 65)

    return metrics


def main():
    parser = argparse.ArgumentParser(description="Evaluate CropIQ Yield Prediction Model")
    parser.add_argument("--model", type=str, default=str(MODELS_DIR / "cropiq_yield_model.joblib"), help="Path to trained model joblib")
    parser.add_argument("--data", type=str, default=None, help="Path to evaluation data CSV")
    args = parser.parse_args()

    evaluate_model(model_path=Path(args.model), data_path=Path(args.data) if args.data else None)


if __name__ == "__main__":
    main()

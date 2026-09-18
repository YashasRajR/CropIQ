"""
CropIQ Phase 2 - Machine Learning Utilities
Provides feature definitions, schema validation, leakage-safe group splitting,
preprocessing pipeline builders, evaluation metrics, and diagnostic utilities.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

# Repository Root & Standard Paths
REPO_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DATA_PATH = REPO_ROOT / "data" / "processed" / "crop_yield_model_data.csv"
MODELS_DIR = REPO_ROOT / "models"
REPORTS_DIR = REPO_ROOT / "reports"

RANDOM_STATE = 42

# Column Role Definitions (derived from Phase 1 data dictionary & preprocessing)
TARGET_COLUMN = "yield"
TARGET_UNIT = "unconfirmed"  # Confirmed in Phase 1: source metadata did not state unit

METADATA_COLUMNS = [
    "field_id",
    "date_of_image",
    "source_dataset",
    "raw_row_index",
    "soil_moisture_flag",
]

CATEGORICAL_FEATURES = ["crop_type"]

HISTORY_METRICS = [
    "NDVI",
    "GNDVI",
    "SAVI",
    "soil_moisture",
    "rainfall",
    "temperature",
]

NUMERICAL_FEATURES = [
    # Geographic
    "latitude",
    "longitude",
    # Satellite / Vegetation
    "NDVI",
    "GNDVI",
    "NDWI",  # Note: exact negation of GNDVI in Dataset 1, kept as documented feature
    "SAVI",
    # Soil & Weather
    "soil_moisture",
    "temperature",
    "rainfall",
    # Temporal & Cyclical
    "year",
    "month",
    "day_of_year",
    "month_sin",
    "month_cos",
    "doy_sin",
    "doy_cos",
    "field_obs_number",
] + [
    f"{col}_field_expanding_mean" for col in HISTORY_METRICS
] + [
    f"{col}_field_expanding_std" for col in HISTORY_METRICS
]

PREDICTIVE_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES


def get_feature_lists() -> Dict[str, List[str]]:
    """Return dictionary of feature lists for documentation and validation."""
    return {
        "target": TARGET_COLUMN,
        "metadata": METADATA_COLUMNS,
        "categorical": CATEGORICAL_FEATURES,
        "numerical": NUMERICAL_FEATURES,
        "all_features": PREDICTIVE_FEATURES,
    }


def load_model_data(data_path: Optional[Union[str, Path]] = None) -> pd.DataFrame:
    """Load and validate the model-ready dataset produced by Phase 1."""
    path = Path(data_path) if data_path else PROCESSED_DATA_PATH
    if not path.exists():
        raise FileNotFoundError(f"Model data file not found at: {path}")

    df = pd.read_csv(path)

    # Schema and Target Validation
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Target column '{TARGET_COLUMN}' missing from dataset.")

    if not np.issubdtype(df[TARGET_COLUMN].dtype, np.number):
        raise TypeError(f"Target column '{TARGET_COLUMN}' must be numeric, got {df[TARGET_COLUMN].dtype}.")

    missing_target_count = df[TARGET_COLUMN].isna().sum()
    if missing_target_count > 0:
        raise ValueError(f"Target column contains {missing_target_count} missing values. Phase 1 rule violated.")

    for col in PREDICTIVE_FEATURES:
        if col not in df.columns:
            raise ValueError(f"Required predictive feature '{col}' missing from dataset.")

    return df


def group_train_val_test_split(
    df: pd.DataFrame,
    group_col: str = "field_id",
    test_size: float = 0.15,
    val_size: float = 0.15,
    random_state: int = RANDOM_STATE,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Split dataset into Train (~70%), Validation (~15%), and Test (~15%)
    strictly grouped by group_col (field_id) to prevent field leakage.

    Guarantees:
    - 0 group overlap between any two splits.
    - Test set is isolated for final evaluation.
    """
    if group_col not in df.columns:
        raise ValueError(f"Group column '{group_col}' missing from DataFrame.")

    # 1. First split: separate Test set (test_size of total groups)
    gss_test = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=random_state)
    train_val_idx, test_idx = next(gss_test.split(df, groups=df[group_col]))

    train_val_df = df.iloc[train_val_idx].copy().reset_index(drop=True)
    test_df = df.iloc[test_idx].copy().reset_index(drop=True)

    # 2. Second split: separate Validation set from train_val
    # Relative validation size within the remaining (1 - test_size) portion:
    relative_val_size = val_size / (1.0 - test_size)
    gss_val = GroupShuffleSplit(n_splits=1, test_size=relative_val_size, random_state=random_state)
    train_idx, val_idx = next(gss_val.split(train_val_df, groups=train_val_df[group_col]))

    train_df = train_val_df.iloc[train_idx].copy().reset_index(drop=True)
    val_df = train_val_df.iloc[val_idx].copy().reset_index(drop=True)

    # Leakage Sanity Check: Ensure mutually disjoint field sets
    train_fields = set(train_df[group_col])
    val_fields = set(val_df[group_col])
    test_fields = set(test_df[group_col])

    assert len(train_fields.intersection(val_fields)) == 0, "Leakage detected: train and val share fields!"
    assert len(train_fields.intersection(test_fields)) == 0, "Leakage detected: train and test share fields!"
    assert len(val_fields.intersection(test_fields)) == 0, "Leakage detected: val and test share fields!"

    return train_df, val_df, test_df


def build_preprocessor(
    numerical_features: Optional[List[str]] = None,
    categorical_features: Optional[List[str]] = None,
) -> ColumnTransformer:
    """
    Build sklearn ColumnTransformer preprocessor:
    - Numerical: median imputation (fit only on training split)
    - Categorical: most_frequent imputation + OneHotEncoder(handle_unknown='ignore')
    No scaling applied for tree-based models (Rule 13).
    """
    num_cols = numerical_features if numerical_features is not None else NUMERICAL_FEATURES
    cat_cols = categorical_features if categorical_features is not None else CATEGORICAL_FEATURES

    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
    ])

    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, num_cols),
            ("cat", cat_pipeline, cat_cols),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )
    return preprocessor


def calculate_metrics(y_true: Union[np.ndarray, pd.Series], y_pred: Union[np.ndarray, pd.Series]) -> Dict[str, float]:
    """
    Calculate regression metrics: MAE, RMSE, R2, and safe MAPE.
    """
    y_true_arr = np.asarray(y_true, dtype=float)
    y_pred_arr = np.asarray(y_pred, dtype=float)

    mae = float(mean_absolute_error(y_true_arr, y_pred_arr))
    rmse = float(np.sqrt(mean_squared_error(y_true_arr, y_pred_arr)))
    r2 = float(r2_score(y_true_arr, y_pred_arr))

    # MAPE calculation: only valid when y_true is strictly positive and bounded away from zero
    if np.all(y_true_arr > 1e-3):
        mape = float(np.mean(np.abs((y_true_arr - y_pred_arr) / y_true_arr)) * 100.0)
    else:
        mape = float("nan")

    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2": round(r2, 4),
        "mape": round(mape, 2) if not np.isnan(mape) else None,
    }


def check_prediction_sanity(
    y_pred: Union[np.ndarray, pd.Series],
    y_true: Optional[Union[np.ndarray, pd.Series]] = None,
) -> Dict[str, Union[int, float, bool]]:
    """
    Perform sanity checks on model predictions:
    - Shape matches truth
    - Zero NaNs
    - Zero infinities
    - Count of negative predictions (physical impossibility flag)
    - Value distribution summary
    """
    pred_arr = np.asarray(y_pred, dtype=float)

    shape_matches = len(pred_arr) == len(y_true) if y_true is not None else True
    has_nan = bool(np.isnan(pred_arr).any())
    has_inf = bool(np.isinf(pred_arr).any())
    negative_count = int((pred_arr < 0).sum())

    return {
        "n_samples": len(pred_arr),
        "shape_matches": shape_matches,
        "has_nan": has_nan,
        "has_inf": has_inf,
        "negative_predictions": negative_count,
        "min_pred": round(float(np.min(pred_arr)), 4),
        "max_pred": round(float(np.max(pred_arr)), 4),
        "mean_pred": round(float(np.mean(pred_arr)), 4),
        "std_pred": round(float(np.std(pred_arr)), 4),
    }


def plot_actual_vs_predicted(
    y_true: Union[np.ndarray, pd.Series],
    y_pred: Union[np.ndarray, pd.Series],
    title: str = "Actual vs Predicted Yield",
    save_path: Optional[Union[str, Path]] = None,
):
    """Plot scatter plot of actual vs predicted values with y=x identity line."""
    plt.figure(figsize=(7, 6))
    sns.scatterplot(x=y_true, y=y_pred, alpha=0.7, color="#2c7bb6", edgecolor="k", s=40)
    
    min_val = min(np.min(y_true), np.min(y_pred)) - 2
    max_val = max(np.max(y_true), np.max(y_pred)) + 2
    plt.plot([min_val, max_val], [min_val, max_val], color="#d7191c", linestyle="--", linewidth=2, label="Identity (y = x)")

    plt.xlabel(f"Actual Yield ({TARGET_UNIT})", fontsize=11)
    plt.ylabel(f"Predicted Yield ({TARGET_UNIT})", fontsize=11)
    plt.title(title, fontsize=13, fontweight="bold")
    plt.xlim(min_val, max_val)
    plt.ylim(min_val, max_val)
    plt.legend()
    plt.grid(True, linestyle=":", alpha=0.6)
    plt.tight_layout()
    if save_path:
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, dpi=300)
    plt.close()


def plot_residuals(
    y_true: Union[np.ndarray, pd.Series],
    y_pred: Union[np.ndarray, pd.Series],
    save_path_dist: Optional[Union[str, Path]] = None,
    save_path_scatter: Optional[Union[str, Path]] = None,
):
    """Plot residual distribution and residuals vs predicted scatter."""
    residuals = np.asarray(y_true) - np.asarray(y_pred)

    # 1. Residuals distribution
    plt.figure(figsize=(7, 5))
    sns.histplot(residuals, kde=True, color="#4daf4a", bins=25, edgecolor="black")
    plt.axvline(0, color="red", linestyle="--", linewidth=1.5, label="Zero Error")
    plt.xlabel(f"Residual (Actual - Predicted) [{TARGET_UNIT}]", fontsize=11)
    plt.ylabel("Count", fontsize=11)
    plt.title("Residuals Distribution", fontsize=13, fontweight="bold")
    plt.legend()
    plt.grid(True, linestyle=":", alpha=0.6)
    plt.tight_layout()
    if save_path_dist:
        Path(save_path_dist).parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path_dist, dpi=300)
    plt.close()

    # 2. Residuals vs Predicted
    plt.figure(figsize=(7, 5))
    sns.scatterplot(x=y_pred, y=residuals, alpha=0.7, color="#984ea3", edgecolor="k", s=40)
    plt.axhline(0, color="red", linestyle="--", linewidth=1.5, label="Zero Error")
    plt.xlabel(f"Predicted Yield [{TARGET_UNIT}]", fontsize=11)
    plt.ylabel(f"Residual (Actual - Predicted) [{TARGET_UNIT}]", fontsize=11)
    plt.title("Residuals vs Predicted Yield", fontsize=13, fontweight="bold")
    plt.legend()
    plt.grid(True, linestyle=":", alpha=0.6)
    plt.tight_layout()
    if save_path_scatter:
        Path(save_path_scatter).parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path_scatter, dpi=300)
    plt.close()


def plot_feature_importance(
    feature_names: List[str],
    importances: Union[np.ndarray, List[float]],
    title: str = "Top Predictive Features",
    save_path: Optional[Union[str, Path]] = None,
    top_n: int = 15,
):
    """Plot horizontal bar chart of top N feature importances."""
    fi_df = pd.DataFrame({"feature": feature_names, "importance": importances})
    fi_df = fi_df.sort_values("importance", ascending=False).head(top_n).iloc[::-1]

    plt.figure(figsize=(9, 6))
    plt.barh(fi_df["feature"], fi_df["importance"], color="#386cb0", edgecolor="black")
    plt.xlabel("Importance", fontsize=11)
    plt.title(title, fontsize=13, fontweight="bold")
    plt.grid(True, linestyle=":", alpha=0.6, axis="x")
    plt.tight_layout()
    if save_path:
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, dpi=300)
    plt.close()


def plot_crop_performance(
    crop_metrics_df: pd.DataFrame,
    save_path: Optional[Union[str, Path]] = None,
):
    """Plot bar chart comparing MAE across crops with sufficient sample sizes."""
    if crop_metrics_df.empty:
        return
    df_sorted = crop_metrics_df.sort_values("mae", ascending=True)

    plt.figure(figsize=(10, max(5, len(df_sorted) * 0.35)))
    plt.barh(df_sorted["crop_type"], df_sorted["mae"], color="#fc8d59", edgecolor="black")
    plt.xlabel(f"MAE ({TARGET_UNIT})", fontsize=11)
    plt.title("Test MAE by Crop Type", fontsize=13, fontweight="bold")
    plt.grid(True, linestyle=":", alpha=0.6, axis="x")
    plt.tight_layout()
    if save_path:
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, dpi=300)
    plt.close()

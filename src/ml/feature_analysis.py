"""
CropIQ Phase 2 - Feature Analysis Module
Extracts and analyzes feature importances (impurity-based and permutation-based)
with proper recovery of one-hot encoded category names.
"""

from typing import Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from sklearn.inspection import permutation_importance
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer


def get_feature_names_from_preprocessor(preprocessor: ColumnTransformer) -> List[str]:
    """
    Recover human-readable feature names from a fitted ColumnTransformer,
    including one-hot encoded categorical feature names.
    """
    try:
        # Modern scikit-learn get_feature_names_out()
        return list(preprocessor.get_feature_names_out())
    except Exception:
        pass

    feature_names = []
    for name, transformer, cols in preprocessor.transformers_:
        if name == "remainder" and transformer == "drop":
            continue
        if hasattr(transformer, "named_steps"):
            # It's a Pipeline
            last_step = list(transformer.named_steps.values())[-1]
            if hasattr(last_step, "get_feature_names_out"):
                feature_names.extend(list(last_step.get_feature_names_out(cols)))
            else:
                feature_names.extend(cols)
        elif hasattr(transformer, "get_feature_names_out"):
            feature_names.extend(list(transformer.get_feature_names_out(cols)))
        else:
            feature_names.extend(cols)
    return feature_names


def get_tree_feature_importances(
    pipeline: Pipeline,
) -> pd.DataFrame:
    """
    Extract MDI (Mean Decrease in Impurity) feature importances from the
    trained regressor within the pipeline.
    """
    preprocessor: ColumnTransformer = pipeline.named_steps["preprocessor"]
    regressor = pipeline.named_steps["model"]

    feature_names = get_feature_names_from_preprocessor(preprocessor)

    if hasattr(regressor, "feature_importances_"):
        importances = regressor.feature_importances_
    else:
        # Some models (e.g. HistGradientBoosting) do not expose feature_importances_ directly
        return pd.DataFrame(columns=["feature", "importance"])

    df_importance = pd.DataFrame({
        "feature": feature_names,
        "importance": importances,
    }).sort_values("importance", ascending=False).reset_index(drop=True)

    return df_importance


def compute_permutation_importance(
    pipeline: Pipeline,
    X_eval: pd.DataFrame,
    y_eval: Union[np.ndarray, pd.Series],
    n_repeats: int = 10,
    random_state: int = 42,
    n_jobs: int = -1,
) -> pd.DataFrame:
    """
    Calculate permutation feature importance on evaluation data.
    More reliable than impurity-based importance for correlated tabular features.
    """
    preprocessor = pipeline.named_steps["preprocessor"]
    feature_names = get_feature_names_from_preprocessor(preprocessor)

    # Note: permutation_importance on the full pipeline shuffles raw input columns in X_eval
    raw_perm = permutation_importance(
        pipeline,
        X_eval,
        y_eval,
        n_repeats=n_repeats,
        random_state=random_state,
        n_jobs=n_jobs,
        scoring="neg_mean_absolute_error",
    )

    df_perm = pd.DataFrame({
        "feature": X_eval.columns,
        "importance_mean": raw_perm.importances_mean,
        "importance_std": raw_perm.importances_std,
    }).sort_values("importance_mean", ascending=False).reset_index(drop=True)

    return df_perm


def group_feature_importances_by_category(
    df_importance: pd.DataFrame,
) -> pd.DataFrame:
    """
    Group feature importances into meaningful domain categories:
    - Weather (rainfall, temperature)
    - Soil Moisture
    - Vegetation Indices (NDVI, GNDVI, NDWI, SAVI)
    - Historical Trends (expanding means and stds)
    - Temporal / Cyclical (month, doy, sin/cos)
    - Geographic (latitude, longitude)
    - Crop Type (crop_type categories)
    """
    def categorize(feature: str) -> str:
        f = feature.lower()
        if "expanding" in f:
            return "Historical Field Trends"
        elif any(w in f for w in ["rainfall", "temperature"]):
            return "Weather"
        elif "soil_moisture" in f:
            return "Soil Moisture"
        elif any(v in f for v in ["ndvi", "gndvi", "ndwi", "savi"]):
            return "Vegetation Indices"
        elif any(t in f for t in ["year", "month", "doy", "day_of_year", "obs_number"]):
            return "Temporal & Phenology"
        elif any(g in f for g in ["lat", "lon"]):
            return "Geographic Coordinates"
        elif "crop" in f:
            return "Crop Type"
        return "Other"

    df_categorized = df_importance.copy()
    col = "importance" if "importance" in df_categorized.columns else "importance_mean"
    df_categorized["category"] = df_categorized["feature"].apply(categorize)

    summary = (
        df_categorized.groupby("category")[col]
        .sum()
        .reset_index()
        .sort_values(col, ascending=False)
        .reset_index(drop=True)
    )
    return summary

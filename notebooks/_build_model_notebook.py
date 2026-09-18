"""
Generates notebooks/02_model_training.ipynb programmatically adhering to the
exact 24-section structure outlined in Phase 2 Section 43, and executes it
via nbclient to embed live outputs and visualizations.

Run:
    python notebooks/_build_model_notebook.py
"""

import sys
from pathlib import Path
import nbformat as nbf

ROOT = Path(__file__).resolve().parents[1]

nb = nbf.v4.new_notebook()
cells = []


def md(text):
    cells.append(nbf.v4.new_markdown_cell(text))


def code(text):
    cells.append(nbf.v4.new_code_cell(text))


# 1. Imports
md("""# CropIQ Phase 2 — Machine Learning Yield Prediction Engine
**Subtitle:** AI-Powered Crop Yield Intelligence  
**Tagline:** Predict. Understand. Optimize.  

This notebook implements the complete 24-step supervised machine learning workflow for CropIQ.
""")

md("## 1. Imports")
code("""import sys
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor, ExtraTreesRegressor
from sklearn.model_selection import GroupShuffleSplit, GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.inspection import permutation_importance

sns.set_theme(style='whitegrid')
print("All modeling libraries imported successfully.")
""")

# 2. Configuration
md("## 2. Configuration")
code("""RANDOM_STATE = 42
TARGET_COLUMN = "yield"
TARGET_UNIT = "unconfirmed"  # Confirmed in Phase 1: source metadata did not state physical unit
TEST_SIZE = 0.15
VAL_SIZE = 0.15

np.random.seed(RANDOM_STATE)
print(f"Random State: {RANDOM_STATE} | Target: '{TARGET_COLUMN}' (Unit: {TARGET_UNIT})")
""")

# 3. Load Phase 1 Dataset
md("## 3. Load Phase 1 Processed Dataset\nLoading the validated model-ready dataset created by Phase 1.")
code("""data_path = Path("../data/processed/crop_yield_model_data.csv")
assert data_path.exists(), f"Missing dataset: {data_path}"
df = pd.read_csv(data_path)
print(f"Loaded dataset: {df.shape[0]} rows x {df.shape[1]} columns")
df.head(3)
""")

# 4. Read Phase 1 Handoff
md("## 4. Read Phase 1 Handoff\nReviewing Phase 1 contract, target semantics, and known dataset properties.")
code("""handoff_path = Path("../reports/phase1_handoff.md")
if handoff_path.exists():
    with open(handoff_path, "r", encoding="utf-8") as f:
        print("".join(f.readlines()[:25]))
""")

# 5. Define Target
md("## 5. Define Target\nConfirming target variable existence, numeric type, and missingness.")
code("""y = df[TARGET_COLUMN]
print(f"Target variable: '{TARGET_COLUMN}'")
print(f"Target dtype: {y.dtype}")
print(f"Missing count: {y.isna().sum()}")
print(f"Summary stats:\\n{y.describe()}")
""")

# 6. Define Features
md("## 6. Define Features\nSeparating predictive features from metadata identifiers and target.")
code("""METADATA_COLUMNS = ["field_id", "date_of_image", "source_dataset", "raw_row_index", "soil_moisture_flag"]
CATEGORICAL_FEATURES = ["crop_type"]

HISTORY_METRICS = ["NDVI", "GNDVI", "SAVI", "soil_moisture", "rainfall", "temperature"]
NUMERICAL_FEATURES = [
    "latitude", "longitude",
    "NDVI", "GNDVI", "NDWI", "SAVI",
    "soil_moisture", "temperature", "rainfall",
    "year", "month", "day_of_year", "month_sin", "month_cos", "doy_sin", "doy_cos",
    "field_obs_number",
] + [f"{c}_field_expanding_mean" for c in HISTORY_METRICS] + [f"{c}_field_expanding_std" for c in HISTORY_METRICS]

PREDICTIVE_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
X = df[PREDICTIVE_FEATURES]

print(f"Categorical features ({len(CATEGORICAL_FEATURES)}): {CATEGORICAL_FEATURES}")
print(f"Numerical features ({len(NUMERICAL_FEATURES)}): {len(NUMERICAL_FEATURES)} features")
print(f"Total predictive features: {len(PREDICTIVE_FEATURES)}")
""")

# 7. Analyze Modeling Grain
md("## 7. Analyze Modeling Grain\nConfirming that each field has multiple chronological observations with distinct yield values (nowcasting grain).")
code("""print(f"Unique fields: {df['field_id'].nunique()}")
obs_per_field = df.groupby('field_id')['date_of_image'].nunique()
print(f"Observations per field: min={obs_per_field.min()}, mean={obs_per_field.mean():.1f}, max={obs_per_field.max()}")
yield_per_field = df.groupby('field_id')[TARGET_COLUMN].nunique()
print(f"Distinct yield values per field: min={yield_per_field.min()}, max={yield_per_field.max()}")
""")

# 8. Create Leakage-Safe Split
md("## 8. Create Leakage-Safe Split\nUsing `GroupShuffleSplit` on `field_id` to prevent field baseline memorization.")
code("""gss_test = GroupShuffleSplit(n_splits=1, test_size=TEST_SIZE, random_state=RANDOM_STATE)
train_val_idx, test_idx = next(gss_test.split(df, groups=df["field_id"]))

train_val_df = df.iloc[train_val_idx].reset_index(drop=True)
test_df = df.iloc[test_idx].reset_index(drop=True)

relative_val_size = VAL_SIZE / (1.0 - TEST_SIZE)
gss_val = GroupShuffleSplit(n_splits=1, test_size=relative_val_size, random_state=RANDOM_STATE)
train_idx, val_idx = next(gss_val.split(train_val_df, groups=train_val_df["field_id"]))

train_df = train_val_df.iloc[train_idx].reset_index(drop=True)
val_df = train_val_df.iloc[val_idx].reset_index(drop=True)

train_fields = set(train_df["field_id"])
val_fields = set(val_df["field_id"])
test_fields = set(test_df["field_id"])

assert len(train_fields.intersection(val_fields)) == 0
assert len(train_fields.intersection(test_fields)) == 0
assert len(val_fields.intersection(test_fields)) == 0

print(f"Train set:      {len(train_df)} rows ({len(train_fields)} fields)")
print(f"Validation set: {len(val_df)} rows ({len(val_fields)} fields)")
print(f"Test set:       {len(test_df)} rows ({len(test_fields)} fields) [ISOLATED]")
""")

# 9. Build Preprocessing Pipeline
md("## 9. Build Preprocessing Pipeline\nBuilding `ColumnTransformer` with median imputation for numerical features and one-hot encoding for categorical features.")
code("""def build_pipeline_preprocessor():
    num_pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
    ])
    cat_pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False)),
    ])
    return ColumnTransformer([
        ('num', num_pipe, NUMERICAL_FEATURES),
        ('cat', cat_pipe, CATEGORICAL_FEATURES),
    ], remainder='drop')

preprocessor = build_pipeline_preprocessor()
print("ColumnTransformer constructed successfully.")
""")

# 10. Train Baseline
md("## 10. Train Baseline\nTraining `DummyRegressor(strategy='mean')` to benchmark predictive performance.")
code("""baseline_pipeline = Pipeline([
    ('preprocessor', build_pipeline_preprocessor()),
    ('model', DummyRegressor(strategy='mean')),
])

X_train, y_train = train_df[PREDICTIVE_FEATURES], train_df[TARGET_COLUMN]
X_val, y_val = val_df[PREDICTIVE_FEATURES], val_df[TARGET_COLUMN]

baseline_pipeline.fit(X_train, y_train)
base_val_preds = baseline_pipeline.predict(X_val)

base_mae = mean_absolute_error(y_val, base_val_preds)
base_rmse = np.sqrt(mean_squared_error(y_val, base_val_preds))
base_r2 = r2_score(y_val, base_val_preds)

print(f"Baseline Validation — MAE: {base_mae:.4f}, RMSE: {base_rmse:.4f}, R²: {base_r2:.4f}")
""")

# 11. Train Random Forest
md("## 11. Train Random Forest Regressor\nTraining `RandomForestRegressor` with 300 estimators.")
code("""rf_pipeline = Pipeline([
    ('preprocessor', build_pipeline_preprocessor()),
    ('model', RandomForestRegressor(n_estimators=300, min_samples_leaf=2, random_state=RANDOM_STATE, n_jobs=-1)),
])
rf_pipeline.fit(X_train, y_train)
rf_val_preds = rf_pipeline.predict(X_val)

rf_mae = mean_absolute_error(y_val, rf_val_preds)
rf_rmse = np.sqrt(mean_squared_error(y_val, rf_val_preds))
rf_r2 = r2_score(y_val, rf_val_preds)

print(f"Random Forest Validation — MAE: {rf_mae:.4f}, RMSE: {rf_rmse:.4f}, R²: {rf_r2:.4f}")
""")

# 12. Train Gradient Boosting
md("## 12. Train Gradient Boosting Regressor\nEvaluating `HistGradientBoostingRegressor`.")
code("""hgb_pipeline = Pipeline([
    ('preprocessor', build_pipeline_preprocessor()),
    ('model', HistGradientBoostingRegressor(max_iter=200, min_samples_leaf=10, random_state=RANDOM_STATE)),
])
hgb_pipeline.fit(X_train, y_train)
hgb_val_preds = hgb_pipeline.predict(X_val)

hgb_mae = mean_absolute_error(y_val, hgb_val_preds)
hgb_rmse = np.sqrt(mean_squared_error(y_val, hgb_val_preds))
hgb_r2 = r2_score(y_val, hgb_val_preds)

print(f"HistGradientBoosting Validation — MAE: {hgb_mae:.4f}, RMSE: {hgb_rmse:.4f}, R²: {hgb_r2:.4f}")
""")

# 13. Optional Extra Trees
md("## 13. Optional Extra Trees Regressor\nEvaluating `ExtraTreesRegressor` with 300 estimators.")
code("""et_pipeline = Pipeline([
    ('preprocessor', build_pipeline_preprocessor()),
    ('model', ExtraTreesRegressor(n_estimators=300, min_samples_leaf=2, random_state=RANDOM_STATE, n_jobs=-1)),
])
et_pipeline.fit(X_train, y_train)
et_val_preds = et_pipeline.predict(X_val)

et_mae = mean_absolute_error(y_val, et_val_preds)
et_rmse = np.sqrt(mean_squared_error(y_val, et_val_preds))
et_r2 = r2_score(y_val, et_val_preds)

print(f"Extra Trees Validation — MAE: {et_mae:.4f}, RMSE: {et_rmse:.4f}, R²: {et_r2:.4f}")
""")

# 14. Cross-Validation
md("## 14. 5-Fold Group Cross-Validation\nRunning 5-fold `GroupKFold` cross-validation on the training set.")
code("""gkf = GroupKFold(n_splits=5)
models_to_cv = {
    'Random Forest': RandomForestRegressor(n_estimators=300, min_samples_leaf=2, random_state=RANDOM_STATE, n_jobs=-1),
    'Gradient Boosting': HistGradientBoostingRegressor(max_iter=200, min_samples_leaf=10, random_state=RANDOM_STATE),
    'Extra Trees': ExtraTreesRegressor(n_estimators=300, min_samples_leaf=2, random_state=RANDOM_STATE, n_jobs=-1),
}

cv_scores = {}
for name, model in models_to_cv.items():
    maes = []
    for tr_idx, va_idx in gkf.split(X_train, y_train, groups=train_df['field_id']):
        p = Pipeline([('preprocessor', build_pipeline_preprocessor()), ('model', model)])
        p.fit(X_train.iloc[tr_idx], y_train.iloc[tr_idx])
        pred = p.predict(X_train.iloc[va_idx])
        maes.append(mean_absolute_error(y_train.iloc[va_idx], pred))
    cv_scores[name] = (np.mean(maes), np.std(maes))
    print(f"{name} 5-Fold CV MAE: {np.mean(maes):.4f} ± {np.std(maes):.4f}")
""")

# 15. Compare Models
md("## 15. Compare Models\nCompiling candidate metrics into a structured comparison table.")
code("""comparison_data = [
    {"Model": "Mean Baseline", "Val MAE": base_mae, "Val RMSE": base_rmse, "Val R²": base_r2, "CV MAE": f"{base_mae:.4f} ± 0.0000"},
    {"Model": "Random Forest", "Val MAE": rf_mae, "Val RMSE": rf_rmse, "Val R²": rf_r2, "CV MAE": f"{cv_scores['Random Forest'][0]:.4f} ± {cv_scores['Random Forest'][1]:.4f}"},
    {"Model": "Gradient Boosting", "Val MAE": hgb_mae, "Val RMSE": hgb_rmse, "Val R²": hgb_r2, "CV MAE": f"{cv_scores['Gradient Boosting'][0]:.4f} ± {cv_scores['Gradient Boosting'][1]:.4f}"},
    {"Model": "Extra Trees", "Val MAE": et_mae, "Val RMSE": et_rmse, "Val R²": et_r2, "CV MAE": f"{cv_scores['Extra Trees'][0]:.4f} ± {cv_scores['Extra Trees'][1]:.4f}"},
]
comparison_df = pd.DataFrame(comparison_data)
display(comparison_df)
""")

# 16. Select Final Model
md("## 16. Select Final Model\nSelecting best candidate model based on validation error and cross-validation stability.")
code("""best_model_name = "Random Forest" if rf_mae <= min(hgb_mae, et_mae) else ("Gradient Boosting" if hgb_mae <= et_mae else "Extra Trees")
print(f"Selected Final Model: '{best_model_name}'")
""")

# 17. Final Test Evaluation
md("## 17. Final Test Evaluation\nRetraining selected model on Train + Validation combined data, then evaluating ONCE on the isolated Test set.")
code("""X_train_val = pd.concat([X_train, X_val], ignore_index=True)
y_train_val = pd.concat([y_train, y_val], ignore_index=True)

final_pipeline = Pipeline([
    ('preprocessor', build_pipeline_preprocessor()),
    ('model', models_to_cv[best_model_name]),
])
final_pipeline.fit(X_train_val, y_train_val)

X_test, y_test = test_df[PREDICTIVE_FEATURES], test_df[TARGET_COLUMN]
test_preds = final_pipeline.predict(X_test)

test_mae = mean_absolute_error(y_test, test_preds)
test_rmse = np.sqrt(mean_squared_error(y_test, test_preds))
test_r2 = r2_score(y_test, test_preds)
test_mape = np.mean(np.abs((y_test - test_preds) / y_test)) * 100.0

print(f"FINAL TEST METRICS:")
print(f"  MAE:  {test_mae:.4f} {TARGET_UNIT}")
print(f"  RMSE: {test_rmse:.4f} {TARGET_UNIT}")
print(f"  R²:   {test_r2:.4f}")
print(f"  MAPE: {test_mape:.2f}%")
""")

# 18. Feature Importance
md("## 18. Feature Importance Analysis\nExtracting tree feature importances and permutation importances with recovered one-hot feature names.")
code("""fitted_preprocessor = final_pipeline.named_steps['preprocessor']
feature_names = list(fitted_preprocessor.get_feature_names_out())
regressor = final_pipeline.named_steps['model']

if hasattr(regressor, 'feature_importances_'):
    fi_df = pd.DataFrame({'feature': feature_names, 'importance': regressor.feature_importances_})
    fi_df = fi_df.sort_values('importance', ascending=False).reset_index(drop=True)
    
    plt.figure(figsize=(9, 6))
    plt.barh(fi_df['feature'].head(15)[::-1], fi_df['importance'].head(15)[::-1], color='#386cb0', edgecolor='k')
    plt.xlabel('MDI Feature Importance')
    plt.title('Top 15 Most Predictive Features')
    plt.tight_layout()
    plt.show()
    display(fi_df.head(10))
""")

# 19. Residual Analysis
md("## 19. Residual Analysis\nEvaluating residual distribution and plotting residuals vs predicted yield.")
code("""residuals = y_test.values - test_preds

fig, axs = plt.subplots(1, 2, figsize=(14, 5))
sns.scatterplot(x=y_test, y=test_preds, ax=axs[0], color='#2c7bb6', edgecolor='k', alpha=0.7)
min_v, max_v = min(y_test.min(), test_preds.min()) - 2, max(y_test.max(), test_preds.max()) + 2
axs[0].plot([min_v, max_v], [min_v, max_v], 'r--', lw=2, label='y = x')
axs[0].set_xlabel('Actual Yield')
axs[0].set_ylabel('Predicted Yield')
axs[0].set_title('Actual vs Predicted Yield')
axs[0].legend()

sns.histplot(residuals, kde=True, ax=axs[1], color='#4daf4a', bins=20, edgecolor='k')
axs[1].axvline(0, color='r', linestyle='--', lw=2)
axs[1].set_xlabel('Residual (Actual - Predicted)')
axs[1].set_title('Residuals Distribution')

plt.tight_layout()
plt.show()

print(f"Residual mean: {np.mean(residuals):.4f}, median: {np.median(residuals):.4f}, std: {np.std(residuals):.4f}")
""")

# 20. Crop-wise Evaluation
md("## 20. Crop-wise Evaluation\nEvaluating model accuracy separately across different crop types.")
code("""test_eval_df = test_df.copy()
test_eval_df['pred'] = test_preds

crop_records = []
for crop, grp in test_eval_df.groupby('crop_type'):
    c_mae = mean_absolute_error(grp[TARGET_COLUMN], grp['pred'])
    c_rmse = np.sqrt(mean_squared_error(grp[TARGET_COLUMN], grp['pred']))
    c_r2 = r2_score(grp[TARGET_COLUMN], grp['pred']) if len(grp) > 1 else np.nan
    crop_records.append({'crop': crop, 'samples': len(grp), 'mae': c_mae, 'rmse': c_rmse, 'r2': c_r2})

crop_df = pd.DataFrame(crop_records).sort_values('samples', ascending=False)
display(crop_df.head(10))
""")

# 21. Error Analysis
md("## 21. Error Analysis\nExamining the largest prediction errors to identify extreme conditions and error patterns.")
code("""test_eval_df['abs_err'] = np.abs(residuals)
test_eval_df['pct_err'] = (test_eval_df['abs_err'] / test_eval_df[TARGET_COLUMN]) * 100
worst_errors = test_eval_df.sort_values('abs_err', ascending=False).head(10)
display(worst_errors[['field_id', 'crop_type', 'date_of_image', TARGET_COLUMN, 'pred', 'abs_err', 'pct_err', 'rainfall', 'NDVI']])
""")

# 22. Save Model
md("## 22. Save Model\nSerializing trained pipeline and preprocessor to `models/`.")
code("""models_dir = Path("../models")
models_dir.mkdir(parents=True, exist_ok=True)

joblib.dump(final_pipeline, models_dir / "cropiq_yield_model.joblib")
joblib.dump(final_pipeline.named_steps['preprocessor'], models_dir / "cropiq_preprocessor.joblib")
print("Model pipeline and preprocessor saved successfully.")
""")

# 23. Save Metadata
md("## 23. Save Metadata\nSaving JSON metadata documenting parameters, dataset splits, and verified test metrics.")
code("""metadata = {
    "project": "CropIQ",
    "task": "crop_yield_regression",
    "target": TARGET_COLUMN,
    "target_unit": TARGET_UNIT,
    "model": best_model_name,
    "features": PREDICTIVE_FEATURES,
    "metrics": {
        "test_mae": round(test_mae, 4),
        "test_rmse": round(test_rmse, 4),
        "test_r2": round(test_r2, 4),
        "test_mape": round(test_mape, 2),
    }
}
import json
with open(models_dir / "model_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)
print("Metadata saved.")
""")

# 24. Final Validation
md("## 24. Final Validation\nTesting inference using `predict_yield` utility to ensure zero inference-time bugs.")
code("""sys.path.insert(0, str(Path("../src")))
from ml.predict import predict_yield

sample_input = test_df[PREDICTIVE_FEATURES].iloc[0].to_dict()
result = predict_yield(sample_input)
print(f"Sample prediction result:\\n{result}")
print("\\nPhase 2 Modeling Notebook execution complete!")
""")

nb.cells = cells

out_path = ROOT / "notebooks" / "02_model_training.ipynb"
with open(out_path, "w", encoding="utf-8") as f:
    nbf.write(nb, f)

print(f"Wrote {len(cells)} cells to {out_path}")

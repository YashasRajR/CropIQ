"""
Generates notebooks/03_explainability_risk.ipynb adhering to the 16-section structure
outlined in Phase 3 Section 49.

Run:
    python notebooks/_build_explainability_notebook.py
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
md("""# CropIQ Phase 3 — Explainability, Risk Assessment & Agricultural Insight Engine
**Subtitle:** AI-Powered Crop Yield Intelligence  
**Tagline:** Predict. Understand. Optimize.  

This notebook implements the complete 16-step interpretability and risk intelligence workflow for CropIQ.
""")

md("## 1. Imports")
code("""import sys
import json
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

sys.path.insert(0, str(Path.cwd().parent / "src"))
from intelligence import (
    analyze_crop_prediction,
    explain_prediction,
    estimate_prediction_uncertainty,
    compute_yield_risk,
    generate_agricultural_insights,
    detect_out_of_distribution,
    extract_and_save_global_feature_importance,
    load_crop_reference_distributions,
    load_training_feature_bounds,
    validate_intelligence_output,
    FEATURE_METADATA,
    get_feature_display_name,
)
from ml.predict import load_prediction_model
from ml.utils import PREDICTIVE_FEATURES, TARGET_COLUMN, TARGET_UNIT

sns.set_theme(style="whitegrid")
print("All intelligence modules loaded successfully.")
""")

# 2. Load Model
md("## 2. Load Phase 2 Trained Model Pipeline\nLoading serialized `cropiq_yield_model.joblib` containing ColumnTransformer preprocessor and RandomForestRegressor.")
code("""pipeline = load_prediction_model(Path("../models/cropiq_yield_model.joblib"))
preprocessor = pipeline.named_steps["preprocessor"]
rf_model = pipeline.named_steps["model"]
print(f"Loaded pipeline with {len(rf_model.estimators_)} trees in Random Forest.")
""")

# 3. Load Model Metadata
md("## 3. Load Model Metadata\nVerifying Phase 2 evaluation metrics, feature lists, and target definition.")
code("""with open("../models/model_metadata.json", "r") as f:
    metadata = json.load(f)

print(f"Project: {metadata['project']} | Task: {metadata['task']}")
print(f"Model: {metadata['model']} | Target: '{metadata['target']}' ({metadata['target_unit']})")
print(f"Test MAE: {metadata['metrics']['test_mae']} | Test R²: {metadata['metrics']['test_r2']}")
""")

# 4. Load Processed Dataset
md("## 4. Load Processed Dataset\nLoading Phase 1 processed data for evaluation and reference distribution extraction.")
code("""df = pd.read_csv("../data/processed/crop_yield_model_data.csv")
print(f"Dataset shape: {df.shape[0]} observations across {df.shape[1]} columns.")
display(df.head(2))
""")

# 5. Global Feature Importance
md("## 5. Global Feature Importance\nExtracting, consolidating, and visualizing global predictive feature importances.")
code("""global_fi = extract_and_save_global_feature_importance(pipeline)
fi_df = pd.DataFrame(global_fi)

plt.figure(figsize=(10, 6))
top15 = fi_df.head(15).iloc[::-1]
plt.barh(top15["display_name"], top15["importance"], color="#2b83ba", edgecolor="k")
plt.xlabel("MDI Feature Importance")
plt.title("Top 15 Global Predictive Features in CropIQ")
plt.tight_layout()
plt.show()

display(fi_df.head(10)[["rank", "display_name", "category", "importance", "actionable_type"]])
""")

# 6. SHAP / Explanation Setup
md("## 6. SHAP / Explanation Setup\nInitializing `shap.TreeExplainer` on the 300 decision trees with automatic fallback capability.")
code("""from intelligence.explain import get_tree_explainer
explainer = get_tree_explainer(rf_model)
print(f"TreeExplainer initialized: {explainer is not None}")
""")

# 7. Local Explanation Example
md("## 7. Local Explanation Example\nGenerating local feature contributions for a sample farm input.")
code("""sample_row = df[PREDICTIVE_FEATURES].iloc[0].to_dict()
explanation_res = explain_prediction(sample_row, pipeline=pipeline)

print(f"Predicted Yield: {explanation_res['predicted_yield']} {explanation_res['unit']}")
print(f"Baseline Yield:  {explanation_res['baseline_yield']} {explanation_res['unit']}")
print(f"Method:          {explanation_res['method']}")
print(f"Identity Check:  {explanation_res['explanation_identity_verified']} (Discrepancy: {explanation_res['identity_discrepancy']:.6f})")

print("\\nTop Positive Factors:")
for p in explanation_res["top_positive_factors"]:
    print(f"  + {p['display_name']} ({p['observed_value']}): {p['contribution']:+.4f}")

print("\\nTop Negative Factors:")
for n in explanation_res["top_negative_factors"]:
    print(f"  - {n['display_name']} ({n['observed_value']}): {n['contribution']:+.4f}")
""")

# 8. Explanation Consistency Check
md("## 8. Explanation Consistency Check\nVerifying that $\\text{baseline} + \\sum \\text{contributions} \\approx \\text{prediction}$ across multiple samples.")
code("""sample_batch = df[PREDICTIVE_FEATURES].sample(10, random_state=42)
discrepancies = []
for idx, row in sample_batch.iterrows():
    res = explain_prediction(row.to_dict(), pipeline=pipeline)
    discrepancies.append(res["identity_discrepancy"])

print(f"Max identity discrepancy across 10 random samples: {max(discrepancies):.6f}")
assert max(discrepancies) < 0.05, "Identity check failed!"
print("Explanation conservation identity verified across batch.")
""")

# 9. Feature Contribution Visualization
md("## 9. Feature Contribution Visualization\nPlotting directional waterfall / bar chart of local feature contributions.")
code("""contrib_df = pd.DataFrame(explanation_res["all_contributions"])
top_contrib = contrib_df.sort_values("absolute_contribution", ascending=False).head(10).iloc[::-1]

colors = ["#2ca25f" if c > 0 else "#de2d26" for c in top_contrib["contribution"]]

plt.figure(figsize=(9, 5))
plt.barh(top_contrib["display_name"], top_contrib["contribution"], color=colors, edgecolor="k")
plt.axvline(0, color="k", linestyle="--", alpha=0.7)
plt.xlabel(f"Contribution to Yield ({TARGET_UNIT})")
plt.title(f"Local Feature Contributions for Sample ({explanation_res['method']})")
plt.tight_layout()
plt.show()
""")

# 10. Yield Reference Distribution
md("## 10. Crop Yield Reference Distribution\nCalculating historical percentiles (P10, Q1, Median, Q3, P90) per crop.")
code("""ref_stats = load_crop_reference_distributions()
crop_name = sample_row["crop_type"]
crop_bench = ref_stats["crops"].get(crop_name, ref_stats["overall"])

print(f"Historical Reference for {crop_name}:")
print(f"  P10:    {crop_bench['p10']}")
print(f"  Q1:     {crop_bench['q1']}")
print(f"  Median: {crop_bench['median']}")
print(f"  Q3:     {crop_bench['q3']}")
print(f"  P90:    {crop_bench['p90']}")
""")

# 11. Risk Logic
md("## 11. Crop Yield Risk Indicator Logic\nEvaluating the 4-component transparent risk scoring algorithm (Yield Deviation, Uncertainty, Negative Contributors, Data Quality).")
code("""unc_res = estimate_prediction_uncertainty(sample_row, pipeline=pipeline)
risk_res = compute_yield_risk(
    predicted_yield=explanation_res["predicted_yield"],
    crop_type=crop_name,
    explanation_result=explanation_res,
    uncertainty_result=unc_res,
    quality_warnings=[],
)

print(f"Risk Level: {risk_res['risk_level']} (Score: {risk_res['risk_score']}/100)")
print("Sub-scores:", risk_res["component_scores"])
print("Risk Drivers:", risk_res["risk_drivers"])
print("Protective Factors:", risk_res["protective_factors"])
""")

# 12. Uncertainty Analysis
md("## 12. Uncertainty Analysis\nInspecting individual tree prediction distributions across 300 decision trees in the ensemble.")
code("""print(f"Ensemble Prediction: {unc_res['estimate']}")
print(f"Model-Derived Uncertainty Range: [{unc_res['lower']}, {unc_res['upper']}] ({unc_res['unit']})")
print(f"Tree Std Deviation: {unc_res['std']}")
print(f"Relative Uncertainty: {unc_res['relative_uncertainty'] * 100:.1f}% -> Classification: {unc_res['classification']}")
""")

# 13. Out-of-Distribution Analysis
md("## 13. Out-of-Distribution Analysis\nDetecting extreme tails or out-of-range sensor inputs.")
code("""normal_warnings, is_ood, extrap = detect_out_of_distribution(sample_row)
print("Normal sample warnings:", normal_warnings)

# Extreme test
extreme_sample = dict(sample_row)
extreme_sample["rainfall"] = 999.0
extreme_sample["NDVI"] = 2.5
ext_warnings, ext_is_ood, ext_extrap = detect_out_of_distribution(extreme_sample)
print("\\nExtreme sample OOD detected:", ext_is_ood)
print("Extrapolation warning:", ext_extrap)
print("Warnings generated:", ext_warnings)
""")

# 14. Error / Explanation Analysis
md("## 14. Error / Explanation Analysis\nAnalyzing factor patterns on high-error test observations to identify model vulnerability modes.")
code("""top_neg_features = [x["feature"] for x in explanation_res["top_negative_factors"]]
print("Primary downward factors on sample:", top_neg_features)
""")

# 15. Final Intelligence Output
md("## 15. End-to-End CropIQ Intelligence Output\nGenerating complete structured intelligence JSON response matching Phase 4 contract.")
code("""full_intel = analyze_crop_prediction(sample_row, pipeline=pipeline)
print(json.dumps(full_intel, indent=2)[:1000] + "...\\n[truncated for display]")
""")

# 16. Validation
md("## 16. Validation Suite\nRunning schema and mathematical identity verification.")
code("""is_valid, issues = validate_intelligence_output(full_intel)
print(f"Response Payload Valid: {is_valid}")
if not is_valid:
    print("Issues:", issues)
assert is_valid, "Validation failed!"
print("\\nPhase 3 Explainability & Risk Notebook successfully completed!")
""")

nb.cells = cells

out_path = ROOT / "notebooks" / "03_explainability_risk.ipynb"
with open(out_path, "w", encoding="utf-8") as f:
    nbf.write(nb, f)

print(f"Wrote {len(cells)} cells to {out_path}")

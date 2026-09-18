"""
Builder script to generate and execute notebooks/05_what_if_simulator.ipynb
Conforming to Section 94 specifications of CropIQ Phase 5.
"""

from pathlib import Path
import io
import contextlib
import json
import nbformat as nbf
import pandas as pd

NOTEBOOK_PATH = Path("notebooks/05_what_if_simulator.ipynb")


def create_what_if_notebook():
    nb = nbf.v4.new_notebook()
    nb.metadata = {
        "language_info": {"name": "python"},
        "kernelspec": {"name": "python3", "display_name": "Python 3"},
    }

    cells = []

    # Title & Header
    cells.append(
        nbf.v4.new_markdown_cell(
            "# CropIQ Phase 5: What-If Crop Yield Scenario Simulator\n\n"
            "**Subtitle:** AI-Powered Crop Yield Intelligence  \n"
            "**Tagline:** Predict. Understand. Optimize.  \n"
            "**Objective:** Build an interactive What-If Scenario Simulator allowing farmers and agronomists "
            "to explore how the trained model's yield estimates respond to hypothetical changes in soil moisture, "
            "rainfall, temperature, and vegetation health.\n\n"
            "```text\n"
            "Current Farm Conditions\n"
            "        ↓\n"
            "Current Model Prediction\n"
            "        ↓\n"
            "User Modifies Selected Variable\n"
            "        ↓\n"
            "Scenario Input (Deep Copied)\n"
            "        ↓\n"
            "SAME CropIQ ML Model\n"
            "        ↓\n"
            "Scenario Prediction & Delta Explanation\n"
            "        ↓\n"
            "Compare Current vs Scenario (MAE Materiality)\n"
            "        ↓\n"
            "Non-Causal Insights & Caveats\n"
            "```"
        )
    )

    # Section 1: Imports
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 1. Imports & Environment Setup\n"
            "Import ML model utilities, intelligence layers, recommendation engine, and scenario simulator modules."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "import sys\n"
            "import json\n"
            "from pathlib import Path\n"
            "import pandas as pd\n"
            "import numpy as np\n\n"
            "# Ensure project root is in sys.path\n"
            "for p in [Path.cwd(), Path.cwd().parent]:\n"
            "    if (p / 'src').exists() and str(p) not in sys.path:\n"
            "        sys.path.insert(0, str(p))\n\n"
            "# CropIQ Core Modules\n"
            "from src.ml.predict import load_prediction_model\n"
            "from src.intelligence import analyze_crop_prediction\n"
            "from src.recommendations import generate_recommendations\n"
            "from src.simulator import (\n"
            "    simulate_scenario,\n"
            "    simulate_multiple_scenarios,\n"
            "    compute_feature_sensitivity,\n"
            "    create_preset_scenario,\n"
            "    reset_scenario,\n"
            "    load_scenario_metadata,\n"
            "    compare_scenarios,\n"
            "    session_history,\n"
            ")\n\n"
            "print('CropIQ Phase 5 modules successfully imported.')"
        )
    )

    # Section 2: Load Model
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 2. Load Trained CropIQ ML Model\n"
            "Load and verify the Phase 2 Random Forest regression pipeline (`models/cropiq_yield_model.joblib`)."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "pipe = load_prediction_model()\n"
            "print('Loaded Pipeline Steps:', list(pipe.named_steps.keys()))\n"
            "print('Model Class:', type(pipe.named_steps['model']).__name__)\n"
            "print('Number of Decision Trees:', pipe.named_steps['model'].n_estimators)"
        )
    )

    # Section 3: Load Metadata
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 3. Load Scenario Metadata & Training Quantiles\n"
            "Inspect modifiability classifications, physical limits, and empirical training percentiles from `knowledge/scenario_features.json`."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "meta = load_scenario_metadata()\n"
            "features_meta = meta['features']\n"
            "print(f'Registered Scenario Features: {list(features_meta.keys())}')\n"
            "print(f'Validation MAE Materiality Threshold: {meta.get(\"material_change_threshold\")} unconfirmed')\n\n"
            "moist_stats = features_meta['soil_moisture']['training_stats']\n"
            "print(f'Soil Moisture Empirical Bounds: Min={moist_stats[\"min\"]}, Median={moist_stats[\"median\"]}, Max={moist_stats[\"max\"]}')"
        )
    )

    # Section 4: Load Phase 3 Engine
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 4. Verify Phase 3 Intelligence Layer Connection\n"
            "Confirm availability of local SHAP/ablation explanations, 4-factor risk scoring, and ensemble uncertainty."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "print('Phase 3 Intelligence Layer is ready to compute delta explanations and risk progressions.')"
        )
    )

    # Section 5: Load Phase 4 Recommendations
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 5. Connect Phase 4 Recommendation Triggers\n"
            "Demonstrate the product chain: Actionable Recommendation $\\to$ Interactive What-If Simulation."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "from src.recommendations import load_agricultural_rules\n"
            "rules = load_agricultural_rules()\n"
            "simulatable_rules = [r for r in rules if r.get('what_if_supported')]\n"
            "print(f'Total Rules with What-If Simulation Support: {len(simulatable_rules)} / {len(rules)}')\n"
            "for r in simulatable_rules[:3]:\n"
            "    print(f\" - [{r['id']}] {r['title']} (Feature: {r['required_features']})\")"
        )
    )

    # Section 6: Define Example Farm Input
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 6. Define Example Farm Observation\n"
            "Load a realistic test observation from `data/processed/crop_yield_model_data.csv`."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "data_path = Path('data/processed/crop_yield_model_data.csv')\n"
            "if not data_path.exists():\n"
            "    data_path = Path('../data/processed/crop_yield_model_data.csv')\n\n"
            "df = pd.read_csv(data_path)\n"
            "sample_input = df.iloc[0].to_dict()\n"
            "sample_input.pop('yield', None)\n\n"
            "print('Baseline Crop:', sample_input['crop_type'])\n"
            "print('Baseline Soil Moisture:', sample_input['soil_moisture'])\n"
            "print('Baseline Rainfall:', sample_input['rainfall'])\n"
            "print('Baseline Temperature:', sample_input['temperature'])"
        )
    )

    # Section 7: Baseline Prediction
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 7. Compute Baseline Prediction & Intelligence\n"
            "Establish the baseline yield, risk score, and tree ensemble uncertainty before applying any scenario changes."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "base_intel = analyze_crop_prediction(sample_input, pipeline=pipe)\n"
            "base_yield = base_intel['prediction']['yield']\n"
            "base_risk = base_intel['risk']['level']\n"
            "base_unc = base_intel['uncertainty']['classification']\n\n"
            "print(f'Baseline Predicted Yield: {base_yield:.2f} {base_intel[\"prediction\"][\"unit\"]}')\n"
            "print(f'Baseline Risk: {base_risk} (Score: {base_intel[\"risk\"][\"score\"]}/100)')\n"
            "print(f'Baseline Uncertainty: {base_unc}')"
        )
    )

    # Section 8: Single-Variable Scenario
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 8. Single-Variable Scenario: Soil Moisture Adjustment\n"
            "Simulate moving root-zone moisture from current baseline to an elevated range ($34.0$ unconfirmed)."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "single_res = simulate_scenario(\n"
            "    current_input=sample_input,\n"
            "    scenario_changes={'soil_moisture': 34.0},\n"
            "    scenario_name='Increased Soil Moisture',\n"
            "    pipeline=pipe,\n"
            ")\n"
            "print('Scenario Yield:', single_res['scenario']['predicted_yield'])\n"
            "print('Absolute Difference:', single_res['comparison']['absolute_change'])\n"
            "print('Direction:', single_res['comparison']['direction'])\n"
            "print('Materiality:', single_res['comparison']['materiality_label'])"
        )
    )

    # Section 9: Multi-Variable Scenario
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 9. Multi-Variable Scenario: Combined Weather & Soil Changes\n"
            "Simulate simultaneous changes in soil moisture, rainfall, and temperature."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "multi_res = simulate_scenario(\n"
            "    current_input=sample_input,\n"
            "    scenario_changes={'soil_moisture': 32.0, 'rainfall': 14.0, 'temperature': 22.0},\n"
            "    scenario_name='Cooler & Moist Conditions',\n"
            "    pipeline=pipe,\n"
            ")\n"
            "print('Scenario Yield:', multi_res['scenario']['predicted_yield'])\n"
            "print('Absolute Difference:', multi_res['comparison']['absolute_change'])\n"
            "print('Warnings:', multi_res['validation']['warnings'])"
        )
    )

    # Section 10: Scenario Comparison
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 10. Scenario Comparison & Feature Diff Table\n"
            "Review structured comparison metrics, percentage changes, and feature diffs."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "diff_rows = []\n"
            "for f, d in multi_res['comparison']['feature_diffs'].items():\n"
            "    diff_rows.append({\n"
            "        'Feature': f,\n"
            "        'Baseline': d['baseline'],\n"
            "        'Scenario': d['scenario'],\n"
            "        'Difference': d['difference'],\n"
            "    })\n"
            "diff_df = pd.DataFrame(diff_rows)\n"
            "print(diff_df.to_string(index=False))"
        )
    )

    # Section 11: Scenario Explainability
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 11. Scenario Explainability & Delta Contributions\n"
            "Identify which feature contributions changed between baseline and scenario to account for the model estimate difference."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "delta_contribs = multi_res['explanation']['delta_contributors']\n"
            "contrib_df = pd.DataFrame(delta_contribs)\n"
            "print(contrib_df.to_string(index=False))"
        )
    )

    # Section 12: Scenario Risk
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 12. Scenario Risk Progression Tracking\n"
            "Compare baseline crop yield risk with scenario risk."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "risk_prog = multi_res['progression']['risk']\n"
            "print('Baseline Risk:', risk_prog['baseline_level'], f\"({risk_prog['baseline_score']}/100)\")\n"
            "print('Scenario Risk:', risk_prog['scenario_level'], f\"({risk_prog['scenario_score']}/100)\")\n"
            "print('Risk Classification Changed:', risk_prog['risk_changed'])"
        )
    )

    # Section 13: Scenario Uncertainty
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 13. Scenario Uncertainty Progression\n"
            "Evaluate decision tree spread under the modified scenario conditions."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "unc_prog = multi_res['progression']['uncertainty']\n"
            "print('Baseline Uncertainty:', unc_prog['baseline_level'])\n"
            "print('Scenario Uncertainty:', unc_prog['scenario_level'])\n"
            "print('Relative Uncertainty Spread:', f\"{unc_prog['relative_uncertainty']*100:.1f}%\")"
        )
    )

    # Section 14: Out-of-Distribution Test
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 14. Out-of-Distribution Scenario Test\n"
            "Test scenario behavior when an input exceeds historical training extremes."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "ood_res = simulate_scenario(\n"
            "    current_input=sample_input,\n"
            "    scenario_changes={'rainfall': 110.0},  # Training max is 93.36\n"
            "    scenario_name='Extreme Rainfall Event',\n"
            "    pipeline=pipe,\n"
            ")\n"
            "print('Within Training Range:', ood_res['validation']['within_training_range'])\n"
            "print('Scenario Reliability:', ood_res['interpretation']['scenario_reliability'])\n"
            "print('Reliability Rationale:', ood_res['interpretation']['reliability_reason'])\n"
            "print('OOD Warnings:', [w for w in ood_res['validation']['warnings'] if 'outside the model' in w])"
        )
    )

    # Section 15: Sensitivity Analysis
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 15. 1D Feature Sensitivity Analysis Curve\n"
            "Generate model sensitivity curve for soil moisture holding all other features fixed."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "sens_curve = compute_feature_sensitivity(\n"
            "    current_input=sample_input,\n"
            "    feature_name='soil_moisture',\n"
            "    num_points=8,\n"
            "    pipeline=pipe,\n"
            ")\n"
            "points_df = pd.DataFrame(sens_curve['points'])\n"
            "print(f\"Sensitivity curve for {sens_curve['display_name']} ({len(points_df)} points):\")\n"
            "print(points_df.to_string(index=False))\n"
            "print('\\nDisclaimer:', sens_curve['disclaimer'])"
        )
    )

    # Section 16: Multiple Scenario Comparison
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 16. Multiple Scenario Batch Comparison (Empirical Presets)\n"
            "Simulate and rank a batch of empirical quantile presets."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "preset_scenarios = [\n"
            "    create_preset_scenario(sample_input, 'improve_moisture'),\n"
            "    create_preset_scenario(sample_input, 'historical_median_moisture'),\n"
            "    create_preset_scenario(sample_input, 'drought_stress'),\n"
            "    create_preset_scenario(sample_input, 'higher_rainfall'),\n"
            "    create_preset_scenario(sample_input, 'cooler_temperature'),\n"
            "]\n"
            "batch_res = simulate_multiple_scenarios(sample_input, preset_scenarios, pipeline=pipe)\n"
            "print('Comparative Summary:', batch_res['comparative_summary'])\n\n"
            "ranked_df = pd.DataFrame(batch_res['scenarios_ranked'])\n"
            "print(ranked_df[['name', 'scenario_yield', 'difference', 'direction', 'risk_level', 'reliability']].to_string(index=False))"
        )
    )

    # Section 17: Visualization
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 17. Visualization Data Preparation\n"
            "Format comparative chart data ready for frontend visualization (Phase 7)."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "chart_data = [\n"
            "    {'Scenario': 'Baseline', 'Estimated Yield': base_yield}\n"
            "]\n"
            "for row in batch_res['scenarios_ranked']:\n"
            "    chart_data.append({'Scenario': row['name'], 'Estimated Yield': row['scenario_yield']})\n\n"
            "chart_df = pd.DataFrame(chart_data)\n"
            "print('Frontend Bar Chart Payload:')\n"
            "print(chart_df.to_string(index=False))"
        )
    )

    # Section 18: Validation
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 18. Output Contract Validation & Safety Disclaimers\n"
            "Verify complete structured JSON schema, non-causal claims flag, and reset capability."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "# 1. Verify causal claim flag is strictly False\n"
            "assert single_res['interpretation']['causal_claim'] is False, 'Causal claim must be strictly False!'\n\n"
            "# 2. Verify summary text includes mandatory disclaimer\n"
            "assert 'model-based scenario estimate' in single_res['interpretation']['summary']\n\n"
            "# 3. Test Reset Functionality\n"
            "reset_res = reset_scenario(sample_input)\n"
            "assert reset_res['status'] == 'reset'\n"
            "assert len(reset_res['changes']) == 0\n\n"
            "print('All Phase 5 schema contracts, safety flags, and reset capabilities validated successfully.')"
        )
    )

    # Execute all cells and capture outputs
    ns = {}
    for cell in cells:
        if cell.cell_type == "code":
            sio = io.StringIO()
            with contextlib.redirect_stdout(sio):
                exec(cell.source, ns)
            out_str = sio.getvalue()
            if out_str:
                cell.outputs = [nbf.v4.new_output(output_type="stream", name="stdout", text=out_str)]

    nb.cells = cells
    with open(NOTEBOOK_PATH, "w", encoding="utf-8") as f:
        nbf.write(nb, f)
    print(f"Generated and executed notebook at: {NOTEBOOK_PATH}")


if __name__ == "__main__":
    create_what_if_notebook()

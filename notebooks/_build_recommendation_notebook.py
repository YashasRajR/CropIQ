"""
Builder script to generate and execute notebooks/04_recommendation_engine.ipynb
Conforming to Section 78 specifications of CropIQ Phase 4.
"""

from pathlib import Path
import io
import contextlib
import nbformat as nbf
import pandas as pd

NOTEBOOK_PATH = Path("notebooks/04_recommendation_engine.ipynb")


def create_recommendation_notebook():
    nb = nbf.v4.new_notebook()
    nb.metadata = {
        "language_info": {"name": "python"},
        "kernelspec": {"name": "python3", "display_name": "Python 3"},
    }

    cells = []

    # Title & Header
    cells.append(
        nbf.v4.new_markdown_cell(
            "# CropIQ Phase 4: Actionable Agricultural Recommendation Engine\n\n"
            "**Subtitle:** AI-Powered Crop Yield Intelligence  \n"
            "**Tagline:** Predict. Understand. Optimize.  \n"
            "**Objective:** Transform Phase 2 ML predictions and Phase 3 explainability & risk signals "
            "into deterministic, prioritized, and farmer-friendly agricultural recommendations.\n\n"
            "```text\n"
            "Farm Input\n"
            "    ↓\n"
            "Phase 2 — Yield Prediction\n"
            "    ↓\n"
            "Phase 3 — Explainability + Risk + Uncertainty\n"
            "    ↓\n"
            "Phase 4 — Recommendation Engine\n"
            "    ↓\n"
            "Prioritized Actions & Monitoring Suggestions\n"
            "    ↓\n"
            "Phase 5 — What-If Simulation\n"
            "```"
        )
    )

    # Section 1: Imports
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 1. Imports & Environment Setup\n"
            "Import required data, intelligence, and recommendation engine modules."
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
            "from src.intelligence import analyze_crop_prediction\n"
            "from src.recommendations import (\n"
            "    generate_recommendations,\n"
            "    load_agricultural_rules,\n"
            "    load_crop_profiles,\n"
            "    load_recommendation_metadata,\n"
            "    validate_rule_catalog,\n"
            "    validate_single_recommendation,\n"
            "    evaluate_candidate_rules,\n"
            "    prioritize_and_rank_recommendations,\n"
            "    format_recommendation_farmer_mode,\n"
            "    format_recommendation_technical_mode,\n"
            "    RuleTracer,\n"
            ")\n\n"
            "print('CropIQ Phase 4 modules imported successfully.')"
        )
    )

    # Section 2: Load Phase 3 Outputs
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 2. Load Phase 3 Intelligence Pipeline\n"
            "Load a realistic test observation from the processed dataset and generate Phase 3 intelligence."
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
            "p3_payload = analyze_crop_prediction(sample_input)\n"
            "print('Predicted Yield:', p3_payload['prediction'])\n"
            "print('Risk Posture:', p3_payload['risk']['level'], f\"(Score: {p3_payload['risk']['score']}/100)\")\n"
            "print('Ensemble Uncertainty:', p3_payload['uncertainty']['classification'])"
        )
    )

    # Section 3: Load Knowledge Base
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 3. Load Agricultural Knowledge Base\n"
            "Load the external rules catalog, supported crop profiles, and recommendation metadata."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "rules = load_agricultural_rules()\n"
            "crop_profiles = load_crop_profiles()\n"
            "metadata = load_recommendation_metadata()\n\n"
            "print(f'Loaded {len(rules)} agricultural rules across {len(metadata[\"categories\"])} categories.')\n"
            "print(f'Supported Crop Profiles: {list(crop_profiles.keys())}')"
        )
    )

    # Section 4: Validate Rules
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 4. Validate Rules & Safety Schema\n"
            "Perform static safety audit: ensure unique IDs, valid categories, citation tags, and zero prohibited causal language."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "is_valid, issues = validate_rule_catalog(rules)\n"
            "print('Knowledge Base Catalog Valid:', is_valid)\n"
            "if not is_valid:\n"
            "    for iss in issues:\n"
            "        print(' -', iss)\n"
            "else:\n"
            "    print('Zero safety violations or unbacked dosage prescriptions detected.')"
        )
    )

    # Section 5: Evaluate Triggers
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 5. Evaluate Triggers Against Farm Observation\n"
            "Apply composite boolean logic, feature availability filters, and crop specificity."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "tracer = RuleTracer()\n"
            "candidate_recs = evaluate_candidate_rules(\n"
            "    intelligence_payload=p3_payload,\n"
            "    input_data=sample_input,\n"
            "    rules=rules,\n"
            "    tracer=tracer,\n"
            ")\n"
            "print(f'Matched {len(candidate_recs)} candidate rules out of {len(rules)} total rules:')\n"
            "for c in candidate_recs:\n"
            "    print(f\"  [{c['category']}] {c['id']}: {c['title']} (Base Priority: {c['priority']})\")"
        )
    )

    # Section 6: Candidate Recommendations
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 6. Candidate Recommendations Inspection\n"
            "Inspect attached empirical evidence, citations, and what-if simulation compatibility flags."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "if candidate_recs:\n"
            "    c0 = candidate_recs[0]\n"
            "    print('Rule ID:', c0['id'])\n"
            "    print('Reason:', c0['reason'])\n"
            "    print('Action:', c0['action'])\n"
            "    print('What-If Supported:', c0['what_if_supported'])\n"
            "    print('Attached Evidence Items:', len(c0['evidence']))"
        )
    )

    # Section 7 & 8: Deduplicate & Resolve Conflicts
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 7 & 8. Deduplication and Agronomic Conflict Resolution\n"
            "Consolidate overlapping recommendations (e.g. merging multiple moisture deficit rules) "
            "and resolve potential contradictory advice using the precedence hierarchy."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "displayed_recs, all_ranked = prioritize_and_rank_recommendations(\n"
            "    candidates=candidate_recs,\n"
            "    intelligence_payload=p3_payload,\n"
            "    top_n=5,\n"
            "    tracer=tracer,\n"
            ")\n"
            "print(f'Deduplicated from {len(candidate_recs)} candidates down to {len(all_ranked)} unique actions.')\n"
            "print(f'Top {len(displayed_recs)} selected for primary farmer display.')"
        )
    )

    # Section 9: Prioritize
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 9. Transparent Priority Scoring\n"
            "Display normalized priority scores (0-100) combining trigger severity, evidence strength, actionability, and risk posture."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "score_table = []\n"
            "for r in all_ranked:\n"
            "    score_table.append({\n"
            "        'ID': r['id'],\n"
            "        'Category': r['category'],\n"
            "        'Priority Level': r['priority'],\n"
            "        'Score (0-100)': r['priority_score'],\n"
            "        'Evidence': r['evidence_strength'],\n"
            "        'Actionability': r['actionability'],\n"
            "        'Simulatable': r['what_if_supported'],\n"
            "    })\n"
            "score_df = pd.DataFrame(score_table)\n"
            "print(score_df.to_string(index=False))"
        )
    )

    # Section 10: Farmer-Friendly vs Technical Views
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 10. Generate Farmer-Friendly & Technical Views\n"
            "Compare the clean, non-technical farmer representation with the detailed audit view."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "if displayed_recs:\n"
            "    farmer_view = format_recommendation_farmer_mode(displayed_recs[0])\n"
            "    tech_view = format_recommendation_technical_mode(displayed_recs[0])\n"
            "    print('=== FARMER MODE ===')\n"
            "    print('Title:', farmer_view['title'])\n"
            "    print('Why:', farmer_view['reason'])\n"
            "    print('Action:', farmer_view['action'])\n"
            "    print('Evidence:', farmer_view['evidence'])\n"
            "    print('Limitation:', farmer_view['limitations'])\n"
            "    print('\\n=== TECHNICAL MODE AUDIT FIELDS ===')\n"
            "    print('Source:', tech_view['source'])\n"
            "    print('Priority Score:', tech_view['priority_score'])\n"
            "    print('Raw Evidence Signals:', tech_view['raw_evidence'])"
        )
    )

    # Section 11: Validate Output
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 11. Validate Recommendation Output Contract\n"
            "Verify all contract fields, non-empty evidence, and absence of prohibited causal terms."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "for rec in displayed_recs:\n"
            "    fv = format_recommendation_farmer_mode(rec)\n"
            "    valid, rec_issues = validate_single_recommendation(fv)\n"
            "    assert valid, f\"Validation failed: {rec_issues}\"\n"
            "print('All displayed recommendations passed schema and safety validation.')"
        )
    )

    # Section 12: Example Scenarios
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 12. Demonstration Across Key Agricultural Scenarios\n"
            "Evaluate the recommendation engine on diverse farm states: moisture stress, heat wave, high uncertainty, and OOD."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "scenarios = {\n"
            "    'Normal Conditions': {'soil_moisture': 28.0, 'NDVI': 0.70, 'rainfall': 15.0, 'temperature': 24.0},\n"
            "    'Severe Moisture Deficit': {'soil_moisture': 10.0, 'rainfall': 1.0, 'temperature': 34.0},\n"
            "    'Vegetation Canopy Decline': {'NDVI': 0.22, 'GNDVI': 0.20, 'SAVI': 0.18},\n"
            "    'Out-of-Distribution Weather': {'temperature': 70.0, 'rainfall': 500.0},\n"
            "}\n\n"
            "scenario_results = []\n"
            "for sname, sinputs in scenarios.items():\n"
            "    row = sample_input.copy()\n"
            "    row.update(sinputs)\n"
            "    p3_res = analyze_crop_prediction(row)\n"
            "    p4_res = generate_recommendations(intelligence_payload=p3_res, input_data=row)\n"
            "    top_title = p4_res['recommendations'][0]['title'] if p4_res['recommendations'] else 'None'\n"
            "    top_cat = p4_res['recommendations'][0]['category'] if p4_res['recommendations'] else 'N/A'\n"
            "    scenario_results.append({\n"
            "        'Scenario': sname,\n"
            "        'Risk Level': p3_res['risk']['level'],\n"
            "        'Generated': p4_res['summary']['total_generated'],\n"
            "        'Top Action Category': top_cat,\n"
            "        'Top Action Title': top_title,\n"
            "    })\n\n"
            "res_df = pd.DataFrame(scenario_results)\n"
            "print(res_df.to_string(index=False))"
        )
    )

    # Section 13: Final Recommendation JSON
    cells.append(
        nbf.v4.new_markdown_cell(
            "## 13. Final Recommendation JSON Output Contract\n"
            "Export complete API-ready JSON structure for Phase 5 (What-If Simulator) and Phase 6 (FastAPI)."
        )
    )
    cells.append(
        nbf.v4.new_code_cell(
            "final_output = generate_recommendations(\n"
            "    intelligence_payload=p3_payload,\n"
            "    input_data=sample_input,\n"
            "    top_n=3,\n"
            ")\n"
            "print(json.dumps(final_output['summary'], indent=2))\n"
            "print('\\nTop Recommendation JSON:')\n"
            "print(json.dumps(final_output['recommendations'][0], indent=2))"
        )
    )

    # Execute all cells and populate outputs
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
    create_recommendation_notebook()

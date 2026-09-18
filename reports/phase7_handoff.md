# Phase 7 Handoff Report — React Frontend, Interactive Dashboard & Product Integration

**Project Name:** CropIQ  
**Subtitle:** AI-Powered Crop Yield Intelligence  
**Tagline:** Predict. Understand. Optimize.  
**Phase:** Phase 7 (Final Product-Facing Layer)  
**Status:** **COMPLETE (Quality Gate Passed: 100%)**  
**Date:** September 2026  

---

## 1. Executive Summary

Phase 7 delivers a modern, responsive, hackathon-ready **React + TypeScript + Vite + Tailwind CSS** single-page web application (`frontend/`) that integrates directly with the live Phase 6 **FastAPI backend** (`backend/app/`).

The application realizes the complete CropIQ product journey:
$$\text{Landing/Hero} \longrightarrow \text{Farm Input} \longrightarrow \text{Yield \& Risk Intelligence} \longrightarrow \text{TreeSHAP Factors} \longrightarrow \text{Actionable Guidance} \longrightarrow \text{What-If Simulator} \longrightarrow \text{Transparency/Audit}$$

### Strict Engineering Guardrails Enforced
1. **Zero Hardcoding & Zero Client-Side Intelligence Fabrication**:
   - The frontend contains **no secondary ML models, mock calculations, or fake metrics**.
   - All predicted yields, standard deviations, confidence intervals, risk levels, SHAP attributions, recommendations, and what-if deltas ($\Delta Y$) are computed live by the FastAPI backend (`http://localhost:8000`).
2. **Backend is the Single Source of Truth**:
   - What-if comparisons display the exact server-side differences (`comparison.absolute_change`, `comparison.percentage_change`, `comparison.is_material`) rather than performing local JavaScript arithmetic.
3. **Strict Non-Causal Framing & Target Unit Integrity**:
   - Prominent disclosures (*"Model Scenario Estimate — Not a Causal Guarantee"*) appear on all prediction, factor, and simulator cards.
   - Crop yield is displayed strictly with the unit label `"unconfirmed"` (never falsely labeled as `t/ha` or `kg/ha`).
4. **100% Local Execution**:
   - Completely offline-capable with zero cloud API keys, zero LLM dependencies, and zero database requirements.

---

## 2. Frontend Architecture & Component Tree

```text
frontend/
├── index.html                    # SEO metadata, font preconnects, mount target
├── package.json                  # React 18.3, Vite 5.4, Lucide-React, Recharts 2.12
├── tsconfig.json                 # Strict TypeScript configuration
├── vite.config.ts                # Dev server proxy to http://localhost:8000
├── tailwind.config.js            # Agricultural dark palette (emerald, teal, slate, rose)
├── postcss.config.js             # PostCSS with Tailwind & Autoprefixer
├── .env.example                  # VITE_API_BASE_URL=http://localhost:8000
│
└── src/
    ├── index.css                 # Custom dark scrollbar & base layer styles
    ├── main.tsx                  # React 18 createRoot with ErrorBoundary
    ├── vite-env.d.ts             # Vite client environment typing
    ├── App.tsx                   # Main orchestration dashboard
    │
    ├── types/                    # Strict data contracts matching Phase 6 API
    │   ├── api.ts                # HealthResponse, ModelInfoResponse, APIErrorDetail
    │   ├── farm.ts               # FarmInput, FeatureMetadataItem, ScenarioFeaturesCatalog
    │   ├── prediction.ts         # PredictionValue, RiskPayload, UncertaintyPayload
    │   ├── explanation.ts        # FeatureContribution, ExplanationResponse
    │   ├── recommendation.ts     # RecommendationItem, RecommendationResponse
    │   └── scenario.ts           # ScenarioRequest, ScenarioResponse, SensitivityResponse
    │
    ├── services/
    │   └── api.ts                # Centralized fetch client for all 9 FastAPI endpoints
    │
    ├── config/
    │   ├── constants.ts          # API_BASE_URL, FEATURE_DICTIONARY with min/max/units
    │   └── presets.ts            # 5 Authentic dataset observations from Phase 1 data
    │
    ├── utils/
    │   ├── formatting.ts         # Precision formatting, yield badge styling, diff coloring
    │   └── validation.ts         # Client-side numeric boundary checking
    │
    └── components/
        ├── layout/
        │   ├── Navbar.tsx        # Brand, live API status badge, Specs & Audit buttons
        │   ├── Footer.tsx        # Methodology details, non-causal disclosures, links
        │   └── ErrorBoundary.tsx # Catch-and-recover error boundary
        │
        ├── common/
        │   ├── Card.tsx          # Consistent elevated dark containers
        │   ├── Badge.tsx         # Semantic risk, priority, and category badges
        │   ├── Button.tsx        # Accessible interactive button with loading spinner
        │   ├── Tooltip.tsx       # Contextual explanation hover/tap tooltip
        │   └── Skeleton.tsx      # Pulse loading skeletons
        │
        ├── hero/
        │   └── HeroSection.tsx   # Hero headline, 5-step pipeline diagram, CTA triggers
        │
        ├── farm-form/
        │   ├── FarmInputForm.tsx # Grouped form (Crop, Location, Weather, Soil, Vegetation)
        │   └── ExampleSelector.tsx # 1-click real dataset observation loaders
        │
        ├── prediction/
        │   ├── PredictionCard.tsx# KPI yield display, historical percentile context
        │   ├── RiskCard.tsx      # Multi-factor risk gauge (LOW/MOD/HIGH) and drivers
        │   └── ReliabilityCard.tsx # Ensemble tree uncertainty and OOD warnings
        │
        ├── explanation/
        │   └── FactorChart.tsx   # Recharts horizontal bar chart (SHAP local importance)
        │
        ├── recommendations/
        │   ├── RecommendationList.tsx # Filterable guidance with Farmer/Technical mode toggle
        │   └── RecommendationCard.tsx # Action, reason, evidence, and "Explore Scenario" hook
        │
        ├── simulator/
        │   ├── ScenarioSimulator.tsx  # Sliders, empirical bounds, preset interventions
        │   ├── ScenarioComparison.tsx # Side-by-side yield diff, materiality badge, delta SHAP
        │   ├── SensitivityChart.tsx   # 1D response curve across training percentiles
        │   └── ScenarioHistory.tsx    # Session trial history with restore/clear
        │
        └── transparency/
            ├── ModelInfoModal.tsx # Full Phase 2 metrics, 30 features, candidate comparison
            └── TechnicalDrawer.tsx # Real-time raw API JSON inspector for judges
```

---

## 3. Authentic Dataset Presets

Five real observation samples from `data/processed/crop_yield_model_data.csv` are built directly into the UI:

| Preset Name | Crop | Field ID | Lat / Lon | Soil Moisture | Temp (°C) | Rainfall (mm) | Key Characteristic |
|---|---|---|---|---|---|---|---|
| **Sample 1** | **Rice** | Field_1 | 22.625, 88.498 | 21.98 | 14.60 | 17.50 | Humid alluvial plain, high vigor |
| **Sample 2** | **Bajra** | Field_14 | 26.856, 75.975 | 20.87 | 6.56 | 6.98 | Semi-arid western zone, cold dry |
| **Sample 3** | **Jowar** | Field_32 | 19.095, 74.868 | 16.11 | 16.65 | 7.95 | Deccan plateau, low soil moisture |
| **Sample 4** | **Soybean** | Field_45 | 23.324, 77.397 | 24.71 | 14.20 | 7.30 | Central plateau, balanced moisture |
| **Sample 5** | **Sugarcane** | Field_60 | 26.707, 80.861 | 24.56 | 7.52 | 9.62 | Upper Gangetic plain, dense canopy |

---

## 4. Verification & Quality Gate Results

| Check / Gate | Target | Result | Status |
|---|---|---|---|
| **TypeScript Typecheck** | `npx tsc --noEmit` | 0 errors | **PASSED** |
| **Vite Production Build** | `npm run build` | Built in 39.94s, clean `dist/` bundle | **PASSED** |
| **Backend Test Suite** | `test_*.py` | **115 / 115 tests passing** (23.66s) | **PASSED** |
| **Zero Client Calculations** | No client-side ML/arithmetic | All metrics from FastAPI responses | **PASSED** |
| **Target Unit Integrity** | Unit displayed as `"unconfirmed"` | Displayed consistently in all cards | **PASSED** |
| **Non-Causal Disclosures** | Prominent warning badges | Displayed on predictions & simulator | **PASSED** |
| **Mobile Responsiveness** | Viewports 375px to 1440px+ | Flex & grid layouts with no overflow | **PASSED** |

---

## 5. Hackathon Judge Presentation Script (3-5 Minute Demo)

### Step 1: Open the App & Show Live Backend Connectivity
- Point out the **Navbar status badge**: `"FastAPI Ready ●"` indicates live connectivity with the backend on port 8000.
- Click **"Model Specs"**: The modal reveals the Random Forest specifications, 30 features, dataset split (670 Train / 167 Val / 210 Test), and cross-validation benchmark comparison.

### Step 2: Auto-Loaded Baseline Observation
- The app automatically initializes with **Sample 1 (Rice, West Bengal)**.
- The **Yield Prediction Card** displays:
  - **Estimated Yield**: `52.59 unconfirmed`
  - **Risk Assessment**: `LOW RISK` (Score: 16)
  - **Ensemble Reliability**: `HIGH` (300-tree variance: $\pm 1.22$)

### Step 3: Local Feature Attributions (TreeSHAP)
- Scroll down to the **Key Model Factors** chart.
- Show the top positive drivers (`rainfall`, `soil_moisture`, `SAVI`) pushing yield upward relative to the dataset baseline (`37.95 unconfirmed`).

### Step 4: Agronomic Recommendations & Scenario Link
- Scroll to **Actionable Guidance**.
- Toggle between **Farmer Mode** (plain-language action steps) and **Technical Audit Mode** (rule IDs and threshold evidence).
- Find the recommendation for **Soil Moisture** and click **"Explore Scenario"**.
- The page automatically scrolls to the What-If Simulator with `soil_moisture` pre-selected!

### Step 5: What-If Scenario Simulation
- Adjust the Soil Moisture slider from `21.98` to `35.00` and click **"Run Scenario"**.
- Point out the results:
  - Baseline: `52.59` $\to$ Scenario: `52.61` ($\Delta Y = +0.02$)
  - **Materiality Badge**: Displays *"Below Model Noise Threshold"* ($|\Delta Y| < 0.9765$ Val MAE), preventing farmers from making costly over-investments based on minor statistical fluctuations.
  - Non-causal disclosure banner reinforces that this is an empirical association, not a causal guarantee.

### Step 6: Real-Time Technical Audit Drawer
- Click **"Audit Data"** in the top navbar.
- The slide-out drawer displays the exact raw JSON returned by the FastAPI server for `/predict`, `/explain`, `/recommendations`, and `/scenario`.
- Proves conclusively to hackathon judges that **zero metrics are synthesized on the client**.

---

## 6. How to Launch Locally

### Terminal 1: FastAPI Backend
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation available at: `http://localhost:8000/docs`

### Terminal 2: React Frontend
```bash
cd frontend
npm run dev
```
Interactive UI available at: `http://localhost:5173`

# CropIQ Risk Analysis Report

**Project:** CropIQ (AI-Powered Crop Yield Intelligence)  
**Phase:** Phase 3 — Risk Assessment & Agricultural Insight Engine  
**Document:** Methodology, Formulations, Thresholds, and Diagnostics  

---

## 1. Purpose

The purpose of the CropIQ Risk Assessment Engine is to synthesize raw machine learning regression outputs, model uncertainty, feature attribution drivers, and data-quality boundaries into a unified, transparent **Crop Yield Risk Indicator** ($0$–$100$ score and $3$-level classification: `LOW`, `MODERATE`, `HIGH`).

It provides decision-makers with immediate insight into whether a farm's predicted yield is concerning relative to historical crop benchmarks, what is driving that concern, and how much confidence can be placed in the prediction.

---

## 2. Risk Definition

In CropIQ Phase 3, **Crop Yield Risk** is defined as:

> The degree to which a field's predicted yield under current conditions is projected to fall below historical crop benchmarks, compounded by model prediction uncertainty, negative environmental stressors, and input extrapolation.

> [!IMPORTANT]
> **Strict Operational Caveat**:
> The Crop Yield Risk Indicator is a **decision-support heuristic** grounded in machine-learning behavior and historical data. It does NOT claim to be a medically or agronomically certified biological crop failure probability.

---

## 3. Reference Distribution

To avoid misleading farmers with raw ungrounded numbers, every predicted yield is evaluated against an empirical historical benchmark:

- **Reference Hierarchy:**
  $$\text{Crop Specific Benchmark} \longrightarrow \text{Overall Dataset Fallback}$$
- **Crop Reference Metrics:** Calculated from the 1,625 observations across 90 fields in India:
  - $P_{10}$ (10th percentile)
  - $Q_1$ (25th percentile)
  - $\text{Median}$ (50th percentile)
  - $Q_3$ (75th percentile)
  - $P_{90}$ (90th percentile)
- If a crop has $< 5$ historical samples, the engine automatically falls back to the dataset-wide reference distribution and logs a transparency flag.

---

## 4. Risk Components

The overall risk score is composed of four distinct, normalized sub-components ($0$ to $100$ each):

```
                        CROP YIELD RISK SCORE (0 - 100)
                                       │
      ┌─────────────────┬──────────────┴───────┬─────────────────┐
      ▼                 ▼                      ▼                 ▼
Yield Deviation    Uncertainty        Negative Factors      Data Quality
    (50%)              (25%)                (15%)               (10%)
Deficit below      Dispersion across   Cumulative negative   OOD & missing
crop median        300 decision trees  feature attributions  input penalties
```

---

## 5. Risk Formula

$$\text{Risk Score} = \text{round}\left( 0.50 \cdot C_{\text{yield}} + 0.25 \cdot C_{\text{uncertainty}} + 0.15 \cdot C_{\text{negative}} + 0.10 \cdot C_{\text{quality}} \right)$$

### Sub-component Formulations:

1. **Yield Deviation Component ($C_{\text{yield}}$):**
   - If $\hat{y} \ge \text{Median}_{\text{crop}}$:
     $$C_{\text{yield}} = \max\left(0, 15 - 15 \cdot \frac{\hat{y} - \text{Median}}{\text{Median}}\right)$$
     (Yield at or above median receives a minimal baseline score between $0$ and $15$).
   - If $\hat{y} < \text{Median}_{\text{crop}}$:
     $$\text{Deficit} = \frac{\text{Median} - \hat{y}}{\text{Median}}$$
     $$C_{\text{yield}} = \min\left(100, \text{Deficit} \cdot 280\right)$$
     (A $10\%$ deficit scores $\approx 28$, a $25\%$ deficit scores $70$, and $\ge 35\%$ deficit scores $100$).

2. **Uncertainty Component ($C_{\text{uncertainty}}$):**
   - Based on relative tree spread: $\text{Spread}_{\text{rel}} = \frac{P_{90} - P_{10}}{\hat{y}}$
   $$C_{\text{uncertainty}} = \text{clip}\left(\frac{\text{Spread}_{\text{rel}}}{0.30} \cdot 100, 0, 100\right)$$
   (Spreads under $10\%$ score $< 33$; spreads exceeding $30\%$ score $100$).

3. **Negative Contributor Component ($C_{\text{negative}}$):**
   - Measures the severity of factors pulling the prediction downward relative to baseline $\mathbb{E}[y]$:
     $$C_{\text{negative}} = \min\left(100, \frac{\sum |\text{negative contributions}|}{\mathbb{E}[y]} \cdot 400\right)$$

4. **Data Quality Component ($C_{\text{quality}}$):**
   - Normal input (within training distribution): $0$
   - Mild out-of-distribution (extreme 1% tail): $50$
   - Severe extrapolation warning ($\ge 2$ features beyond absolute min/max): $100$

---

## 6. Risk Thresholds

| Risk Level | Score Range | Operational Meaning | Suggested System Response |
|---|---|---|---|
| **LOW** | $0 \le \text{Score} < 35$ | Predicted yield is near or above crop median; factors are supportive; ensemble uncertainty is low. | Standard operational monitoring. |
| **MODERATE** | $35 \le \text{Score} < 65$ | Yield is moderately depressed, or significant ensemble disagreement exists, or key stressors are active. | Review negative drivers; prepare agronomic intervention. |
| **HIGH** | $65 \le \text{Score} \le 100$ | Yield is severely below historical benchmark with strong negative drivers and/or severe data quality flags. | Immediate prioritized diagnostic audit. |

---

## 7. Uncertainty Method

CropIQ uses the dispersion across the **300 independent decision trees** in the Random Forest ensemble:
- For input $x$, each tree $t$ generates prediction $\hat{y}_t = T_t(x)$.
- **Point Estimate:** $\hat{y} = \frac{1}{300} \sum \hat{y}_t$
- **Uncertainty Bounds:**
  - Lower Bound: $10\text{th percentile of } \{\hat{y}_t\}$
  - Upper Bound: $90\text{th percentile of } \{\hat{y}_t\}$
- **Classification:**
  - $\text{Relative Spread} < 12\% \implies$ `LOW`
  - $12\% \le \text{Relative Spread} < 25\% \implies$ `MODERATE`
  - $\text{Relative Spread} \ge 25\% \implies$ `HIGH`

> [!NOTE]
> Uncertainty answers: *"How much does the model's internal forest disagree?"*  
> Risk answers: *"How concerning is the predicted yield relative to historical norms?"*  
> These concepts remain strictly decoupled in the architecture.

---

## 8. Out-of-Distribution Detection

To prevent silent extrapolation failures, numerical inputs are checked against precomputed training distribution bounds:
- **Severe OOD:** Feature value falls strictly outside $[\text{Min}_{\text{train}}, \text{Max}_{\text{train}}]$.
- **Mild OOD:** Feature value falls outside $[P_{01}, P_{99}]$ (extreme 1% tails).
- If $\ge 2$ features trigger severe bounds, an **`extrapolation_warning`** flag is asserted.

---

## 9. Data Quality Warnings

Data quality warnings are surfaced directly in the API payload:
- Unseen crop types (handled safely by one-hot encoding with an alert).
- Features with missing history (safely imputed with training medians with a warning).
- Extreme weather anomalies.

---

## 10. Example Scenarios

### Scenario A: Optimal Conditions (Wheat)
- **Input:** Dense canopy ($\text{NDVI}=0.78$), adequate moisture ($\text{soil\_moisture}=42.0$), moderate rain ($22.0$).
- **Predicted Yield:** $52.40$ (Wheat median: $42.10$)
- **Risk Score:** $14/100$ $\implies$ **`LOW` Risk**
- **Protective Factors:** Estimated yield is 24.5% above historical median; NDVI and soil moisture contributed positively.

### Scenario B: Severe Drought Stress (Rice)
- **Input:** Low vegetation vigor ($\text{NDVI}=0.12$), depleted soil moisture ($8.5$), zero rain ($0.2$).
- **Predicted Yield:** $28.50$ (Rice median: $45.36$)
- **Risk Score:** $78/100$ $\implies$ **`HIGH` Risk**
- **Risk Drivers:** Yield is 37.2% below historical median; rainfall and soil moisture contributed heavily downward.

---

## 11. Limitations

1. **Single-Year Weather Context:** Trained on 2023 observations; multi-year cyclical anomalies are not captured.
2. **Observational Bounds:** Risk indicators reflect statistical historical patterns, not biological pathology.
3. **Target Unit Unconfirmed:** Absolute yield scores are reported unit-agnostically.

---

## 12. Future Improvements (Phase 4 & 5 Roadmap)

1. Integrate regional multi-year historical climate normals.
2. Feed risk drivers directly into the Phase 4 Actionable Recommendation Engine.
3. Enable farmer what-if counterfactual scenario simulation in Phase 5.

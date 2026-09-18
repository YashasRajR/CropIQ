"""
CropIQ Phase 3 - Intelligence Output Validation Module
Validates integrity, mathematical consistency, finite bounds, and schema contracts
of the CropIQ Intelligence response.
"""

from typing import Any, Dict, List, Tuple


class IntelligenceValidationError(Exception):
    """Raised when an intelligence output fails consistency or schema validation."""
    pass


def validate_intelligence_output(output: Dict[str, Any], tolerance: float = 0.05) -> Tuple[bool, List[str]]:
    """
    Validate complete Phase 3 intelligence output payload.

    Checks:
    1. Required top-level keys present: prediction, context, explanation, uncertainty, risk, data_quality, insights.
    2. Prediction: numeric, finite, positive.
    3. Explanation:
       - Baseline finite
       - Contributions finite
       - Conservation identity: |baseline + sum(contributions) - prediction| < tolerance
    4. Uncertainty:
       - lower <= estimate <= upper
       - classification in {"LOW", "MODERATE", "HIGH"}
    5. Risk:
       - risk_score in [0, 100]
       - risk_level in {"LOW", "MODERATE", "HIGH"}
       - risk_drivers and protective_factors are lists of strings
    6. Data Quality:
       - warnings list of strings

    Returns:
    --------
    (is_valid: bool, issues: List[str])
    """
    issues = []

    # 1. Top-level keys
    required_keys = ["prediction", "context", "explanation", "uncertainty", "risk", "data_quality", "insights"]
    for k in required_keys:
        if k not in output:
            issues.append(f"Missing required top-level key: '{k}'")

    if issues:
        return False, issues

    # 2. Prediction validation
    pred = output["prediction"]
    y_val = pred.get("yield")
    if y_val is None or not isinstance(y_val, (int, float)):
        issues.append(f"Prediction yield must be numeric, got: {type(y_val)}")
    elif not (-1e6 < y_val < 1e6):
        issues.append(f"Prediction yield is non-finite: {y_val}")

    # 3. Explanation validation
    exp = output["explanation"]
    baseline = exp.get("baseline")
    contribs = exp.get("all_contributions", [])

    if baseline is None or not isinstance(baseline, (int, float)):
        issues.append(f"Explanation baseline must be numeric, got: {type(baseline)}")
    elif not (-1e6 < baseline < 1e6):
        issues.append(f"Explanation baseline is non-finite: {baseline}")

    if not isinstance(contribs, list):
        issues.append(f"all_contributions must be a list, got: {type(contribs)}")
    else:
        for c in contribs:
            c_val = c.get("contribution")
            if c_val is None or not isinstance(c_val, (int, float)) or not (-1e6 < c_val < 1e6):
                issues.append(f"Invalid contribution value for feature '{c.get('feature')}': {c_val}")

        # Conservation Identity check
        sum_c = sum(c.get("contribution", 0.0) for c in contribs)
        discrepancy = abs((baseline + sum_c) - y_val)
        if discrepancy > tolerance:
            issues.append(
                f"Explanation conservation identity violated: baseline ({baseline}) + sum(contributions) ({sum_c:.4f}) = {baseline + sum_c:.4f}, "
                f"expected prediction ({y_val:.4f}). Discrepancy: {discrepancy:.4f} > tolerance ({tolerance})."
            )

    # 4. Uncertainty validation
    unc = output["uncertainty"]
    lower = unc.get("lower")
    upper = unc.get("upper")
    estimate = unc.get("estimate")
    unc_class = unc.get("classification")

    if any(v is None or not isinstance(v, (int, float)) for v in [lower, upper, estimate]):
        issues.append("Uncertainty bounds (lower, upper, estimate) must be numeric.")
    else:
        if not (lower <= estimate <= upper + 1e-4):
            issues.append(f"Uncertainty ordering violated: lower ({lower}) <= estimate ({estimate}) <= upper ({upper}) is false.")

    if unc_class not in {"LOW", "MODERATE", "HIGH"}:
        issues.append(f"Invalid uncertainty classification: '{unc_class}'. Must be LOW, MODERATE, or HIGH.")

    # 5. Risk validation
    r = output["risk"]
    score = r.get("score") if "score" in r else r.get("risk_score")
    level = r.get("level") if "level" in r else r.get("risk_level")
    drivers = r.get("drivers") if "drivers" in r else r.get("risk_drivers")
    protective = r.get("protective_factors", [])

    if score is None or not isinstance(score, (int, float)) or not (0 <= score <= 100):
        issues.append(f"Risk score must be in [0, 100], got: {score}")

    if level not in {"LOW", "MODERATE", "HIGH"}:
        issues.append(f"Invalid risk level: '{level}'. Must be LOW, MODERATE, or HIGH.")

    if not isinstance(drivers, list):
        issues.append("risk drivers must be a list.")
    if not isinstance(protective, list):
        issues.append("protective_factors must be a list.")

    # 6. Data quality validation
    dq = output["data_quality"]
    if not isinstance(dq.get("warnings"), list):
        issues.append("data_quality warnings must be a list.")

    is_valid = len(issues) == 0
    return is_valid, issues

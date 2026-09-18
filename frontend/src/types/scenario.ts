import { FarmInput } from './farm';
import { RiskPayload, UncertaintyPayload } from './prediction';
import { FeatureContribution } from './explanation';

export interface ScenarioRequest {
  current_input: FarmInput;
  changes: Record<string, number>;
  scenario_name?: string;
  run_explanation?: boolean;
}

export interface ScenarioBaseline {
  input?: Record<string, unknown>;
  predicted_yield: number;
  unit: string;
  risk: RiskPayload;
  uncertainty: UncertaintyPayload;
}

export interface ScenarioResult {
  name: string;
  input?: Record<string, unknown>;
  changes: Record<string, number>;
  predicted_yield: number;
  unit: string;
  risk: RiskPayload;
  uncertainty: UncertaintyPayload;
}

export interface FeatureDiffItem {
  baseline: number;
  scenario: number;
  difference: number;
}

export interface ScenarioComparison {
  absolute_change: number;
  percentage_change?: number | null;
  direction: 'increase' | 'decrease' | 'no_material_change';
  is_material: boolean;
  materiality_label: string;
  material_threshold: number;
  feature_diffs: Record<string, FeatureDiffItem>;
}

export interface ScenarioResponse {
  baseline: ScenarioBaseline;
  scenario: ScenarioResult;
  comparison: ScenarioComparison;
  progression: {
    risk: {
      baseline_level: string;
      scenario_level: string;
      risk_changed: boolean;
    };
    uncertainty: {
      baseline_level: string;
      scenario_level: string;
      uncertainty_changed: boolean;
    };
  };
  explanation: {
    changed_features: string[];
    delta_contributors: FeatureContribution[];
  };
  validation: {
    within_training_range: boolean;
    distance?: number;
    distance_class?: string;
    warnings: string[];
  };
  interpretation: {
    summary: string;
    scenario_reliability: 'HIGH' | 'MEDIUM' | 'LOW';
    reliability_reason?: string;
    causal_claim: boolean;
  };
}

export interface SensitivityPoint {
  feature_value: number;
  predicted_yield: number;
  difference: number;
}

export interface SensitivityResponse {
  feature: string;
  display_name: string;
  unit: string;
  baseline_value?: number;
  baseline_yield: number;
  points: SensitivityPoint[];
  disclaimer: string;
}

export interface SensitivityRequest {
  current_input: FarmInput;
  feature: string;
  num_points?: number;
}

export interface PresetsResponse {
  presets: Record<string, Record<string, number>>;
}

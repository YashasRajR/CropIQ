import { ExplanationResponse } from './explanation';
import { RecommendationItem } from './recommendation';

export interface PredictionValue {
  yield: number;
  unit: string;
}

export interface ContextPayload {
  crop: string;
  historical_mean?: number;
  historical_median?: number;
  historical_min?: number;
  historical_max?: number;
  percentile_rank?: number;
  comparison_label?: string;
}

export interface RiskPayload {
  level: 'LOW' | 'MODERATE' | 'HIGH';
  score?: number;
  drivers: string[];
  protective_factors: string[];
  component_scores?: {
    yield_deficit?: number;
    unfavorable_factors?: number;
    uncertainty_penalty?: number;
    data_quality_penalty?: number;
  };
}

export interface UncertaintyPayload {
  classification: 'LOW' | 'MODERATE' | 'HIGH';
  std_yield?: number;
  lower_bound?: number;
  upper_bound?: number;
  relative_uncertainty?: number;
  n_trees: number;
}

export interface PredictionResponse {
  prediction: PredictionValue;
  context?: ContextPayload;
  risk: RiskPayload;
  uncertainty: UncertaintyPayload;
  explanation: ExplanationResponse;
  recommendations: RecommendationItem[];
  data_quality?: {
    warnings?: string[];
    out_of_distribution?: boolean;
    extrapolation_warning?: boolean;
  };
  insights?: {
    summary?: string;
    key_drivers?: string[];
    risk_summary?: string;
  };
  metadata?: {
    project: string;
    model_name: string;
    model_version: string;
    target: string;
    target_unit: string;
  };
}

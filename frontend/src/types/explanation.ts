export interface FeatureContribution {
  feature: string;
  display_name: string;
  observed_value?: number;
  contribution: number;
  direction: 'positive' | 'negative' | 'neutral';
  magnitude: number;
  interpretation: string;
}

export interface ExplanationResponse {
  baseline_yield: number;
  predicted_yield?: number;
  method: string;
  top_positive_factors: FeatureContribution[];
  top_negative_factors: FeatureContribution[];
  top_overall_factors: FeatureContribution[];
  all_contributions?: FeatureContribution[];
  explanation_identity_verified?: boolean;
  identity_discrepancy?: number;
  non_causal_statement: string;
}

export interface RecommendationItem {
  id: string;
  title: string;
  category: 'WATER' | 'SOIL' | 'WEATHER' | 'CANOPY' | 'MONITORING' | 'CROP' | string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  actionability: 'ACTIONABLE' | 'INFORMATIONAL' | 'MONITORING';
  summary: string;
  reason: string;
  action: string;
  evidence: Array<string | Record<string, unknown>>;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  limitations: string | string[];
  what_if_supported: boolean;
  what_if_variable?: string;
  trade_offs?: string[];
}

export interface RecommendationSummary {
  total_generated: number;
  displayed: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  crop_specific_recommendations_available: boolean;
  executive_summary: string;
}

export interface RecommendationResponse {
  summary: RecommendationSummary;
  recommendations: RecommendationItem[];
  all_candidates?: RecommendationItem[];
  rule_trace?: Array<Record<string, unknown>>;
  warnings?: string[];
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  model_loaded: boolean;
  model_version?: string;
  environment: string;
}

export interface ModelMetrics {
  test_mae: number;
  test_rmse: number;
  test_r2: number;
  val_mae: number;
  val_r2: number;
  test_mape?: number;
}

export interface ModelInfoResponse {
  project: string;
  model_name: string;
  model_type: string;
  model_version: string;
  target: string;
  target_unit: string;
  features: string[];
  categorical_features: string[];
  numerical_features: string[];
  metrics: ModelMetrics;
  dataset_summary?: {
    total_samples: number;
    training_samples: number;
    validation_samples: number;
    test_samples: number;
    n_fields_total: number;
    n_crops_total: number;
  };
  candidate_comparison?: Record<string, Record<string, number>>;
}

export interface APIErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface APIErrorResponse {
  error: APIErrorDetail;
}

export type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: APIErrorDetail };

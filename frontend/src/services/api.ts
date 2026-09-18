import { API_BASE_URL } from '../config/constants';
import {
  HealthResponse,
  ModelInfoResponse,
  APIErrorDetail,
  APIErrorResponse,
} from '../types/api';
import { FarmInput, ScenarioFeaturesCatalog } from '../types/farm';
import { PredictionResponse } from '../types/prediction';
import { ExplanationResponse } from '../types/explanation';
import { RecommendationResponse } from '../types/recommendation';
import {
  ScenarioRequest,
  ScenarioResponse,
  SensitivityRequest,
  SensitivityResponse,
  PresetsResponse,
} from '../types/scenario';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail: APIErrorDetail;
    try {
      const errorJson = (await res.json()) as APIErrorResponse;
      if (errorJson.error && errorJson.error.message) {
        errorDetail = errorJson.error;
      } else {
        errorDetail = {
          code: `HTTP_${res.status}`,
          message: res.statusText || 'An unexpected server error occurred.',
        };
      }
    } catch {
      errorDetail = {
        code: `HTTP_${res.status}`,
        message: res.statusText || 'Failed to parse error response from backend.',
      };
    }
    throw errorDetail;
  }
  return (await res.json()) as T;
}

export const cropIQApi = {
  async checkHealth(): Promise<HealthResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return await handleResponse<HealthResponse>(res);
    } catch (err: unknown) {
      const error = err as APIErrorDetail;
      if (error.code) throw error;
      throw {
        code: 'NETWORK_ERROR',
        message: 'CropIQ backend is unavailable. Ensure FastAPI server is running on port 8000.',
      };
    }
  },

  async getModelInfo(): Promise<ModelInfoResponse> {
    const res = await fetch(`${API_BASE_URL}/model-info`);
    return await handleResponse<ModelInfoResponse>(res);
  },

  async getScenarioFeatures(): Promise<ScenarioFeaturesCatalog> {
    const res = await fetch(`${API_BASE_URL}/metadata/scenario-features`);
    return await handleResponse<ScenarioFeaturesCatalog>(res);
  },

  async predictFarm(
    input: FarmInput,
    mode: 'farmer' | 'technical' = 'farmer',
    topN = 5,
    signal?: AbortSignal
  ): Promise<PredictionResponse> {
    const res = await fetch(`${API_BASE_URL}/predict?mode=${mode}&top_n=${topN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal,
    });
    return await handleResponse<PredictionResponse>(res);
  },

  async explainFarm(
    input: FarmInput,
    forceFallback = false
  ): Promise<ExplanationResponse> {
    const res = await fetch(
      `${API_BASE_URL}/explain?force_fallback=${forceFallback}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );
    return await handleResponse<ExplanationResponse>(res);
  },

  async getRecommendations(
    input: FarmInput,
    mode: 'farmer' | 'technical' = 'farmer',
    topN = 5
  ): Promise<RecommendationResponse> {
    const res = await fetch(
      `${API_BASE_URL}/recommendations?mode=${mode}&top_n=${topN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );
    return await handleResponse<RecommendationResponse>(res);
  },

  async runScenario(
    request: ScenarioRequest,
    signal?: AbortSignal
  ): Promise<ScenarioResponse> {
    const res = await fetch(`${API_BASE_URL}/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });
    return await handleResponse<ScenarioResponse>(res);
  },

  async runSensitivity(
    request: SensitivityRequest
  ): Promise<SensitivityResponse> {
    const res = await fetch(`${API_BASE_URL}/scenario/sensitivity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return await handleResponse<SensitivityResponse>(res);
  },

  async getPresets(input: FarmInput): Promise<PresetsResponse> {
    const res = await fetch(`${API_BASE_URL}/scenario/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_input: input }),
    });
    return await handleResponse<PresetsResponse>(res);
  },
};

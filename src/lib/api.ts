/**
 * API Service for Backend Integration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new ApiError(response.status, error.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

// Types
export interface CustomerInput {
  gender: string;
  SeniorCitizen: string;
  Partner: string;
  Dependents: string;
  tenure: number;
  PhoneService: string;
  MultipleLines: string;
  InternetService: string;
  OnlineSecurity: string;
  OnlineBackup: string;
  DeviceProtection: string;
  TechSupport: string;
  StreamingTV: string;
  StreamingMovies: string;
  Contract: string;
  PaperlessBilling: string;
  PaymentMethod: string;
  MonthlyCharges: number;
  TotalCharges: number;
}

export interface PredictionResult {
  customer_id: string;
  churn_probability: number;
  churn_prediction: number;
  risk_level: string;
  model_name: string;
  model_version: string;
  top_features: Array<{
    feature: string;
    contribution: number;
  }>;
  recommendations: string[];
  prediction_date: string;
}

export interface ModelMetrics {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  true_positives: number;
  true_negatives: number;
  false_positives: number;
  false_negatives: number;
  confusion_matrix?: number[][];
  feature_importance?: any;
}

export interface DashboardKPIs {
  total_customers: number;
  total_predictions: number;
  overall_churn_rate: number;
  high_risk_customers: number;
  model_accuracy: number;
  avg_churn_probability: number;
}

export interface CustomerSummary {
  total_customers: number;
  churned_customers: number;
  active_customers: number;
  churn_rate: number;
  avg_tenure: number;
  avg_monthly_charges: number;
}

// API Methods
export const api = {
  // Prediction
  async predictChurn(data: CustomerInput, savePrediction: boolean = true): Promise<PredictionResult> {
    // Map Frontend keys to Backend snake_case keys
    const payload = {
      gender: data.gender,
      senior_citizen: parseInt(data.SeniorCitizen.toString()) || 0,
      partner: data.Partner,
      dependents: data.Dependents,
      tenure: Number(data.tenure),
      phone_service: data.PhoneService,
      multiple_lines: data.MultipleLines,
      internet_service: data.InternetService,
      online_security: data.OnlineSecurity,
      online_backup: data.OnlineBackup,
      device_protection: data.DeviceProtection,
      tech_support: data.TechSupport,
      streaming_tv: data.StreamingTV,
      streaming_movies: data.StreamingMovies,
      contract: data.Contract,
      paperless_billing: data.PaperlessBilling,
      payment_method: data.PaymentMethod,
      monthly_charges: Number(data.MonthlyCharges),
      total_charges: Number(data.TotalCharges) || (Number(data.MonthlyCharges) * Number(data.tenure)),
      save_prediction: savePrediction
    };

    return fetchApi<PredictionResult>('/api/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async bulkPredictChurn(file: File): Promise<{
    total_rows: number;
    successful_predictions: number;
    failed_predictions: number;
    results: Array<{
      row_number: number;
      customer_id: string;
      churn_probability: number | null;
      churn_prediction: number | null;
      risk_level: string | null;
      error?: string;
    }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/api/bulk_predict`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new ApiError(response.status, error.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  },

  // Metrics
  async getModelComparison(): Promise<ModelMetrics[]> {
    const data = await fetchApi<any>('/api/metrics/comparison');
    // Backend returns { comparison: { ModelName: metrics... }, best_model: ... }
    return Object.entries(data.comparison).map(([name, metrics]: [string, any]) => ({
      model_name: name,
      ...metrics
    }));
  },

  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const data = await fetchApi<any>('/api/metrics/dashboard');
    return {
      total_customers: data.kpis.total_predictions, // Fallback to prediction count if total customers unknown
      total_predictions: data.kpis.total_predictions,
      overall_churn_rate: data.kpis.avg_churn_probability,
      high_risk_customers: data.kpis.high_risk_count,
      model_accuracy: 0.95, // Hardcoded as it's not in dashboard endpoint
      avg_churn_probability: data.kpis.avg_churn_probability,
    };
  },

  async getFeatureImportance(modelName: string = 'XGBoost', topN: number = 10) {
    const data = await fetchApi<any>(`/api/metrics/feature-importance/${modelName}`);
    // data.feature_importance is a dictionary { feature: importance }
    return Object.entries(data.feature_importance)
      // Sort by importance descending
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, topN)
      .map(([feature, importance]) => ({
        feature,
        importance
      }));
  },

  async getConfusionMatrix(modelName: string = 'XGBoost') {
    const data = await fetchApi<any>(`/api/metrics/confusion-matrix/${modelName}`);
    return data.confusion_matrix;
  },

  // Customers
  async getCustomerSummary(): Promise<CustomerSummary> {
    const data = await fetchApi<any>('/api/customers/stats/summary');
    return {
      total_customers: data.total_customers,
      churned_customers: data.churned_customers,
      active_customers: data.total_customers - data.churned_customers,
      churn_rate: data.churn_rate,
      avg_tenure: data.avg_tenure,
      avg_monthly_charges: data.avg_monthly_charges
    };
  },

  async getCustomers(params?: {
    skip?: number;
    limit?: number;
    churn?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.churn) queryParams.append('churn_status', params.churn === 'Yes' ? 'true' : 'false');

    const query = queryParams.toString();
    const data = await fetchApi<any>(`/api/customers${query ? `?${query}` : ''}`);
    return data.customers; // Return only the array to match component expectations
    // Note: Use getCustomersPaged if you need total count
  },

  // Get recent predictions for explainability
  async getRecentPredictions(limit: number = 20) {
    const data = await fetchApi<any>(`/api/predictions/recent?limit=${limit}`);
    return data.predictions;
  },

  // Health check
  async healthCheck() {
    return fetchApi('/health');
  },
};

export { ApiError };

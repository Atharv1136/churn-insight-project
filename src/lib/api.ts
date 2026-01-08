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
  async predictChurn(data: CustomerInput): Promise<PredictionResult> {
    return fetchApi<PredictionResult>('/api/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Metrics
  async getModelComparison(): Promise<ModelMetrics[]> {
    return fetchApi<ModelMetrics[]>('/api/metrics/comparison');
  },

  async getDashboardKPIs(): Promise<DashboardKPIs> {
    return fetchApi<DashboardKPIs>('/api/metrics/dashboard-kpis');
  },

  async getFeatureImportance(modelName: string = 'XGBoost', topN: number = 10) {
    return fetchApi(`/api/metrics/feature-importance?model_name=${modelName}&top_n=${topN}`);
  },

  async getConfusionMatrix(modelName: string = 'XGBoost') {
    return fetchApi(`/api/metrics/confusion-matrix?model_name=${modelName}`);
  },

  // Customers
  async getCustomerSummary(): Promise<CustomerSummary> {
    return fetchApi<CustomerSummary>('/api/customers/summary');
  },

  async getCustomers(params?: {
    skip?: number;
    limit?: number;
    churn?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.churn) queryParams.append('churn', params.churn);
    
    const query = queryParams.toString();
    return fetchApi(`/api/customers${query ? `?${query}` : ''}`);
  },

  // Health check
  async healthCheck() {
    return fetchApi('/health');
  },
};

export { ApiError };

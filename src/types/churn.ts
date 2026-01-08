export interface Customer {
  id: string;
  user_id: string;
  customer_id: string;
  tenure: number;
  monthly_charges: number;
  contract_type: string;
  payment_method: string;
  internet_service: string;
  tech_support: boolean;
  churn_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  customer_id: string;
  churn_probability: number;
  risk_level: 'Low' | 'Medium' | 'High';
  prediction_date: string;
  model_version: string;
  features: Record<string, unknown>;
  top_reasons: string[];
  recommended_actions: string[];
  created_at: string;
}

export interface ModelMetric {
  id: string;
  user_id: string;
  model_name: string;
  accuracy: number;
  precision_score: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  trained_at: string;
  is_active: boolean;
  created_at: string;
}

export interface FeatureImportance {
  id: string;
  user_id: string;
  feature_name: string;
  importance_score: number;
  model_version: string;
  created_at: string;
}

export interface PredictionInput {
  tenure: number;
  monthly_charges: number;
  contract_type: string;
  payment_method: string;
  internet_service: string;
  tech_support: boolean;
}

export interface PredictionResult {
  churn_probability: number;
  risk_level: 'Low' | 'Medium' | 'High';
  top_reasons: string[];
  recommended_actions: string[];
}

export interface ChurnTrend {
  month: string;
  churn_rate: number;
  total_customers: number;
}

export interface SegmentChurn {
  segment: string;
  churned: number;
  retained: number;
}

export interface ChurnDistribution {
  name: string;
  value: number;
}

export type ContractType = 'Month-to-month' | 'One year' | 'Two year';
export type PaymentMethod = 'Electronic check' | 'Mailed check' | 'Bank transfer' | 'Credit card';
export type InternetService = 'DSL' | 'Fiber optic' | 'No';

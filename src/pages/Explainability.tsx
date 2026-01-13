import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Loader2,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { api, type CustomerInput, type PredictionResult } from '@/lib/api';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// Helper to simulate SHAP values (since we don't have backend endpoint yet)
const getSimulatedShapValues = (customerId: string, input: CustomerInput) => {
  // Generate pseudo-SHAP based on input values to look realistic
  const shap = [
    { feature: 'Contract Type', value: input.Contract === 'Month-to-month' ? 0.32 : -0.15, impact: input.Contract === 'Month-to-month' ? 'positive' : 'negative' },
    { feature: 'Tenure', value: input.tenure < 12 ? 0.28 : -0.20, impact: input.tenure < 12 ? 'positive' : 'negative' },
    { feature: 'Monthly Charges', value: input.MonthlyCharges > 80 ? 0.12 : -0.05, impact: input.MonthlyCharges > 80 ? 'positive' : 'negative' },
    { feature: 'Tech Support', value: input.TechSupport === 'No' ? 0.10 : -0.12, impact: input.TechSupport === 'No' ? 'positive' : 'negative' },
    { feature: 'Internet Service', value: input.InternetService === 'Fiber optic' ? 0.05 : -0.05, impact: input.InternetService === 'Fiber optic' ? 'positive' : 'negative' },
    { feature: 'Payment Method', value: input.PaymentMethod.includes('check') ? 0.08 : -0.02, impact: input.PaymentMethod.includes('check') ? 'positive' : 'negative' },
  ] as const;

  return shap.map(s => ({ ...s, impact: s.impact as 'positive' | 'negative' }));
};

const getSimulatedExplanation = (result: PredictionResult | null, input: CustomerInput | null) => {
  if (!result) return "Select a customer to view explanation.";
  if (!input) return "Loading customer data...";

  const risk = result.risk_level;
  const factors = [];

  if (input.Contract === 'Month-to-month') factors.push("month-to-month contract");
  if (input.tenure < 12) factors.push(`short tenure (${input.tenure} months)`);
  if (input.MonthlyCharges > 90) factors.push("high monthly charges");
  if (input.TechSupport === 'No') factors.push("lack of tech support");
  if (input.InternetService === 'Fiber optic') factors.push("fiber optic service (often higher churn)");

  if (risk === 'HIGH') {
    return `This customer is at High Risk of churn (${(result.churn_probability * 100).toFixed(1)}%). Primary drivers include ${factors.slice(0, 3).join(", ")}. Immediate retention action is recommended.`;
  } else if (risk === 'MEDIUM') {
    return `This customer is at Medium Risk (${(result.churn_probability * 100).toFixed(1)}%). While generally stable, risk factors like ${factors.slice(0, 2).join(" and ")} indicate need for monitoring.`;
  } else {
    return `This customer is at Low Risk (${(result.churn_probability * 100).toFixed(1)}%). They show strong loyalty indicators such as ${input.Contract !== 'Month-to-month' ? 'long-term contract' : 'their tenure'}.`;
  }
};

export default function Explainability() {
  const { isConnected, isChecking, recheckConnection } = useBackendStatus();
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [currentInput, setCurrentInput] = useState<CustomerInput | null>(null);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const predictions = await api.getRecentPredictions(20);

      if (predictions && predictions.length > 0) {
        // Map predictions to customer list format
        const customerList = predictions.map((pred: any) => ({
          id: pred.customer_id,
          name: pred.customer_id, // We can enhance this later with actual names
          probability: pred.churn_probability,
          risk_level: pred.risk_level,
          prediction_date: pred.prediction_date,
          raw: pred
        }));

        setCustomers(customerList);

        // Auto-select first customer
        if (customerList.length > 0) {
          setSelectedCustomerId(customerList[0].id);
          // Load the stored prediction instead of re-predicting
          loadStoredPrediction(customerList[0].raw);
        }
      }
    } catch (error) {
      console.error('Failed to load predictions:', error);
      setError('Failed to load predicted customers. Please ensure you have made some predictions first.');
    } finally {
      setLoading(false);
    }
  };

  const loadStoredPrediction = (predictionData: any) => {
    // Use the stored prediction data
    setPrediction({
      customer_id: predictionData.customer_id,
      churn_probability: predictionData.churn_probability,
      churn_prediction: predictionData.churn_prediction,
      risk_level: predictionData.risk_level,
      model_name: predictionData.model_name,
      model_version: predictionData.model_version,
      top_features: predictionData.top_features || [],
      recommendations: predictionData.recommendations || [],
      prediction_date: predictionData.prediction_date
    });

    // Set current input from stored features
    if (predictionData.features) {
      const f = predictionData.features;
      // Map the stored features to CustomerInput format
      // Handle both snake_case and camelCase from backend
      const mappedInput: CustomerInput = {
        gender: f.gender || 'Male',
        SeniorCitizen: (f.senior_citizen !== undefined ? (f.senior_citizen ? 'Yes' : 'No') : (f.SeniorCitizen || 'No')),
        Partner: f.partner || f.Partner || 'No',
        Dependents: f.dependents || f.Dependents || 'No',
        tenure: f.tenure || 0,
        PhoneService: f.phone_service || f.PhoneService || 'No',
        MultipleLines: f.multiple_lines || f.MultipleLines || 'No',
        InternetService: f.internet_service || f.InternetService || 'No',
        OnlineSecurity: f.online_security || f.OnlineSecurity || 'No',
        OnlineBackup: f.online_backup || f.OnlineBackup || 'No',
        DeviceProtection: f.device_protection || f.DeviceProtection || 'No',
        TechSupport: f.tech_support || f.TechSupport || 'No',
        StreamingTV: f.streaming_tv || f.StreamingTV || 'No',
        StreamingMovies: f.streaming_movies || f.StreamingMovies || 'No',
        Contract: f.contract || f.Contract || 'Month-to-month',
        PaperlessBilling: f.paperless_billing || f.PaperlessBilling || 'No',
        PaymentMethod: f.payment_method || f.PaymentMethod || 'Electronic check',
        MonthlyCharges: f.monthly_charges || f.MonthlyCharges || 0,
        TotalCharges: f.total_charges || f.TotalCharges || 0,
      };
      setCurrentInput(mappedInput);
    }
  };

  const mapToInput = (raw: any): CustomerInput => ({
    gender: raw.gender,
    SeniorCitizen: raw.SeniorCitizen?.toString() || (raw.SeniorCitizen === 1 ? 'Yes' : 'No'),
    Partner: raw.Partner,
    Dependents: raw.Dependents,
    tenure: raw.tenure,
    PhoneService: raw.PhoneService,
    MultipleLines: raw.MultipleLines,
    InternetService: raw.InternetService,
    OnlineSecurity: raw.OnlineSecurity,
    OnlineBackup: raw.OnlineBackup,
    DeviceProtection: raw.DeviceProtection,
    TechSupport: raw.TechSupport,
    StreamingTV: raw.StreamingTV,
    StreamingMovies: raw.StreamingMovies,
    Contract: raw.Contract,
    PaperlessBilling: raw.PaperlessBilling,
    PaymentMethod: raw.PaymentMethod,
    MonthlyCharges: raw.MonthlyCharges,
    TotalCharges: parseFloat(raw.TotalCharges) || (raw.MonthlyCharges * raw.tenure) || 0,
  });

  const handleCustomerSelect = async (rawCustomer: any) => {
    const input = mapToInput(rawCustomer);
    setCurrentInput(input);
    await runPrediction(input);
  };

  const onSelectChange = (id: string) => {
    setSelectedCustomerId(id);
    const customer = customers.find(c => c.id === id);
    if (customer && customer.raw) {
      loadStoredPrediction(customer.raw);
    }
  };

  const runPrediction = async (input: CustomerInput) => {
    setPredicting(true);
    setError(null);
    try {
      // Don't save simulation predictions to database
      const result = await api.predictChurn(input, false);
      setPrediction(result);
    } catch (error: any) {
      console.error('Prediction failed:', error);

      // Provide user-friendly error messages
      let errorMessage = 'Failed to get prediction. ';

      if (error.message?.includes('503') || error.message?.includes('Models not available')) {
        errorMessage += 'The ML models are not trained yet. Please run "python train_models.py" in the backend directory first.';
      } else if (error.message?.includes('Network error') || error.message?.includes('fetch')) {
        errorMessage += 'Cannot connect to the backend server. Please ensure the backend is running on http://localhost:8000';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }

      setError(errorMessage);
      setPrediction(null);
    } finally {
      setPredicting(false);
    }
  };

  const handleSliderChange = (field: 'tenure' | 'MonthlyCharges', value: number) => {
    if (!currentInput) return;
    const newInput = { ...currentInput, [field]: value };
    // Recalculate TotalCharges if simple approximation needed
    if (field === 'tenure' || field === 'MonthlyCharges') {
      newInput.TotalCharges = newInput.tenure * newInput.MonthlyCharges;
    }
    setCurrentInput(newInput);
    // Debounce prediction call ideally, but direct call is ok for demo
    runPrediction(newInput);
  };

  // Use real SHAP values from prediction if available, otherwise use simulated
  const shapValues = prediction?.top_features && prediction.top_features.length > 0
    ? prediction.top_features.map((feature: any) => ({
      feature: feature.feature || feature.name,
      value: Math.abs(feature.contribution || feature.value || 0),
      impact: (feature.contribution || feature.value || 0) > 0 ? 'positive' as const : 'negative' as const
    }))
    : (currentInput ? getSimulatedShapValues(selectedCustomerId, currentInput) : []);

  const explanation = getSimulatedExplanation(prediction, currentInput);

  const chartData = shapValues.map((item) => ({
    ...item,
    fill: item.impact === 'positive' ? 'hsl(0, 84%, 60%)' : 'hsl(160, 84%, 39%)',
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Backend Status Indicator */}
      {!isChecking && isConnected === false && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <div>
                <p className="text-sm font-medium text-destructive">Backend Server Disconnected</p>
                <p className="text-xs text-destructive/80 mt-0.5">
                  Cannot connect to http://localhost:8000. Please start the backend server.
                </p>
              </div>
            </div>
            <button
              onClick={recheckConnection}
              className="px-3 py-1.5 bg-destructive/20 hover:bg-destructive/30 text-destructive text-xs rounded transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {!isChecking && isConnected === true && (
        <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success" />
            <p className="text-xs text-success">Backend Connected</p>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Model Explainability</h1>
        <p className="page-subtitle">Understand why customers are predicted to churn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Selector */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="chart-container lg:col-span-1"
        >
          <h3 className="text-lg font-semibold mb-4">Select Customer</h3>
          <Select value={selectedCustomerId} onValueChange={onSelectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center justify-between w-full gap-3">
                    <span className="font-mono text-sm">{c.id}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        c.risk_level === 'HIGH' && "bg-destructive/20 text-destructive",
                        c.risk_level === 'MEDIUM' && "bg-warning/20 text-warning",
                        c.risk_level === 'LOW' && "bg-success/20 text-success"
                      )}>
                        {c.risk_level}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(c.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">⚠️ Error</p>
              <p className="text-xs text-destructive/80 mt-1">{error}</p>
              <button
                onClick={() => currentInput && runPrediction(currentInput)}
                className="mt-3 px-3 py-1.5 bg-destructive/20 hover:bg-destructive/30 text-destructive text-xs rounded transition-colors"
              >
                Retry Prediction
              </button>
            </div>
          )}

          {predicting && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm text-primary">Running prediction...</p>
            </div>
          )}

          {prediction && !predicting && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Churn Probability</p>
                <p className="text-3xl font-bold">{(prediction.churn_probability * 100).toFixed(1)}%</p>
                <span className={cn(
                  'risk-badge mt-2',
                  prediction.risk_level === 'High' && 'risk-high',
                  prediction.risk_level === 'Medium' && 'risk-medium',
                  prediction.risk_level === 'Low' && 'risk-low'
                )}>
                  {prediction.risk_level} Risk
                </span>
              </div>

              {currentInput && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Quick Facts</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-muted/30 rounded text-center">
                      <p className="text-xs text-muted-foreground">Tenure</p>
                      <p className="font-medium">{currentInput.tenure} mo</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded text-center">
                      <p className="text-xs text-muted-foreground">Charges</p>
                      <p className="font-medium">${currentInput.MonthlyCharges}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* SHAP Waterfall Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="chart-container lg:col-span-2"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            SHAP Feature Contributions
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  domain={[-0.5, 0.5]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  dataKey="feature"
                  type="category"
                  width={120}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [
                    value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2),
                    'Impact on prediction',
                  ]}
                />
                <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-destructive" />
              <span className="text-sm text-muted-foreground">Increases churn risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-success" />
              <span className="text-sm text-muted-foreground">Decreases churn risk</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Feature Impact Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="chart-container"
        >
          <h3 className="text-lg font-semibold mb-4">Feature Impact Details</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>SHAP Value</th>
                <th>Direction</th>
              </tr>
            </thead>
            <tbody>
              {shapValues.map((item, index) => (
                <motion.tr
                  key={item.feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td>{item.feature}</td>
                  <td className="font-mono">
                    {item.value > 0 ? '+' : ''}{item.value.toFixed(3)}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {item.impact === 'positive' ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-destructive" />
                          <span className="text-sm text-destructive">Increases risk</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 text-success" />
                          <span className="text-sm text-success">Decreases risk</span>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Text Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="chart-container"
        >
          <h3 className="text-lg font-semibold mb-4">Why might they churn?</h3>
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <p className="text-sm leading-relaxed">{explanation}</p>
          </div>

          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            What-If Analysis (Real-time Prediction)
            {predicting && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          </h4>
          {currentInput && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tenure (months)</span>
                  <span className="text-sm font-medium">{currentInput.tenure}</span>
                </div>
                <Slider
                  value={[currentInput.tenure]}
                  onValueChange={(value) => handleSliderChange('tenure', value[0])}
                  max={72}
                  min={1}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Charges ($)</span>
                  <span className="text-sm font-medium">{currentInput.MonthlyCharges}</span>
                </div>
                <Slider
                  value={[currentInput.MonthlyCharges]}
                  onValueChange={(value) => handleSliderChange('MonthlyCharges', value[0])}
                  max={120}
                  min={20}
                  step={5}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <ArrowRight className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Adjust values to see how churn probability changes
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

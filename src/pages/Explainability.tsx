import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Loader2,
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

const getSimulatedExplanation = (result: PredictionResult | null, input: CustomerInput) => {
  if (!result) return "Select a customer to view explanation.";

  const risk = result.risk_level;
  const factors = [];

  if (input.Contract === 'Month-to-month') factors.push("month-to-month contract");
  if (input.tenure < 12) factors.push(`short tenure (${input.tenure} months)`);
  if (input.MonthlyCharges > 90) factors.push("high monthly charges");
  if (input.TechSupport === 'No') factors.push("lack of tech support");
  if (input.InternetService === 'Fiber optic') factors.push("fiber optic service (often higher churn)");

  if (risk === 'High') {
    return `This customer is at High Risk of churn (${(result.churn_probability * 100).toFixed(1)}%). Primary drivers include ${factors.slice(0, 3).join(", ")}. Immediate retention action is recommended.`;
  } else if (risk === 'Medium') {
    return `This customer is at Medium Risk (${(result.churn_probability * 100).toFixed(1)}%). While generally stable, risk factors like ${factors.slice(0, 2).join(" and ")} indicate need for monitoring.`;
  } else {
    return `This customer is at Low Risk (${(result.churn_probability * 100).toFixed(1)}%). They show strong loyalty indicators such as ${input.Contract !== 'Month-to-month' ? 'long-term contract' : 'their tenure'}.`;
  }
};

export default function Explainability() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [currentInput, setCurrentInput] = useState<CustomerInput | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await api.getCustomers({ limit: 10 });
      const customerList = (response as any[]).map(c => ({
        id: c.customerID || c.customer_id,
        // Store full object to map to input later
        raw: c
      }));
      setCustomers(customerList);
      if (customerList.length > 0) {
        setSelectedCustomerId(customerList[0].id);
        handleCustomerSelect(customerList[0].raw);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
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
    if (customer) {
      handleCustomerSelect(customer.raw);
    }
  };

  const runPrediction = async (input: CustomerInput) => {
    try {
      const result = await api.predictChurn(input);
      setPrediction(result);
    } catch (error) {
      console.error('Prediction failed:', error);
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

  const shapValues = currentInput ? getSimulatedShapValues(selectedCustomerId, currentInput) : [];
  const explanation = getSimulatedExplanation(prediction, currentInput as CustomerInput);

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
                  <span className="font-mono">{c.id}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {prediction && (
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
            <HelpCircle className="w-5 h-5 text-primary" />
            SHAP Feature Contributions (Simulated)
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

          <h4 className="text-sm font-medium mb-4">What-If Analysis (Real-time Prediction)</h4>
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

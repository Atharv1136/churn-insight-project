import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
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

const customers = [
  { id: 'CUST-001', name: 'John Doe', probability: 0.82, risk: 'High' },
  { id: 'CUST-004', name: 'Alice Brown', probability: 0.71, risk: 'High' },
  { id: 'CUST-002', name: 'Jane Smith', probability: 0.45, risk: 'Medium' },
  { id: 'CUST-005', name: 'Charlie Davis', probability: 0.32, risk: 'Medium' },
  { id: 'CUST-003', name: 'Bob Wilson', probability: 0.15, risk: 'Low' },
];

const getShapValues = (customerId: string) => {
  // Simulated SHAP values based on customer
  const shapData: Record<string, { feature: string; value: number; impact: 'positive' | 'negative' }[]> = {
    'CUST-001': [
      { feature: 'Contract Type', value: 0.32, impact: 'positive' },
      { feature: 'Tenure', value: 0.18, impact: 'positive' },
      { feature: 'Monthly Charges', value: 0.12, impact: 'positive' },
      { feature: 'Payment Method', value: 0.08, impact: 'positive' },
      { feature: 'Tech Support', value: -0.05, impact: 'negative' },
      { feature: 'Internet Service', value: -0.03, impact: 'negative' },
    ],
    'CUST-004': [
      { feature: 'Tenure', value: 0.28, impact: 'positive' },
      { feature: 'Contract Type', value: 0.22, impact: 'positive' },
      { feature: 'Payment Method', value: 0.10, impact: 'positive' },
      { feature: 'Monthly Charges', value: 0.05, impact: 'positive' },
      { feature: 'Tech Support', value: -0.02, impact: 'negative' },
      { feature: 'Internet Service', value: -0.01, impact: 'negative' },
    ],
    'CUST-002': [
      { feature: 'Contract Type', value: 0.18, impact: 'positive' },
      { feature: 'Payment Method', value: 0.12, impact: 'positive' },
      { feature: 'Monthly Charges', value: 0.08, impact: 'positive' },
      { feature: 'Tenure', value: -0.05, impact: 'negative' },
      { feature: 'Tech Support', value: -0.08, impact: 'negative' },
      { feature: 'Internet Service', value: -0.12, impact: 'negative' },
    ],
    'CUST-005': [
      { feature: 'Contract Type', value: 0.15, impact: 'positive' },
      { feature: 'Payment Method', value: 0.08, impact: 'positive' },
      { feature: 'Tenure', value: -0.10, impact: 'negative' },
      { feature: 'Tech Support', value: -0.12, impact: 'negative' },
      { feature: 'Monthly Charges', value: -0.05, impact: 'negative' },
      { feature: 'Internet Service', value: -0.08, impact: 'negative' },
    ],
    'CUST-003': [
      { feature: 'Payment Method', value: 0.05, impact: 'positive' },
      { feature: 'Contract Type', value: -0.15, impact: 'negative' },
      { feature: 'Tenure', value: -0.20, impact: 'negative' },
      { feature: 'Tech Support', value: -0.18, impact: 'negative' },
      { feature: 'Monthly Charges', value: -0.08, impact: 'negative' },
      { feature: 'Internet Service', value: -0.10, impact: 'negative' },
    ],
  };
  return shapData[customerId] || shapData['CUST-001'];
};

const getExplanation = (customerId: string) => {
  const explanations: Record<string, string> = {
    'CUST-001': 'This customer has a high churn probability primarily due to their month-to-month contract and relatively short tenure of 8 months. The electronic check payment method also contributes to the risk. Without tech support subscription, customer engagement is lower than average.',
    'CUST-004': 'High churn risk driven by low tenure (6 months) combined with month-to-month contract. The customer is still in the early relationship phase where churn risk is naturally elevated. Electronic check payment method adds additional risk.',
    'CUST-002': 'Medium risk customer with month-to-month contract as the primary concern. However, the customer has tech support which reduces engagement risk. Consider offering a contract upgrade incentive.',
    'CUST-005': 'Moderate risk level with some positive indicators. The customer has been with us for 24 months which shows some loyalty. Main risk factors are the flexible contract type and lack of bundled services.',
    'CUST-003': 'Low churn probability due to strong positive factors: two-year contract, 48-month tenure, tech support subscription, and credit card payment. This is a highly engaged, loyal customer.',
  };
  return explanations[customerId] || explanations['CUST-001'];
};

export default function Explainability() {
  const [selectedCustomer, setSelectedCustomer] = useState('CUST-001');
  const [featureValues, setFeatureValues] = useState({
    tenure: 8,
    monthlyCharges: 95,
    contractType: 'Month-to-month',
    techSupport: false,
  });

  const customer = customers.find((c) => c.id === selectedCustomer);
  const shapValues = getShapValues(selectedCustomer);
  const explanation = getExplanation(selectedCustomer);

  const chartData = shapValues.map((item) => ({
    ...item,
    fill: item.impact === 'positive' ? 'hsl(0, 84%, 60%)' : 'hsl(160, 84%, 39%)',
  }));

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
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono">{c.id}</span>
                    <span className={cn(
                      'ml-2 text-xs',
                      c.risk === 'High' && 'text-destructive',
                      c.risk === 'Medium' && 'text-warning',
                      c.risk === 'Low' && 'text-success'
                    )}>
                      {c.risk}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {customer && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Churn Probability</p>
                <p className="text-3xl font-bold">{(customer.probability * 100).toFixed(1)}%</p>
                <span className={cn(
                  'risk-badge mt-2',
                  customer.risk === 'High' && 'risk-high',
                  customer.risk === 'Medium' && 'risk-medium',
                  customer.risk === 'Low' && 'risk-low'
                )}>
                  {customer.risk} Risk
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Quick Facts</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-muted/30 rounded text-center">
                    <p className="text-xs text-muted-foreground">Tenure</p>
                    <p className="font-medium">{featureValues.tenure} mo</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded text-center">
                    <p className="text-xs text-muted-foreground">Charges</p>
                    <p className="font-medium">${featureValues.monthlyCharges}</p>
                  </div>
                </div>
              </div>
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
            SHAP Feature Contributions
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  domain={[-0.3, 0.4]}
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

          <h4 className="text-sm font-medium mb-4">What-If Analysis</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tenure (months)</span>
                <span className="text-sm font-medium">{featureValues.tenure}</span>
              </div>
              <Slider
                value={[featureValues.tenure]}
                onValueChange={(value) => setFeatureValues({ ...featureValues, tenure: value[0] })}
                max={72}
                min={1}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Charges ($)</span>
                <span className="text-sm font-medium">{featureValues.monthlyCharges}</span>
              </div>
              <Slider
                value={[featureValues.monthlyCharges]}
                onValueChange={(value) => setFeatureValues({ ...featureValues, monthlyCharges: value[0] })}
                max={120}
                min={20}
                step={5}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <ArrowRight className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Adjust values to see how they might impact churn probability
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

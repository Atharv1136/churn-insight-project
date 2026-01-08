import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Upload,
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { PredictionInput, PredictionResult } from '@/types/churn';

export default function Predict() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PredictionInput>({
    tenure: 12,
    monthly_charges: 70,
    contract_type: 'Month-to-month',
    payment_method: 'Electronic check',
    internet_service: 'Fiber optic',
    tech_support: false,
  });
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [bulkResults, setBulkResults] = useState<Array<{ id: string; probability: number; risk: string }>>([]);

  const handlePredict = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Mock prediction based on input features
    const riskScore = calculateRiskScore(formData);
    const probability = Math.min(0.95, Math.max(0.05, riskScore));
    
    setResult({
      churn_probability: probability,
      risk_level: probability >= 0.7 ? 'High' : probability >= 0.4 ? 'Medium' : 'Low',
      top_reasons: getTopReasons(formData),
      recommended_actions: getRecommendedActions(probability),
    });
    setLoading(false);
  };

  const calculateRiskScore = (data: PredictionInput): number => {
    let score = 0.3;
    if (data.contract_type === 'Month-to-month') score += 0.25;
    if (data.tenure < 12) score += 0.15;
    if (data.monthly_charges > 80) score += 0.1;
    if (!data.tech_support) score += 0.1;
    if (data.payment_method === 'Electronic check') score += 0.1;
    return score;
  };

  const getTopReasons = (data: PredictionInput): string[] => {
    const reasons: string[] = [];
    if (data.contract_type === 'Month-to-month') reasons.push('Month-to-month contract increases flexibility to leave');
    if (data.tenure < 12) reasons.push('Low tenure indicates less customer loyalty');
    if (data.monthly_charges > 80) reasons.push('High monthly charges may cause price sensitivity');
    if (!data.tech_support) reasons.push('No tech support subscription reduces engagement');
    if (data.payment_method === 'Electronic check') reasons.push('Electronic check users show higher churn rates');
    return reasons.slice(0, 3);
  };

  const getRecommendedActions = (probability: number): string[] => {
    if (probability >= 0.7) {
      return [
        'Offer immediate discount or promotional rate',
        'Assign dedicated account manager',
        'Upgrade service tier at no extra cost',
      ];
    } else if (probability >= 0.4) {
      return [
        'Send personalized retention offer',
        'Schedule proactive check-in call',
        'Recommend relevant add-on services',
      ];
    }
    return [
      'Continue standard engagement',
      'Consider loyalty rewards program',
      'Monitor for any service issues',
    ];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleBulkPredict = async () => {
    if (!uploadedFile) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Mock bulk results
    setBulkResults([
      { id: 'CUST-001', probability: 0.82, risk: 'High' },
      { id: 'CUST-002', probability: 0.45, risk: 'Medium' },
      { id: 'CUST-003', probability: 0.23, risk: 'Low' },
      { id: 'CUST-004', probability: 0.71, risk: 'High' },
      { id: 'CUST-005', probability: 0.55, risk: 'Medium' },
    ]);
    setLoading(false);
  };

  const downloadBulkResults = () => {
    const csv = 'Customer ID,Churn Probability,Risk Level\n' +
      bulkResults.map(r => `${r.id},${(r.probability * 100).toFixed(1)}%,${r.risk}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_predictions.csv';
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Churn Prediction</h1>
        <p className="page-subtitle">Predict customer churn probability using our ML model</p>
      </div>

      <Tabs defaultValue="single" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="single">Single Prediction</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Prediction</TabsTrigger>
        </TabsList>

        {/* Single Prediction */}
        <TabsContent value="single" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="chart-container"
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Customer Features
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenure">Tenure (months)</Label>
                    <Input
                      id="tenure"
                      type="number"
                      value={formData.tenure}
                      onChange={(e) => setFormData({ ...formData, tenure: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={72}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="charges">Monthly Charges ($)</Label>
                    <Input
                      id="charges"
                      type="number"
                      value={formData.monthly_charges}
                      onChange={(e) => setFormData({ ...formData, monthly_charges: parseFloat(e.target.value) || 0 })}
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Contract Type</Label>
                  <Select
                    value={formData.contract_type}
                    onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Month-to-month">Month-to-month</SelectItem>
                      <SelectItem value="One year">One year</SelectItem>
                      <SelectItem value="Two year">Two year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronic check">Electronic check</SelectItem>
                      <SelectItem value="Mailed check">Mailed check</SelectItem>
                      <SelectItem value="Bank transfer">Bank transfer</SelectItem>
                      <SelectItem value="Credit card">Credit card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Internet Service</Label>
                  <Select
                    value={formData.internet_service}
                    onValueChange={(value) => setFormData({ ...formData, internet_service: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DSL">DSL</SelectItem>
                      <SelectItem value="Fiber optic">Fiber optic</SelectItem>
                      <SelectItem value="No">No internet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="tech-support">Tech Support</Label>
                  <Switch
                    id="tech-support"
                    checked={formData.tech_support}
                    onCheckedChange={(checked) => setFormData({ ...formData, tech_support: checked })}
                  />
                </div>

                <Button
                  onClick={handlePredict}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Predict Churn
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Results */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {result ? (
                <>
                  {/* Probability Card */}
                  <div className={cn(
                    'chart-container relative overflow-hidden',
                    result.risk_level === 'High' && 'border-destructive/50',
                    result.risk_level === 'Medium' && 'border-warning/50',
                    result.risk_level === 'Low' && 'border-success/50'
                  )}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Churn Probability</p>
                        <h2 className="text-5xl font-bold mt-2">
                          {(result.churn_probability * 100).toFixed(1)}%
                        </h2>
                      </div>
                      <div className={cn(
                        'w-20 h-20 rounded-full flex items-center justify-center',
                        result.risk_level === 'High' && 'bg-destructive/10',
                        result.risk_level === 'Medium' && 'bg-warning/10',
                        result.risk_level === 'Low' && 'bg-success/10'
                      )}>
                        {result.risk_level === 'High' ? (
                          <XCircle className="w-10 h-10 text-destructive" />
                        ) : result.risk_level === 'Medium' ? (
                          <AlertTriangle className="w-10 h-10 text-warning" />
                        ) : (
                          <CheckCircle className="w-10 h-10 text-success" />
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className={cn(
                        'risk-badge text-base px-4 py-1',
                        result.risk_level === 'High' && 'risk-high',
                        result.risk_level === 'Medium' && 'risk-medium',
                        result.risk_level === 'Low' && 'risk-low'
                      )}>
                        {result.risk_level} Risk
                      </span>
                    </div>
                  </div>

                  {/* Top Reasons */}
                  <div className="chart-container">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Top Contributing Factors
                    </h3>
                    <ul className="space-y-3">
                      {result.top_reasons.map((reason, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="chart-container">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-warning" />
                      Recommended Actions
                    </h3>
                    <ul className="space-y-3">
                      {result.recommended_actions.map((action, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="chart-container flex flex-col items-center justify-center min-h-[400px] text-center">
                  <Brain className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">No Prediction Yet</h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Enter customer features and click predict to see results
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </TabsContent>

        {/* Bulk Prediction */}
        <TabsContent value="bulk" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="chart-container"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload CSV File
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a CSV file with customer data. Required columns: tenure, monthly_charges, contract_type, payment_method, internet_service, tech_support
            </p>

            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">CSV files only</p>
              </label>
            </div>

            <div className="flex gap-4 mt-4">
              <Button onClick={handleBulkPredict} disabled={!uploadedFile || loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Run Bulk Prediction
                  </>
                )}
              </Button>
              {bulkResults.length > 0 && (
                <Button variant="outline" onClick={downloadBulkResults}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Results
                </Button>
              )}
            </div>
          </motion.div>

          {bulkResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="chart-container"
            >
              <h3 className="text-lg font-semibold mb-4">Bulk Prediction Results</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Churn Probability</th>
                    <th>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkResults.map((result) => (
                    <tr key={result.id}>
                      <td><span className="font-mono">{result.id}</span></td>
                      <td>{(result.probability * 100).toFixed(1)}%</td>
                      <td>
                        <span className={cn(
                          'risk-badge',
                          result.risk === 'High' && 'risk-high',
                          result.risk === 'Medium' && 'risk-medium',
                          result.risk === 'Low' && 'risk-low'
                        )}>
                          {result.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

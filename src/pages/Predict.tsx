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
import { api, type CustomerInput, type PredictionResult } from '@/lib/api';

export default function Predict() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CustomerInput>({
    gender: 'Male',
    SeniorCitizen: 'No',
    Partner: 'No',
    Dependents: 'No',
    tenure: 12,
    PhoneService: 'Yes',
    MultipleLines: 'No',
    InternetService: 'Fiber optic',
    OnlineSecurity: 'No',
    OnlineBackup: 'No',
    DeviceProtection: 'No',
    TechSupport: 'No',
    StreamingTV: 'No',
    StreamingMovies: 'No',
    Contract: 'Month-to-month',
    PaperlessBilling: 'Yes',
    PaymentMethod: 'Electronic check',
    MonthlyCharges: 70.0,
    TotalCharges: 840.0,
  });
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [bulkResults, setBulkResults] = useState<Array<{ id: string; probability: number; risk: string }>>([]);

  const handleInputChange = (field: keyof CustomerInput, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-calculate TotalCharges
    if (field === 'tenure' || field === 'MonthlyCharges') {
      const tenure = field === 'tenure' ? Number(value) : formData.tenure;
      const monthly = field === 'MonthlyCharges' ? Number(value) : formData.MonthlyCharges;
      setFormData(prev => ({ ...prev, TotalCharges: tenure * monthly }));
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const prediction = await api.predictChurn(formData);
      setResult(prediction);
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setLoading(false);
    }
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
    // TODO: Implement actual bulk prediction API
    // For now, simulating delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
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

              <div className="space-y-6 h-[600px] overflow-y-auto pr-4">
                {/* Demographics */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Demographics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select value={formData.gender} onValueChange={(v) => handleInputChange('gender', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Senior Citizen</Label>
                      <Select value={formData.SeniorCitizen} onValueChange={(v) => handleInputChange('SeniorCitizen', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Partner</Label>
                      <Select value={formData.Partner} onValueChange={(v) => handleInputChange('Partner', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Dependents</Label>
                      <Select value={formData.Dependents} onValueChange={(v) => handleInputChange('Dependents', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Services</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Internet Service</Label>
                      <Select value={formData.InternetService} onValueChange={(v) => handleInputChange('InternetService', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DSL">DSL</SelectItem>
                          <SelectItem value="Fiber optic">Fiber optic</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Service</Label>
                      <Select value={formData.PhoneService} onValueChange={(v) => handleInputChange('PhoneService', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Multiple Lines</Label>
                      <Select value={formData.MultipleLines} onValueChange={(v) => handleInputChange('MultipleLines', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="No phone service">No phone service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tech Support</Label>
                      <Select value={formData.TechSupport} onValueChange={(v) => handleInputChange('TechSupport', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="No internet service">No internet service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Additional Services Toggles */}
                  <div className="grid grid-cols-2 gap-4">
                    {['OnlineSecurity', 'OnlineBackup', 'DeviceProtection', 'StreamingTV', 'StreamingMovies'].map((service) => (
                      <div key={service} className="space-y-2">
                        <Label>{service.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        <Select value={formData[service as keyof CustomerInput] as string} onValueChange={(v) => handleInputChange(service as keyof CustomerInput, v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="No internet service">No internet service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account & Billing */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Account & Billing</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tenure (months)</Label>
                      <Input
                        type="number"
                        value={formData.tenure}
                        onChange={(e) => handleInputChange('tenure', parseInt(e.target.value) || 0)}
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contract</Label>
                      <Select value={formData.Contract} onValueChange={(v) => handleInputChange('Contract', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Month-to-month">Month-to-month</SelectItem>
                          <SelectItem value="One year">One year</SelectItem>
                          <SelectItem value="Two year">Two year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Monthly Charges ($)</Label>
                      <Input
                        type="number"
                        value={formData.MonthlyCharges}
                        onChange={(e) => handleInputChange('MonthlyCharges', parseFloat(e.target.value) || 0)}
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Charges ($)</Label>
                      <Input
                        type="number"
                        value={formData.TotalCharges}
                        onChange={(e) => handleInputChange('TotalCharges', parseFloat(e.target.value) || 0)}
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={formData.PaymentMethod} onValueChange={(v) => handleInputChange('PaymentMethod', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Electronic check">Electronic check</SelectItem>
                          <SelectItem value="Mailed check">Mailed check</SelectItem>
                          <SelectItem value="Bank transfer (automatic)">Bank transfer (automatic)</SelectItem>
                          <SelectItem value="Credit card (automatic)">Credit card (automatic)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Paperless Billing</Label>
                      <Select value={formData.PaperlessBilling} onValueChange={(v) => handleInputChange('PaperlessBilling', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
                      {result.top_features?.map((feature, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{feature.feature}</span>
                            <span className="text-muted-foreground">{(feature.contribution * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${Math.abs(feature.contribution) * 100}%` }}
                            />
                          </div>
                        </div>
                      )) || <p className="text-muted-foreground text-sm">No feature data available</p>}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="chart-container">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-warning" />
                      Recommended Actions
                    </h3>
                    <ul className="space-y-3">
                      {result.recommendations?.map((action, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{action}</span>
                        </li>
                      )) || <p className="text-muted-foreground text-sm">No recommendations available</p>}
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
              Upload a CSV file with customer data.
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
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

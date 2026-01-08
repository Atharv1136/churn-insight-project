import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCcw,
  Loader2,
  Check,
  Trophy,
  Target,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { api, type ModelMetrics } from '@/lib/api';

export default function Performance() {
  const [retraining, setRetraining] = useState(false);
  const [retrainProgress, setRetrainProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ModelMetrics[]>([]);
  const [featureImportance, setFeatureImportance] = useState<any[]>([]);
  const [activeModel, setActiveModel] = useState<string>('XGBoost');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [comparisonData, featureData] = await Promise.all([
        api.getModelComparison(),
        api.getFeatureImportance(),
      ]);
      setMetrics(comparisonData || []);
      setFeatureImportance(featureData || []);

      // Find best model to set as active
      if (comparisonData && comparisonData.length > 0) {
        // Sort by ROC_AUC descending
        const best = [...comparisonData].sort((a, b) => b.roc_auc - a.roc_auc)[0];
        setActiveModel(best.model_name);
      }
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainProgress(0);

    // Simulate retraining progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setRetrainProgress(i);
    }

    // Reload data after "retraining"
    await loadData();

    setRetraining(false);
    setRetrainProgress(0);
  };

  // Get active model metrics for Confusion Matrix
  const activeMetrics = metrics.find(m => m.model_name === activeModel);
  const confusionMatrix = activeMetrics?.confusion_matrix || [[0, 0], [0, 0]];

  // Static ROC curve data (placeholder)
  const rocCurveData = [
    { fpr: 0, tpr: 0 },
    { fpr: 0.02, tpr: 0.35 },
    { fpr: 0.05, tpr: 0.55 },
    { fpr: 0.08, tpr: 0.68 },
    { fpr: 0.12, tpr: 0.78 },
    { fpr: 0.18, tpr: 0.85 },
    { fpr: 0.25, tpr: 0.90 },
    { fpr: 0.35, tpr: 0.93 },
    { fpr: 0.50, tpr: 0.95 },
    { fpr: 0.70, tpr: 0.97 },
    { fpr: 1, tpr: 1 },
  ];

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
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Model Performance</h1>
          <p className="page-subtitle">Monitor and compare ML model metrics</p>
        </div>
        <Button onClick={handleRetrain} disabled={retraining}>
          {retraining ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Retraining...
            </>
          ) : (
            <>
              <RefreshCcw className="w-4 h-4 mr-2" />
              Retrain Model
            </>
          )}
        </Button>
      </div>

      {retraining && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="chart-container mb-6"
        >
          <div className="flex items-center gap-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Retraining in progress...</span>
                <span className="text-sm text-muted-foreground">{retrainProgress}%</span>
              </div>
              <Progress value={retrainProgress} className="h-2" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Model Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="chart-container mb-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Model Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1 Score</th>
                <th>ROC-AUC</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((model, index) => (
                <motion.tr
                  key={model.model_name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(model.model_name === activeModel && 'bg-primary/5')}
                  onClick={() => setActiveModel(model.model_name)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.model_name}</span>
                      {model.model_name === activeModel && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="font-mono">{(model.accuracy * 100).toFixed(1)}%</td>
                  <td className="font-mono">{(model.precision * 100).toFixed(1)}%</td>
                  <td className="font-mono">{(model.recall * 100).toFixed(1)}%</td>
                  <td className="font-mono">{(model.f1_score * 100).toFixed(1)}%</td>
                  <td className="font-mono">{(model.roc_auc * 100).toFixed(1)}%</td>
                  <td>
                    {model.model_name === activeModel ? (
                      <Check className="w-5 h-5 text-success" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* ROC Curve */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="chart-container"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            ROC Curve (Simulated)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocCurveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="fpr"
                  domain={[0, 1]}
                  label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5 }}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  domain={[0, 1]}
                  label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft' }}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tpr"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  dot={false}
                  name="Model"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            AUC = {(activeMetrics?.roc_auc ? (activeMetrics.roc_auc * 100).toFixed(1) : 'N/A')}%
          </p>
        </motion.div>

        {/* Confusion Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="chart-container"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Confusion Matrix ({activeModel})
          </h3>
          <div className="flex items-center justify-center h-[300px]">
            <div className="relative">
              <div className="grid grid-cols-2 gap-2">
                {confusionMatrix.map((row, i) =>
                  row.map((val, j) => (
                    <div
                      key={`${i}-${j}`}
                      className={cn(
                        'w-32 h-24 flex flex-col items-center justify-center rounded-lg',
                        i === j ? 'bg-success/20' : 'bg-destructive/20'
                      )}
                    >
                      <span className="text-2xl font-bold">{val}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {i === 0 && j === 0 && 'True Negative'}
                        {i === 0 && j === 1 && 'False Positive'}
                        {i === 1 && j === 0 && 'False Negative'}
                        {i === 1 && j === 1 && 'True Positive'}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="absolute -left-20 top-1/2 -translate-y-1/2 -rotate-90 text-sm text-muted-foreground">
                Actual
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
                Predicted
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Feature Importance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="chart-container"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Feature Importance
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImportance} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  dataKey="feature"
                  type="category"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Importance']}
                />
                <Bar
                  dataKey="importance"
                  fill="hsl(217, 91%, 60%)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

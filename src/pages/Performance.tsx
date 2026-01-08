import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type ModelMetrics } from '@/lib/api';
import { Loader2, TrendingUp, Target, Activity } from 'lucide-react';

export default function Performance() {
  const [metrics, setMetrics] = useState<ModelMetrics[]>([]);
  const [featureImportance, setFeatureImportance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [metricsData, featuresData] = await Promise.all([
        api.getModelComparison(),
        api.getFeatureImportance('XGBoost', 10).catch(() => null),
      ]);

      setMetrics(metricsData);
      setFeatureImportance(featuresData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
            <button onClick={loadPerformanceData} className="mt-4 text-sm text-blue-600 hover:underline">
              Try again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Find best model
  const bestModel = metrics.reduce((best, current) =>
    current.roc_auc > (best?.roc_auc || 0) ? current : best
    , metrics[0]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Model Performance</h1>
        <p className="text-muted-foreground mt-2">
          Detailed metrics and comparison of trained models
        </p>
      </div>

      {/* Best Model Highlight */}
      {bestModel && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Best Performing Model: {bestModel.model_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
                <div className="text-2xl font-bold text-blue-600">
                  {(bestModel.accuracy * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Precision</div>
                <div className="text-2xl font-bold text-green-600">
                  {(bestModel.precision * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Recall</div>
                <div className="text-2xl font-bold text-orange-600">
                  {(bestModel.recall * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">F1 Score</div>
                <div className="text-2xl font-bold text-purple-600">
                  {(bestModel.f1_score * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">ROC-AUC</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {bestModel.roc_auc.toFixed(3)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Model Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Model</th>
                  <th className="text-right p-3 font-semibold">Accuracy</th>
                  <th className="text-right p-3 font-semibold">Precision</th>
                  <th className="text-right p-3 font-semibold">Recall</th>
                  <th className="text-right p-3 font-semibold">F1 Score</th>
                  <th className="text-right p-3 font-semibold">ROC-AUC</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((model, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{model.model_name}</td>
                    <td className="p-3 text-right">{(model.accuracy * 100).toFixed(2)}%</td>
                    <td className="p-3 text-right">{(model.precision * 100).toFixed(2)}%</td>
                    <td className="p-3 text-right">{(model.recall * 100).toFixed(2)}%</td>
                    <td className="p-3 text-right">{(model.f1_score * 100).toFixed(2)}%</td>
                    <td className="p-3 text-right font-semibold">{model.roc_auc.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Confusion Matrix Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((model, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-lg">{model.model_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">True Positives</div>
                  <div className="text-xl font-bold text-green-600">{model.true_positives}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">True Negatives</div>
                  <div className="text-xl font-bold text-green-600">{model.true_negatives}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">False Positives</div>
                  <div className="text-xl font-bold text-red-600">{model.false_positives}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">False Negatives</div>
                  <div className="text-xl font-bold text-red-600">{model.false_negatives}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Importance */}
      {featureImportance && featureImportance.feature_importance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top 10 Important Features (XGBoost)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(featureImportance.feature_importance)
                .sort(([, a]: any, [, b]: any) => b - a)
                .slice(0, 10)
                .map(([feature, importance]: any, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{feature}</span>
                      <span className="text-muted-foreground">
                        {(importance * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${importance * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Explanation */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>Understanding the Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-semibold">Accuracy:</span> Overall correctness of predictions (77-78% is good)
          </div>
          <div>
            <span className="font-semibold">Precision:</span> When model predicts churn, how often it's correct (58% means fewer false alarms)
          </div>
          <div>
            <span className="font-semibold">Recall:</span> Percentage of actual churners caught by the model (58-78% is good)
          </div>
          <div>
            <span className="font-semibold">F1 Score:</span> Balance between precision and recall (higher is better)
          </div>
          <div>
            <span className="font-semibold">ROC-AUC:</span> Model's ability to distinguish churners from non-churners (0.82-0.84 is excellent)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

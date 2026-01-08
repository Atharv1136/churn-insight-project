import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type DashboardKPIs, type CustomerSummary } from '@/lib/api';
import { Users, TrendingUp, AlertTriangle, Target, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [kpisData, summaryData] = await Promise.all([
        api.getDashboardKPIs().catch(() => null),
        api.getCustomerSummary().catch(() => null),
      ]);

      setKpis(kpisData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
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
            <button onClick={loadDashboardData} className="mt-4 text-sm text-blue-600 hover:underline">
              Try again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Customers',
      value: summary?.total_customers?.toLocaleString() || '0',
      icon: Users,
      description: 'Active customer base',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Churn Rate',
      value: `${((summary?.churn_rate || 0) * 100).toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Overall churn percentage',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'High Risk Customers',
      value: kpis?.high_risk_customers?.toLocaleString() || '0',
      icon: AlertTriangle,
      description: 'Customers likely to churn',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Model Accuracy',
      value: `${((kpis?.model_accuracy || 0) * 100).toFixed(1)}%`,
      icon: Target,
      description: 'Prediction accuracy',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of customer churn metrics and predictions
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Customers</span>
              <span className="font-semibold">{summary?.active_customers?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Churned Customers</span>
              <span className="font-semibold text-red-600">{summary?.churned_customers?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Retention Rate</span>
              <span className="font-semibold text-green-600">
                {((1 - (summary?.churn_rate || 0)) * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg. Tenure</span>
              <span className="font-semibold">{summary?.avg_tenure?.toFixed(1) || '0'} months</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg. Monthly Charges</span>
              <span className="font-semibold">${summary?.avg_monthly_charges?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg. Churn Probability</span>
              <span className="font-semibold">
                {((kpis?.avg_churn_probability || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Predictions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Predictions</span>
              <span className="font-semibold">{kpis?.total_predictions?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Model Accuracy</span>
              <span className="font-semibold text-green-600">
                {((kpis?.model_accuracy || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">High Risk %</span>
              <span className="font-semibold text-red-600">
                {summary?.total_customers && kpis?.high_risk_customers
                  ? ((kpis.high_risk_customers / summary.total_customers) * 100).toFixed(1)
                  : '0.0'}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Real-Time Data</h3>
              <p className="text-sm text-blue-700 mt-1">
                This dashboard displays real-time data from your trained machine learning models.
                The metrics are based on {summary?.total_customers?.toLocaleString() || '0'} customers
                with a model accuracy of {((kpis?.model_accuracy || 0) * 100).toFixed(1)}%.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

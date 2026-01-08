import { useEffect, useState } from 'react';
import { Users, TrendingDown, AlertTriangle, DollarSign, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ChurnTrendChart } from '@/components/dashboard/ChurnTrendChart';
import { SegmentChurnChart } from '@/components/dashboard/SegmentChurnChart';
import { ChurnDistributionChart } from '@/components/dashboard/ChurnDistributionChart';
import { RecentPredictionsTable } from '@/components/dashboard/RecentPredictionsTable';
import { api, type DashboardKPIs, type CustomerSummary } from '@/lib/api';

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpisData, summaryData] = await Promise.all([
          api.getDashboardKPIs().catch(() => null),
          api.getCustomerSummary().catch(() => null),
        ]);
        setKpis(kpisData);
        setSummary(summaryData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // Calculate revenue impact (At-risk customers * Avg Monthly Charge)
  const revenueImpact = (kpis?.high_risk_customers || 0) * (summary?.avg_monthly_charges || 0);

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-subtitle">Monitor customer churn metrics and predictions at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          title="Total Customers"
          value={summary?.total_customers?.toLocaleString() || "0"}
          change={0}
          changeLabel="Total active accounts"
          icon={Users}
          variant="primary"
          delay={0}
        />
        <KpiCard
          title="Churn Rate"
          value={`${((summary?.churn_rate || 0) * 100).toFixed(1)}%`}
          change={0}
          changeLabel="Overall churn rate"
          icon={TrendingDown}
          variant={summary?.churn_rate && summary.churn_rate > 0.3 ? "danger" : "success"}
          delay={0.1}
        />
        <KpiCard
          title="At-Risk Customers"
          value={kpis?.high_risk_customers?.toLocaleString() || "0"}
          change={0}
          changeLabel="High probability of churn"
          icon={AlertTriangle}
          variant="warning"
          delay={0.2}
        />
        <KpiCard
          title="Revenue Impact"
          value={`$${revenueImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change={0}
          changeLabel="Potential monthly loss"
          icon={DollarSign}
          variant="danger"
          delay={0.3}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChurnTrendChart />
        <SegmentChurnChart />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChurnDistributionChart />
        <div className="lg:col-span-2">
          <RecentPredictionsTable />
        </div>
      </div>
    </DashboardLayout>
  );
}

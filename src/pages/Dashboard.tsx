import { Users, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ChurnTrendChart } from '@/components/dashboard/ChurnTrendChart';
import { SegmentChurnChart } from '@/components/dashboard/SegmentChurnChart';
import { ChurnDistributionChart } from '@/components/dashboard/ChurnDistributionChart';
import { RecentPredictionsTable } from '@/components/dashboard/RecentPredictionsTable';

export default function Dashboard() {
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
          value="12,543"
          change={5.2}
          changeLabel="vs last month"
          icon={Users}
          variant="primary"
          delay={0}
        />
        <KpiCard
          title="Churn Rate"
          value="4.2%"
          change={-1.3}
          changeLabel="vs last month"
          icon={TrendingDown}
          variant="success"
          delay={0.1}
        />
        <KpiCard
          title="At-Risk Customers"
          value="847"
          change={12.5}
          changeLabel="vs last month"
          icon={AlertTriangle}
          variant="warning"
          delay={0.2}
        />
        <KpiCard
          title="Revenue Impact"
          value="$127K"
          change={-8.4}
          changeLabel="potential loss"
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

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const data = [
  { month: 'Jan', churn_rate: 5.2, total_customers: 1200 },
  { month: 'Feb', churn_rate: 4.8, total_customers: 1250 },
  { month: 'Mar', churn_rate: 6.1, total_customers: 1180 },
  { month: 'Apr', churn_rate: 5.5, total_customers: 1220 },
  { month: 'May', churn_rate: 4.2, total_customers: 1300 },
  { month: 'Jun', churn_rate: 3.8, total_customers: 1350 },
  { month: 'Jul', churn_rate: 4.5, total_customers: 1320 },
  { month: 'Aug', churn_rate: 5.0, total_customers: 1280 },
  { month: 'Sep', churn_rate: 4.3, total_customers: 1340 },
  { month: 'Oct', churn_rate: 3.9, total_customers: 1380 },
  { month: 'Nov', churn_rate: 4.1, total_customers: 1360 },
  { month: 'Dec', churn_rate: 3.5, total_customers: 1420 },
];

export function ChurnTrendChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="chart-container"
    >
      <h3 className="text-lg font-semibold mb-4">Churn Trend Over Time</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="churnGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="churn_rate"
              name="Churn Rate (%)"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={3}
              dot={{ fill: 'hsl(217, 91%, 60%)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(217, 91%, 60%)' }}
              fill="url(#churnGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

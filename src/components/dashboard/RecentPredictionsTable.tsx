import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const predictions = [
  { id: 'CUST-001', customer: 'John Doe', probability: 0.85, risk: 'High', date: '2024-01-08' },
  { id: 'CUST-002', customer: 'Jane Smith', probability: 0.45, risk: 'Medium', date: '2024-01-08' },
  { id: 'CUST-003', customer: 'Bob Wilson', probability: 0.15, risk: 'Low', date: '2024-01-07' },
  { id: 'CUST-004', customer: 'Alice Brown', probability: 0.72, risk: 'High', date: '2024-01-07' },
  { id: 'CUST-005', customer: 'Charlie Davis', probability: 0.32, risk: 'Medium', date: '2024-01-06' },
];

export function RecentPredictionsTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="chart-container"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Predictions</h3>
        <button className="text-sm text-primary hover:underline">View all</button>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Churn Probability</th>
              <th>Risk Level</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((pred, index) => (
              <motion.tr
                key={pred.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <td>
                  <span className="font-mono text-sm">{pred.id}</span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          pred.probability >= 0.7 ? 'bg-destructive' :
                          pred.probability >= 0.4 ? 'bg-warning' : 'bg-success'
                        )}
                        style={{ width: `${pred.probability * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {(pred.probability * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td>
                  <span className={cn(
                    'risk-badge',
                    pred.risk === 'Low' && 'risk-low',
                    pred.risk === 'Medium' && 'risk-medium',
                    pred.risk === 'High' && 'risk-high'
                  )}>
                    {pred.risk}
                  </span>
                </td>
                <td className="text-muted-foreground">{pred.date}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

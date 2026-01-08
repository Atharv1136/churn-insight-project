import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function RecentPredictionsTable() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const data = await api.getCustomers({ limit: 5 });
        setCustomers(data as any[]);
      } catch (e) {
        console.error("Failed to fetch customers", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  if (loading) {
    return (
      <div className="chart-container flex items-center justify-center h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="chart-container"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Customers</h3>
        <button className="text-sm text-primary hover:underline">View all</button>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Tenure</th>
              <th>Contract</th>
              <th>Payment Method</th>
              <th>Monthly Charges</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((cust, index) => (
              <motion.tr
                key={cust.customerID || cust.customer_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <td>
                  <span className="font-mono text-sm">{cust.customerID || cust.customer_id}</span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(cust.tenure / 72 * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm">{cust.tenure} mos</span>
                  </div>
                </td>
                <td>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full font-medium',
                    cust.Contract === 'Month-to-month' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  )}>
                    {cust.Contract}
                  </span>
                </td>
                <td className="text-sm text-muted-foreground">
                  {cust.PaymentMethod}
                </td>
                <td className="font-medium">
                  ${cust.MonthlyCharges}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

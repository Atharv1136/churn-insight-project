import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant: 'primary' | 'success' | 'warning' | 'danger';
  delay?: number;
}

export function KpiCard({ title, value, change, changeLabel, icon: Icon, variant, delay = 0 }: KpiCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn('kpi-card', `kpi-card-${variant}`)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-bold mt-2 text-foreground">{value}</h3>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : isNegative ? (
                <TrendingDown className="w-4 h-4 text-destructive" />
              ) : null}
              <span className={cn(
                'text-sm font-medium',
                isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {isPositive ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          variant === 'primary' && 'bg-primary/10',
          variant === 'success' && 'bg-success/10',
          variant === 'warning' && 'bg-warning/10',
          variant === 'danger' && 'bg-destructive/10'
        )}>
          <Icon className={cn(
            'w-6 h-6',
            variant === 'primary' && 'text-primary',
            variant === 'success' && 'text-success',
            variant === 'warning' && 'text-warning',
            variant === 'danger' && 'text-destructive'
          )} />
        </div>
      </div>
    </motion.div>
  );
}

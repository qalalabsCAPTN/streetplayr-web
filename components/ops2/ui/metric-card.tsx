'use client';

import { cn } from '@/lib/ops2/cn';
import { formatDelta } from '@/lib/ops2/format';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  delta?: number;
  subtext?: string;
  icon?: React.ReactNode;
  accent?: 'nectar' | 'success' | 'info' | 'default';
  loading?: boolean;
  className?: string;
}

const accentStyles = {
  nectar:  'border-nectar-400/20 hover:border-nectar-400/40',
  success: 'border-status-success/20 hover:border-status-success/40',
  info:    'border-status-info/20 hover:border-status-info/40',
  default: 'hover:border-border-strong',
};

export function MetricCard({
  label, value, delta, subtext, icon, accent = 'default', loading, className,
}: MetricCardProps) {
  const deltaInfo = delta !== undefined ? formatDelta(delta) : null;

  return (
    <div className={cn(
      'metric-card transition-all duration-200',
      accentStyles[accent],
      loading && 'animate-pulse',
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
        {icon && (
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center',
            accent === 'nectar'  ? 'bg-nectar-400/10 text-nectar-400' :
            accent === 'success' ? 'bg-status-success/10 text-status-success' :
            accent === 'info'    ? 'bg-status-info/10 text-status-info' :
            'bg-base-overlay text-text-secondary'
          )}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className={cn(
          'text-2xl font-bold tracking-tight',
          loading ? 'invisible' : ''
        )}>
          {loading ? '——' : value}
        </span>

        {deltaInfo && !loading && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-medium mb-0.5',
            deltaInfo.className
          )}>
            {deltaInfo.positive
              ? <TrendingUp className="w-3 h-3" />
              : delta === 0
              ? <Minus className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            <span>{deltaInfo.text}</span>
          </div>
        )}
      </div>

      {subtext && (
        <span className="text-xs text-text-muted">{subtext}</span>
      )}
    </div>
  );
}

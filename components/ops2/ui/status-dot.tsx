import { cn } from '@/lib/ops2/cn';

type Status = 'live' | 'offline' | 'error' | 'warning' | 'pending';

interface StatusDotProps {
  status: Status;
  label?: string;
  className?: string;
}

const dotStyles: Record<Status, string> = {
  live:    'bg-status-success shadow-glow-success animate-pulse-slow',
  offline: 'bg-text-muted',
  error:   'bg-status-error shadow-glow-error animate-pulse',
  warning: 'bg-status-warning',
  pending: 'bg-status-pending animate-pulse',
};

const labelStyles: Record<Status, string> = {
  live:    'text-status-success',
  offline: 'text-text-muted',
  error:   'text-status-error',
  warning: 'text-status-warning',
  pending: 'text-status-pending',
};

export function StatusDot({ status, label, className }: StatusDotProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className={cn('w-1.5 h-1.5 rounded-full', dotStyles[status])} />
      {label && <span className={cn('text-xs font-medium', labelStyles[status])}>{label}</span>}
    </div>
  );
}

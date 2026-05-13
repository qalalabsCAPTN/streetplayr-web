import { cn } from '@/lib/ops2/cn';
import type { PlatformId } from '@/types/ops2/ops';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'nectar' | 'muted';
  size?: 'sm' | 'md';
  className?: string;
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-base-overlay text-text-secondary border-border',
  success: 'bg-status-success/10 text-status-success border-status-success/30',
  warning: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  error:   'bg-status-error/10 text-status-error border-status-error/30',
  info:    'bg-status-info/10 text-status-info border-status-info/30',
  nectar:  'bg-nectar-400/10 text-nectar-400 border-nectar-400/30',
  muted:   'bg-base-surface text-text-muted border-border-subtle',
};

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center font-medium border rounded',
      size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

const platformBadgeStyles: Record<PlatformId, string> = {
  all:        'bg-platform-all/10 text-platform-all border-platform-all/20',
  streetplayr:'bg-platform-streetplayr/10 text-platform-streetplayr border-platform-streetplayr/20',
  playr:      'bg-platform-playr/10 text-platform-playr border-platform-playr/20',
  'playr-club':'bg-platform-club/10 text-platform-club border-platform-club/20',
  'playr-game':'bg-platform-game/10 text-platform-game border-platform-game/20',
};

const platformLabels: Record<PlatformId, string> = {
  all: 'All', streetplayr: 'StreetPlayR', playr: 'PlayR', 'playr-club': 'Club', 'playr-game': 'Game',
};

export function PlatformBadge({ platform, className }: { platform: PlatformId | string; className?: string }) {
  const pid = platform as PlatformId;
  return (
    <span className={cn(
      'inline-flex items-center text-xs font-medium border rounded px-1.5 py-0.5',
      platformBadgeStyles[pid] ?? 'bg-base-overlay text-text-secondary border-border',
      className
    )}>
      {platformLabels[pid] ?? platform}
    </span>
  );
}

const tierStyles: Record<string, string> = {
  seed:   'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
  sprout: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  bloom:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  nectar: 'bg-nectar-400/10 text-nectar-400 border-nectar-400/20',
  apex:   'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export function TierBadge({ tier, className }: { tier: string; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center text-xs font-semibold border rounded px-2 py-0.5 uppercase tracking-wider',
      tierStyles[tier.toLowerCase()] ?? tierStyles['seed'],
      className
    )}>
      {tier}
    </span>
  );
}

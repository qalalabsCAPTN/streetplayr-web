'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet, Trophy, GitBranch, Swords, Activity,
  AlertTriangle, ShieldCheck, ShieldAlert, Calendar,
  TrendingUp, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/ops2/cn';
import { formatRelativeTime, formatDateTime, formatPoints, formatCurrency, formatXp } from '@/lib/ops2/format';
import { Badge, TierBadge, PlatformBadge } from '@/components/ops2/ui/badge';
import { EmptyState } from '@/components/ops2/ui/empty-state';
import { api } from '@/lib/ops2/api-client';
import type { CustomerOverview, ActivityTimelineItem, WalletSummary } from '@/types/ops2/ops';

interface CustomerProfileProps {
  userId: string;
}

type Section = 'overview' | 'wallets' | 'progression' | 'activity' | 'referrals' | 'risk';

export function CustomerProfile({ userId }: CustomerProfileProps) {
  const [activeSection, setActiveSection] = useState<Section>('overview');

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', userId],
    queryFn: () => api.get<CustomerOverview>(`/customers/${userId}`),
    enabled: !!userId,
  });

  const { data: wallets } = useQuery({
    queryKey: ['customer-wallets', userId],
    queryFn: () => api.get<{ wallets: WalletSummary[] }>(`/customers/${userId}/wallets`),
    enabled: !!userId && activeSection === 'wallets',
  });

  const { data: timeline } = useQuery({
    queryKey: ['customer-timeline', userId],
    queryFn: () => api.get<{ items: ActivityTimelineItem[] }>(`/customers/${userId}/timeline`),
    enabled: !!userId && activeSection === 'activity',
  });

  if (isLoading) {
    return (
      <div className="surface h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-nectar-400/30 border-t-nectar-400 animate-spin" />
          <span className="text-sm text-text-muted">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="surface h-full">
        <EmptyState title="Customer not found" description={`No customer with ID ${userId}`} />
      </div>
    );
  }

  const sections: { key: Section; label: string; icon: React.ElementType }[] = [
    { key: 'overview',    label: 'Overview',    icon: Activity },
    { key: 'wallets',     label: 'Wallets',     icon: Wallet },
    { key: 'progression', label: 'Progression', icon: Trophy },
    { key: 'activity',    label: 'Activity',    icon: TrendingUp },
    { key: 'referrals',   label: 'Referrals',   icon: GitBranch },
    { key: 'risk',        label: 'Risk',        icon: AlertTriangle },
  ];

  return (
    <div className="surface h-full flex flex-col">
      <div className="border-b border-border p-5 space-y-4 shrink-0">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-base-overlay border border-border flex items-center justify-center text-xl font-bold text-text-secondary">
              {customer.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className={cn(
              'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-base-surface',
              customer.status === 'active'    ? 'bg-status-success' :
              customer.status === 'flagged'   ? 'bg-status-warning' :
              customer.status === 'suspended' ? 'bg-status-error' :
              'bg-text-muted'
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-text-primary">{customer.displayName}</h3>
              <TierBadge tier={customer.tier} />
              {customer.status !== 'active' && (
                <Badge variant={customer.status === 'flagged' ? 'warning' : 'error'}>
                  {customer.status}
                </Badge>
              )}
            </div>
            <div className="text-sm text-text-muted mt-0.5">{customer.email}</div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {customer.connectedPlatforms.map(p => (
                <PlatformBadge key={p} platform={p} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-right shrink-0">
            <div>
              <div className="text-xs text-text-muted">Total Spend</div>
              <div className="text-sm font-semibold text-text-primary">{formatCurrency(customer.totalSpend)}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Orders</div>
              <div className="text-sm font-semibold text-text-primary">{customer.orderCount}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Lifetime XP</div>
              <div className="text-sm font-semibold text-nectar-400">{formatXp(customer.lifetimeXp)}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Points</div>
              <div className="text-sm font-semibold text-status-success">{formatPoints(customer.pointsBalance)}</div>
            </div>
          </div>
        </div>

        {customer.riskScore > 30 && (
          <div className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
            customer.riskScore > 70
              ? 'bg-status-error/5 border-status-error/20 text-status-error'
              : 'bg-status-warning/5 border-status-warning/20 text-status-warning'
          )}>
            {customer.riskScore > 70 ? <ShieldAlert className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            Risk score: {customer.riskScore}/100 —
            {customer.riskScore > 70 ? ' High-risk account. Review before processing adjustments.' : ' Elevated risk signals detected.'}
          </div>
        )}
      </div>

      <div className="flex gap-0.5 border-b border-border px-3 py-2 shrink-0 overflow-x-auto">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-150',
                activeSection === s.key
                  ? 'bg-base-elevated text-text-primary'
                  : 'text-text-muted hover:text-text-secondary hover:bg-base-elevated/50'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-5">

        {activeSection === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Joined',      value: formatDateTime(customer.joinedAt), icon: Calendar },
                { label: 'Last Active', value: customer.lastActiveAt ? formatRelativeTime(customer.lastActiveAt) : 'Never', icon: Activity },
                { label: 'Referrals',   value: String(customer.referralCount), icon: GitBranch },
                { label: 'Risk Score',  value: `${customer.riskScore}/100`, icon: AlertTriangle },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="surface-elevated rounded-xl p-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-base-surface border border-border flex items-center justify-center">
                      <Icon className="h-4 w-4 text-text-muted" />
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">{stat.label}</div>
                      <div className="text-sm font-semibold text-text-primary">{stat.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="surface-elevated rounded-xl p-4">
              <div className="section-title mb-3">User ID</div>
              <div className="code break-all">{customer.userId}</div>
            </div>
          </div>
        )}

        {activeSection === 'wallets' && (
          <div className="space-y-3">
            {(wallets?.wallets ?? []).map(wallet => (
              <div key={wallet.walletType} className="surface-elevated rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold capitalize text-text-primary">{wallet.walletType} Wallet</span>
                  <span className={cn(
                    'text-lg font-bold',
                    wallet.walletType === 'points' ? 'text-nectar-400' :
                    wallet.walletType === 'xp'     ? 'text-blue-400' :
                    'text-text-primary'
                  )}>
                    {wallet.walletType === 'xp' ? formatXp(wallet.available) : formatPoints(wallet.available)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Available', value: wallet.available },
                    { label: 'Held',      value: wallet.held },
                    { label: 'Earned',    value: wallet.totalEarned },
                    { label: 'Spent',     value: wallet.totalSpent },
                  ].map(stat => (
                    <div key={stat.label}>
                      <div className="text-xs text-text-muted">{stat.label}</div>
                      <div className="text-sm font-medium text-text-secondary">{stat.value.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-text-muted">{wallet.transactionCount} transactions</div>
              </div>
            ))}

            <div className="surface-elevated rounded-xl p-4 border border-dashed border-border space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-nectar-400" />
                <span className="text-sm font-semibold text-text-primary">Manual Adjustment</span>
              </div>
              <p className="text-xs text-text-muted">
                Adjustments create ledger entries — balances are never directly modified.
                All adjustments are audited and attributed to your ops account.
              </p>
              <button className="btn-secondary text-xs w-full">
                Open Adjustment Panel
              </button>
            </div>
          </div>
        )}

        {activeSection === 'activity' && (
          <div className="space-y-0 divide-y divide-border-subtle -mx-5">
            {(timeline?.items ?? []).length === 0 ? (
              <EmptyState title="No activity" description="This user has no recorded activity." />
            ) : (
              (timeline?.items ?? []).map(item => (
                <div key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-base-elevated/30 transition-colors">
                  <div className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0 mt-2',
                    item.type === 'transaction'  ? 'bg-status-success' :
                    item.type === 'reward'        ? 'bg-nectar-400' :
                    item.type === 'achievement'   ? 'bg-status-warning' :
                    item.type === 'tier_change'   ? 'bg-purple-400' :
                    'bg-text-muted'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{item.title}</span>
                      {item.platform && <PlatformBadge platform={item.platform} />}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">{item.description}</div>
                    {item.amount !== undefined && (
                      <div className={cn(
                        'text-xs font-semibold mt-0.5',
                        item.amount > 0 ? 'text-status-success' : 'text-status-error'
                      )}>
                        {item.amount > 0 ? '+' : ''}{item.amount} {item.currency}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-text-muted shrink-0">{formatRelativeTime(item.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeSection === 'progression' && (
          <div className="space-y-4">
            <div className="surface-elevated rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="section-title">Tier Progression</span>
                <TierBadge tier={customer.tier} />
              </div>
              <div className="h-2 rounded-full bg-base-overlay overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-nectar-500 to-nectar-300 transition-all duration-700"
                  style={{ width: `${Math.min((customer.lifetimeXp / 25000) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>0 XP</span>
                <span className="text-nectar-400 font-semibold">{formatXp(customer.lifetimeXp)} lifetime</span>
                <span>25,000 XP (Apex)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

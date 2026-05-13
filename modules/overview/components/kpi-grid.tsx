'use client';

import { Coins, Users, Zap, TrendingUp, GitBranch, Wallet } from 'lucide-react';
import { MetricCard } from '@/components/ops2/ui/metric-card';
import { formatCurrency, formatNumber, formatPoints } from '@/lib/ops2/format';
import { useEcosystemKPIs } from '../hooks/use-kpis';

export function KpiGrid({ period }: { period: '1d' | '7d' | '30d' }) {
  const { data, isLoading } = useEcosystemKPIs(period);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        label="Ecosystem GMV"
        value={data ? formatCurrency(data.gmv) : '—'}
        delta={data?.gmvDelta}
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        accent="nectar"
        loading={isLoading}
        subtext="All revenue, all platforms"
      />
      <MetricCard
        label="Active Users"
        value={data ? formatNumber(data.activeUsers) : '—'}
        delta={data?.activeUsersDelta}
        icon={<Users className="h-3.5 w-3.5" />}
        accent="info"
        loading={isLoading}
        subtext={`vs last ${period}`}
      />
      <MetricCard
        label="Points Issued"
        value={data ? formatPoints(data.pointsIssued) : '—'}
        delta={data?.pointsIssuedDelta}
        icon={<Coins className="h-3.5 w-3.5" />}
        accent="nectar"
        loading={isLoading}
      />
      <MetricCard
        label="Reward Executions"
        value={data ? formatNumber(data.rewardExecutions) : '—'}
        delta={data?.rewardExecutionsDelta}
        icon={<Zap className="h-3.5 w-3.5" />}
        accent="success"
        loading={isLoading}
      />
      <MetricCard
        label="Referrals"
        value={data ? formatNumber(data.referrals) : '—'}
        delta={data?.referralsDelta}
        icon={<GitBranch className="h-3.5 w-3.5" />}
        loading={isLoading}
      />
      <MetricCard
        label="Wallet Liability"
        value={data ? formatPoints(data.rewardLiability) : '—'}
        icon={<Wallet className="h-3.5 w-3.5" />}
        loading={isLoading}
        subtext="Outstanding points"
      />
    </div>
  );
}

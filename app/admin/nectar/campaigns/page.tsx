'use client';

import { useState } from 'react';
import { TopBar } from '@/components/ops2/top-bar';
import {
  Zap, Play, Pause, Clock, CheckCircle2, Archive,
  Users, Coins, TrendingUp, Plus, ChevronRight,
  Layers, Target, Shield, Crown,
} from 'lucide-react';
import { Badge } from '@/components/ops2/ui/badge';
import { cn } from '@/lib/ops2/cn';
import { DEMO_CAMPAIGNS } from '@/lib/ops2/demo/campaigns';
import type { Campaign, CampaignStatus } from '@/lib/ops2/demo/campaigns';

const STATUS_CONFIG: Record<CampaignStatus, { label: string; variant: string; icon: React.ElementType }> = {
  active:    { label: 'Active',     variant: 'success', icon: Play },
  scheduled: { label: 'Scheduled',  variant: 'info',    icon: Clock },
  draft:     { label: 'Draft',      variant: 'muted',   icon: Archive },
  paused:    { label: 'Paused',     variant: 'warning', icon: Pause },
  completed: { label: 'Completed',  variant: 'muted',   icon: CheckCircle2 },
  archived:  { label: 'Archived',   variant: 'muted',   icon: Archive },
};

const FILTER_TABS: Array<{ key: CampaignStatus | 'all'; label: string }> = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'paused',    label: 'Paused' },
  { key: 'completed', label: 'Completed' },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function BudgetBar({ used, total }: { used: number; total?: number }) {
  if (!total) return <span className="text-xs text-text-muted">No cap</span>;
  const pct = Math.min(100, (used / total) * 100);
  const color = pct > 85 ? 'bg-status-error' : pct > 60 ? 'bg-status-warning' : 'bg-nectar-400';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-muted">{fmt(used)} / {fmt(total)} pts</span>
        <span className="text-text-secondary font-medium">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-base-overlay">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CampaignCard({ campaign, onClick }: { campaign: Campaign; onClick: () => void }) {
  const cfg = STATUS_CONFIG[campaign.status];
  const StatusIcon: any = cfg.icon;
  const isLive = campaign.status === 'active';

  return (
    <button
      onClick={onClick}
      className="surface rounded-xl p-5 text-left hover:border-border transition-all group w-full"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: `${campaign.color}20`, border: `1px solid ${campaign.color}40` }}
          >
            {campaign.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text-primary group-hover:text-nectar-300 transition-colors">
                {campaign.name}
              </h3>
              {isLive && <span className="dot-live" />}
            </div>
            <p className="text-xs text-text-muted">{campaign.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={cfg.variant as any}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {cfg.label}
          </Badge>
          <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {campaign.boosts.map((boost, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-md bg-base-overlay px-2 py-0.5 text-xs font-medium text-text-secondary">
            {boost.type === 'xp_multiplier' && <TrendingUp className="h-3 w-3 text-status-success" />}
            {boost.type === 'points_multiplier' && <Coins className="h-3 w-3 text-nectar-400" />}
            {boost.type === 'bonus_points' && <Zap className="h-3 w-3 text-platform-playr" />}
            {boost.type === 'streak_shield' && <Shield className="h-3 w-3 text-platform-club" />}
            {boost.type === 'xp_multiplier' && `${boost.value}× XP`}
            {boost.type === 'points_multiplier' && `${boost.value}× Points`}
            {boost.type === 'bonus_points' && `+${fmt(boost.value)} pts`}
            {boost.type === 'streak_shield' && `Streak Shield`}
          </span>
        ))}
        {campaign.leaderboard && (
          <span className="inline-flex items-center gap-1 rounded-md bg-base-overlay px-2 py-0.5 text-xs font-medium text-text-secondary">
            <Crown className="h-3 w-3 text-yellow-400" />
            Leaderboard Top {campaign.leaderboard.topN}
          </span>
        )}
        {!campaign.isStackable && (
          <span className="inline-flex items-center gap-1 rounded-md bg-status-error/10 px-2 py-0.5 text-xs font-medium text-status-error">
            <Layers className="h-3 w-3" />
            Exclusive
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-base-overlay px-3 py-2">
          <div className="text-xs text-text-muted mb-0.5">Participants</div>
          <div className="text-base font-semibold text-text-primary">{fmt(campaign.participantCount)}</div>
        </div>
        <div className="rounded-lg bg-base-overlay px-3 py-2">
          <div className="text-xs text-text-muted mb-0.5">Points Awarded</div>
          <div className="text-base font-semibold text-nectar-300">{fmt(campaign.pointsAwarded)}</div>
        </div>
      </div>

      <BudgetBar used={campaign.pointsAwarded} total={campaign.totalBudgetPoints} />

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
        <div className="flex gap-1">
          {campaign.platforms.length === 0
            ? <span className="text-xs text-text-muted">All platforms</span>
            : campaign.platforms.map(p => (
                <span key={p} className="text-xs text-text-muted capitalize">{p.replace('_', ' ')}</span>
              ))
          }
        </div>
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Target className="h-3 w-3" />
          {campaign.segmentRules.length > 0
            ? `${campaign.segmentRules.length} segment rule${campaign.segmentRules.length > 1 ? 's' : ''}`
            : 'All users'
          }
        </div>
      </div>
    </button>
  );
}

export default function CampaignsPage() {
  const [filter, setFilter] = useState<CampaignStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const campaigns = filter === 'all'
    ? DEMO_CAMPAIGNS
    : DEMO_CAMPAIGNS.filter(c => c.status === filter);

  const activeCampaigns = DEMO_CAMPAIGNS.filter(c => c.status === 'active');
  const totalParticipants = DEMO_CAMPAIGNS.reduce((sum, c) => sum + c.participantCount, 0);
  const totalBudgetUsed = DEMO_CAMPAIGNS.reduce((sum, c) => sum + c.pointsAwarded, 0);
  const totalBudget = DEMO_CAMPAIGNS.reduce((sum, c) => sum + (c.totalBudgetPoints ?? 0), 0);

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Campaigns" />

      <div className="flex-1 pt-14 overflow-y-auto">
        <div className="p-5 space-y-6">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-nectar-400/10 border border-nectar-400/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-nectar-400" />
              </div>
              <div>
                <h2 className="page-title">Campaign Orchestration</h2>
                <p className="text-sm text-text-muted mt-0.5">Behavioral layers — multipliers, boosts, leaderboards</p>
              </div>
            </div>
            <button className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="metric-card">
              <div className="metric-label">Active Campaigns</div>
              <div className="metric-value text-status-success">{activeCampaigns.length}</div>
              <div className="metric-subtext">{DEMO_CAMPAIGNS.filter(c => c.status === 'scheduled').length} scheduled</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Total Participants</div>
              <div className="metric-value">{fmt(totalParticipants)}</div>
              <div className="metric-subtext">across all campaigns</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Points Awarded</div>
              <div className="metric-value text-nectar-300">{fmt(totalBudgetUsed)}</div>
              <div className="metric-subtext">of {fmt(totalBudget)} budget</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Budget Utilization</div>
              <div className="metric-value">{((totalBudgetUsed / totalBudget) * 100).toFixed(1)}%</div>
              <div className="metric-subtext">total allocated budget</div>
            </div>
          </div>

          {activeCampaigns.length > 0 && (
            <div className="rounded-xl border border-status-success/20 bg-status-success/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="dot-live" />
                <span className="text-sm font-semibold text-status-success">{activeCampaigns.length} campaigns live now</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeCampaigns.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-status-success/10 border border-status-success/20 px-3 py-1.5 text-xs font-medium text-status-success hover:bg-status-success/20 transition-colors"
                  >
                    <span>{c.emoji}</span>
                    {c.name}
                    <span className="text-status-success/60">·</span>
                    <Users className="h-3 w-3" />
                    {fmt(c.participantCount)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-1 border-b border-border pb-0">
            {FILTER_TABS.map(tab => {
              const count = tab.key === 'all'
                ? DEMO_CAMPAIGNS.length
                : DEMO_CAMPAIGNS.filter(c => c.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                    filter === tab.key
                      ? 'border-nectar-400 text-nectar-300'
                      : 'border-transparent text-text-muted hover:text-text-secondary'
                  )}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={cn(
                      'ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                      filter === tab.key ? 'bg-nectar-400/20 text-nectar-300' : 'bg-base-overlay text-text-muted'
                    )}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {campaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onClick={() => setSelectedId(campaign.id === selectedId ? null : campaign.id)}
              />
            ))}
          </div>

          {campaigns.length === 0 && (
            <div className="text-center py-16 text-text-muted">
              <Zap className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p>No campaigns with status <strong>{filter}</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

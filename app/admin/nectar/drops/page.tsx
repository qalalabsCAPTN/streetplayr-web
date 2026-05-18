'use client';

import { TopBar } from '@/components/ops2/top-bar';
import { Star, Lock, Unlock, Clock, Users, Plus, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ops2/ui/badge';
import { cn } from '@/lib/ops2/cn';

type DropStatus = 'live' | 'upcoming' | 'ended' | 'draft';

interface Drop {
  id: string;
  name: string;
  description: string;
  status: DropStatus;
  emoji: string;
  color: string;
  eligibility: string;
  totalSupply?: number;
  claimed: number;
  startsAt: string;
  endsAt?: string;
  pointCost?: number;
  xpRequirement?: number;
  tierRequirement?: string;
  isCampaignExclusive: boolean;
}

const DROPS: Drop[] = [
  {
    id: 'drop_apex_genesis',
    name: 'APEX Genesis Badge',
    description: 'Commemorative badge for original APEX tier members. Never re-issued.',
    status: 'ended',
    emoji: '🏔️',
    color: '#FBBF24',
    eligibility: 'APEX tier only',
    totalSupply: 500,
    claimed: 312,
    startsAt: '2026-01-01T00:00:00Z',
    endsAt: '2026-01-31T23:59:59Z',
    tierRequirement: 'apex',
    isCampaignExclusive: false,
  },
  {
    id: 'drop_diwali_limited',
    name: 'Diwali 2026 Exclusive',
    description: 'Limited drop available only during the Diwali Sneaker Rush campaign. Leaderboard top 10 guaranteed.',
    status: 'upcoming',
    emoji: '🪔',
    color: '#F97316',
    eligibility: 'Campaign leaderboard + NECTAR tier+',
    totalSupply: 100,
    claimed: 0,
    startsAt: '2026-10-20T00:00:00Z',
    endsAt: '2026-10-23T23:59:59Z',
    tierRequirement: 'nectar',
    isCampaignExclusive: true,
  },
  {
    id: 'drop_night_raid_badge',
    name: 'Night Owl Badge',
    description: 'Earn this by participating in Night Raid campaign events between 00:00–04:00 UTC.',
    status: 'live',
    emoji: '🌙',
    color: '#6366F1',
    eligibility: 'Night Raid participants',
    totalSupply: undefined,
    claimed: 623,
    startsAt: '2026-05-01T00:00:00Z',
    endsAt: '2026-05-31T23:59:59Z',
    isCampaignExclusive: true,
  },
  {
    id: 'drop_early_adopter',
    name: 'Early Adopter Badge',
    description: 'For users who registered in the first 30 days of each platform launch.',
    status: 'ended',
    emoji: '🌱',
    color: '#34D399',
    eligibility: 'Platform launch users',
    totalSupply: 5000,
    claimed: 4820,
    startsAt: '2026-01-01T00:00:00Z',
    endsAt: '2026-01-30T23:59:59Z',
    isCampaignExclusive: false,
  },
  {
    id: 'drop_game_champion',
    name: 'Game Champion Trophy',
    description: 'Exclusive to top 50 players on PlayR Game during launch week.',
    status: 'ended',
    emoji: '🏆',
    color: '#EC4899',
    eligibility: 'Launch week leaderboard top 50',
    totalSupply: 50,
    claimed: 50,
    startsAt: '2026-03-01T00:00:00Z',
    endsAt: '2026-03-07T23:59:59Z',
    isCampaignExclusive: true,
  },
  {
    id: 'drop_apex_drop_may',
    name: 'APEX Tier Drop — May',
    description: 'Exclusive APEX member drop. Hidden contents revealed at start time.',
    status: 'upcoming',
    emoji: '⚡',
    color: '#EAB308',
    eligibility: 'APEX tier only',
    totalSupply: 312,
    claimed: 0,
    startsAt: '2026-05-20T12:00:00Z',
    endsAt: '2026-05-21T12:00:00Z',
    tierRequirement: 'apex',
    isCampaignExclusive: true,
  },
];

const STATUS_CONFIG: Record<DropStatus, { label: string; variant: string; icon: React.ElementType }> = {
  live:     { label: 'Live',     variant: 'success', icon: Unlock },
  upcoming: { label: 'Upcoming', variant: 'info',    icon: Clock },
  ended:    { label: 'Ended',    variant: 'muted',   icon: Lock },
  draft:    { label: 'Draft',    variant: 'muted',   icon: Lock },
};

function DropCard({ drop }: { drop: Drop }) {
  const cfg = STATUS_CONFIG[drop.status];
  const StatusIcon: any = cfg.icon;
  const claimPct = drop.totalSupply ? (drop.claimed / drop.totalSupply) * 100 : null;
  const isSoldOut = claimPct !== null && claimPct >= 100;

  return (
    <div className={cn('surface rounded-xl p-5 group hover:border-border transition-all', drop.status === 'live' && 'border-status-success/30')}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: `${drop.color}20`, border: `1px solid ${drop.color}40` }}
          >
            {drop.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text-primary">{drop.name}</h3>
              {drop.status === 'live' && <span className="dot-live" />}
            </div>
            <p className="text-xs text-text-muted mt-0.5">{drop.description}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Badge variant={cfg.variant as any}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {isSoldOut ? 'Sold Out' : cfg.label}
        </Badge>
        {drop.isCampaignExclusive && (
          <Badge variant="warning">Campaign Exclusive</Badge>
        )}
      </div>

      <div className="space-y-2 mb-4 text-xs">
        <div className="flex items-center gap-2 text-text-muted">
          <Lock className="h-3 w-3" />
          <span>{drop.eligibility}</span>
        </div>
        <div className="flex items-center gap-2 text-text-muted">
          <Clock className="h-3 w-3" />
          <span>{new Date(drop.startsAt).toLocaleDateString()}{drop.endsAt && ` → ${new Date(drop.endsAt).toLocaleDateString()}`}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1 text-text-muted">
            <Users className="h-3 w-3" />
            {drop.claimed} claimed
          </div>
          {drop.totalSupply
            ? <span className="text-text-secondary">{drop.totalSupply} supply · {claimPct?.toFixed(0)}%</span>
            : <span className="text-text-muted">Unlimited</span>
          }
        </div>
        {drop.totalSupply && (
          <div className="h-1.5 w-full rounded-full bg-base-overlay">
            <div
              className={cn('h-full rounded-full transition-all', isSoldOut ? 'bg-status-error' : drop.status === 'live' ? 'bg-status-success' : 'bg-nectar-400')}
              style={{ width: `${Math.min(100, claimPct!)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function DropsPage() {
  const liveDrops = DROPS.filter(d => d.status === 'live');
  const upcomingDrops = DROPS.filter(d => d.status === 'upcoming');
  const totalClaimed = DROPS.reduce((s, d) => s + d.claimed, 0);

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Drops" />

      <div className="flex-1 pt-14 overflow-y-auto">
        <div className="p-5 space-y-6">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-nectar-400/10 border border-nectar-400/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-nectar-400" />
              </div>
              <div>
                <h2 className="page-title">Drop Management</h2>
                <p className="text-sm text-text-muted mt-0.5">Exclusive drops, limited releases, gated rewards</p>
              </div>
            </div>
            <button className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" />
              Create Drop
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="metric-card">
              <div className="metric-label">Live Drops</div>
              <div className="metric-value text-status-success">{liveDrops.length}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Upcoming</div>
              <div className="metric-value text-platform-playr">{upcomingDrops.length}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Total Claimed</div>
              <div className="metric-value">{totalClaimed.toLocaleString()}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">All Drops</div>
              <div className="metric-value">{DROPS.length}</div>
            </div>
          </div>

          {liveDrops.length > 0 && (
            <div className="rounded-xl border border-status-success/20 bg-status-success/5 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="dot-live" />
                <span className="text-sm font-semibold text-status-success">{liveDrops.length} drop{liveDrops.length > 1 ? 's' : ''} live now</span>
              </div>
              <div className="flex gap-2">
                {liveDrops.map(d => (
                  <span key={d.id} className="text-xs text-status-success/80">{d.emoji} {d.name}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            {DROPS.map(drop => <DropCard key={drop.id} drop={drop} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

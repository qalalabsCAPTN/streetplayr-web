'use client';

import { useState } from 'react';
import { TopBar } from '@/components/ops2/top-bar';
import { Swords, Eye, EyeOff, Globe, Sparkles, Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ops2/ui/badge';
import { cn } from '@/lib/ops2/cn';
import {
  DEMO_ACHIEVEMENTS,
  DEMO_ACHIEVEMENT_STATS,
  RARITY_CONFIG,
  type Achievement,
  type AchievementCategory,
  type AchievementRarity,
} from '@/lib/ops2/demo/achievements';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  purchase:  'Purchase',
  social:    'Social',
  gaming:    'Gaming',
  loyalty:   'Loyalty',
  referral:  'Referral',
  seasonal:  'Seasonal',
  hidden:    'Hidden',
};

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function RarityBadge({ rarity }: { rarity: AchievementRarity }) {
  const cfg = RARITY_CONFIG[rarity];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function AchievementCard({ ach }: { ach: Achievement }) {
  const rarityColor = RARITY_CONFIG[ach.rarity].color;
  return (
    <div
      className="surface rounded-xl p-4 hover:border-border transition-all group"
      style={{ borderColor: ach.rarity === 'legendary' ? `${rarityColor}40` : undefined }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: RARITY_CONFIG[ach.rarity].bg }}
        >
          {ach.isSecret ? '?' : ach.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-text-primary truncate">
              {ach.isSecret ? 'Hidden Achievement' : ach.name}
            </span>
            {ach.isSecret && <EyeOff className="h-3 w-3 text-text-muted shrink-0" />}
            {ach.isCrossPlatform && <Globe className="h-3 w-3 text-platform-playr shrink-0" />}
            {ach.isSeasonal && <Sparkles className="h-3 w-3 text-yellow-400 shrink-0" />}
          </div>
          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
            {ach.isSecret ? 'Condition hidden from users until unlocked.' : ach.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <RarityBadge rarity={ach.rarity} />
        <Badge variant="muted">{CATEGORY_LABELS[ach.category]}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="rounded-lg bg-base-overlay px-2.5 py-1.5">
          <div className="text-text-muted">XP Reward</div>
          <div className="font-semibold text-status-success">+{fmt(ach.xpReward)} XP</div>
        </div>
        <div className="rounded-lg bg-base-overlay px-2.5 py-1.5">
          <div className="text-text-muted">Points</div>
          <div className="font-semibold text-nectar-300">+{fmt(ach.pointReward)}</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">{fmt(ach.unlockedCount)} unlocked</span>
          <span className="text-text-secondary font-medium">{ach.unlockRate.toFixed(2)}%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-base-overlay">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, ach.unlockRate * 2)}%`,
              backgroundColor: RARITY_CONFIG[ach.rarity].color,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AchievementCategory | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<AchievementRarity | 'all'>('all');

  const filtered = DEMO_ACHIEVEMENTS.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    if (rarityFilter !== 'all' && a.rarity !== rarityFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Achievements" />

      <div className="flex-1 pt-14 overflow-y-auto">
        <div className="p-5 space-y-6">

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-nectar-400/10 border border-nectar-400/20 flex items-center justify-center">
              <Swords className="h-5 w-5 text-nectar-400" />
            </div>
            <div>
              <h2 className="page-title">Achievement Library</h2>
              <p className="text-sm text-text-muted mt-0.5">Unlock conditions, rarity, rewards, and unlock rates</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            <div className="metric-card">
              <div className="metric-label">Total Achievements</div>
              <div className="metric-value">{DEMO_ACHIEVEMENT_STATS.total}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Total Unlocks</div>
              <div className="metric-value">{fmt(DEMO_ACHIEVEMENT_STATS.totalUnlocks)}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Hidden</div>
              <div className="metric-value text-text-muted">{DEMO_ACHIEVEMENT_STATS.secret}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Seasonal</div>
              <div className="metric-value text-yellow-400">{DEMO_ACHIEVEMENT_STATS.seasonal}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Cross-Platform</div>
              <div className="metric-value text-platform-playr">{DEMO_ACHIEVEMENT_STATS.crossPlatform}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search achievements…"
                className="field pl-9 text-sm w-full"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              className="field text-sm"
            >
              <option value="all">All categories</option>
              {(Object.keys(CATEGORY_LABELS) as AchievementCategory[]).map(c => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <select
              value={rarityFilter}
              onChange={e => setRarityFilter(e.target.value as any)}
              className="field text-sm"
            >
              <option value="all">All rarities</option>
              {(Object.keys(RARITY_CONFIG) as AchievementRarity[]).map(r => (
                <option key={r} value={r}>{RARITY_CONFIG[r].label}</option>
              ))}
            </select>
            <span className="text-xs text-text-muted">{filtered.length} results</span>
          </div>

          <div className="flex items-center gap-3">
            {(Object.entries(RARITY_CONFIG) as [AchievementRarity, typeof RARITY_CONFIG[AchievementRarity]][]).map(([r, cfg]) => (
              <button
                key={r}
                onClick={() => setRarityFilter(rarityFilter === r ? 'all' : r)}
                className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all', rarityFilter === r ? 'ring-1' : 'opacity-60 hover:opacity-100')}
                style={{
                  color: cfg.color,
                  backgroundColor: cfg.bg,
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                {cfg.label}
                <span className="opacity-60">
                  ({DEMO_ACHIEVEMENTS.filter(a => a.rarity === r).length})
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map(ach => (
              <AchievementCard key={ach.id} ach={ach} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-text-muted">
              <Swords className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p>No achievements match your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

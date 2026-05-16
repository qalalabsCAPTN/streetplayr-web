'use client';

import { TopBar } from '@/components/ops2/top-bar';
import { Trophy, Flame, Star, Calendar, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/ops2/cn';

const TIERS = [
  { id: 'seed',   name: 'Seed',   xp: 0,       multiplier: 1.0, color: '#94A3B8', users: 18420, pct: 43.5 },
  { id: 'sprout', name: 'Sprout', xp: 1000,    multiplier: 1.1, color: '#34D399', users: 12840, pct: 30.4 },
  { id: 'bloom',  name: 'Bloom',  xp: 5000,    multiplier: 1.25,color: '#60A5FA', users: 7210,  pct: 17.0 },
  { id: 'nectar', name: 'Nectar', xp: 20000,   multiplier: 1.5, color: '#F97316', users: 3518,  pct: 8.3  },
  { id: 'apex',   name: 'APEX',   xp: 100000,  multiplier: 2.0, color: '#FBBF24', users: 312,   pct: 0.74 },
];

const QUEST_DEMO = [
  { name: 'Weekend Warrior', freq: 'weekly', steps: 3, completedSteps: 3, reward: 2000, xpReward: 1000, status: 'completed', pct: 100 },
  { name: 'First Drop', freq: 'once', steps: 1, completedSteps: 1, reward: 5000, xpReward: 2000, status: 'completed', pct: 100 },
  { name: 'Social Butterfly', freq: 'weekly', steps: 5, completedSteps: 3, reward: 3000, xpReward: 1500, status: 'active', pct: 60 },
  { name: 'Streak Master', freq: 'daily', steps: 7, completedSteps: 5, reward: 1500, xpReward: 500, status: 'active', pct: 71 },
  { name: 'Refer 3 Friends', freq: 'once', steps: 3, completedSteps: 1, reward: 8000, xpReward: 3000, status: 'active', pct: 33 },
  { name: 'Platform Explorer', freq: 'once', steps: 4, completedSteps: 0, reward: 10000, xpReward: 5000, status: 'available', pct: 0 },
];

const SEASON = {
  name: 'Season 1: Genesis',
  endsAt: '2026-06-30',
  totalXpGoal: 50000,
  milestones: [
    { xp: 5000,  label: 'Pioneer',    reward: '2,500 pts', reached: true },
    { xp: 15000, label: 'Builder',    reward: '5,000 pts + badge', reached: true },
    { xp: 30000, label: 'Champion',   reward: '10,000 pts + rare drop', reached: false },
    { xp: 50000, label: 'Legend',     reward: '25,000 pts + legendary badge', reached: false },
  ],
};

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-base-overlay">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function ProgressionPage() {
  const totalUsers = TIERS.reduce((s, t) => s + t.users, 0);

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Progression" />

      <div className="flex-1 pt-14 overflow-y-auto">
        <div className="p-5 space-y-6">

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-nectar-400/10 border border-nectar-400/20 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-nectar-400" />
            </div>
            <div>
              <h2 className="page-title">Progression Systems</h2>
              <p className="text-sm text-text-muted mt-0.5">XP, streaks, quests, seasonal tracks, tier distribution</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="metric-card">
              <div className="metric-label">Total XP Awarded</div>
              <div className="metric-value text-nectar-300">284.7M</div>
              <div className="metric-subtext">lifetime across all users</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Active Streaks</div>
              <div className="metric-value text-status-success">14,820</div>
              <div className="metric-subtext">users with 3+ day streak</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Avg XP / User</div>
              <div className="metric-value">6,730</div>
              <div className="metric-subtext">lifetime average</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">APEX Users</div>
              <div className="metric-value text-yellow-400">312</div>
              <div className="metric-subtext">top 0.74% of ecosystem</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 surface rounded-xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <Star className="h-4 w-4 text-nectar-400" />
                <h3 className="text-sm font-semibold text-text-primary">Tier Distribution</h3>
                <span className="ml-auto text-xs text-text-muted">{totalUsers.toLocaleString()} total users</span>
              </div>
              <div className="space-y-4">
                {TIERS.map(tier => (
                  <div key={tier.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tier.color }} />
                        <span className="text-sm font-medium text-text-primary">{tier.name}</span>
                        <span className="text-xs text-text-muted">{tier.multiplier}× multiplier</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-text-muted">≥{tier.xp.toLocaleString()} XP</span>
                        <span className="font-medium text-text-secondary">{tier.users.toLocaleString()}</span>
                        <span className="font-semibold w-10 text-right" style={{ color: tier.color }}>{tier.pct}%</span>
                      </div>
                    </div>
                    <ProgressBar pct={tier.pct} color={tier.color} />
                  </div>
                ))}
              </div>
            </div>

            <div className="surface rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-nectar-400" />
                <h3 className="text-sm font-semibold text-text-primary">{SEASON.name}</h3>
              </div>
              <div className="text-xs text-text-muted mb-4">Ends {SEASON.endsAt}</div>
              <div className="space-y-3">
                {SEASON.milestones.map(m => (
                  <div
                    key={m.xp}
                    className={cn(
                      'rounded-lg border px-3 py-2.5',
                      m.reached
                        ? 'border-nectar-400/30 bg-nectar-400/5'
                        : 'border-border-subtle bg-base-overlay'
                    )}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn('text-xs font-semibold', m.reached ? 'text-nectar-300' : 'text-text-muted')}>
                        {m.label}
                      </span>
                      {m.reached && <Zap className="h-3 w-3 text-nectar-400" />}
                    </div>
                    <div className="text-[10px] text-text-muted">{m.xp.toLocaleString()} XP · {m.reward}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="surface rounded-xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Flame className="h-4 w-4 text-nectar-400" />
              <h3 className="text-sm font-semibold text-text-primary">Quest Library</h3>
              <span className="ml-auto text-xs text-text-muted">{QUEST_DEMO.length} quests active</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {QUEST_DEMO.map(q => (
                <div key={q.name} className="rounded-xl border border-border-subtle bg-base-elevated p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-text-primary">{q.name}</span>
                    <span className={cn(
                      'text-[10px] rounded-md px-1.5 py-0.5 font-medium',
                      q.status === 'completed' ? 'bg-status-success/10 text-status-success' :
                      q.status === 'active' ? 'bg-nectar-400/10 text-nectar-300' :
                      'bg-base-overlay text-text-muted'
                    )}>
                      {q.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-text-muted mb-2">{q.freq} · {q.completedSteps}/{q.steps} steps</div>
                  <div className="h-1 w-full rounded-full bg-base-overlay mb-2">
                    <div
                      className={cn('h-full rounded-full', q.status === 'completed' ? 'bg-status-success' : 'bg-nectar-400')}
                      style={{ width: `${q.pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span>{q.xpReward.toLocaleString()} XP</span>
                    <span className="text-nectar-300">+{q.reward.toLocaleString()} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Trophy, Zap, Flame, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/nectar-portal/cn';
import { DEMO_PROGRESSION, DEMO_ACTIVE_QUESTS, TIER_CONFIG } from '@/lib/nectar-portal/demo';

const TIERS = (['seed', 'sprout', 'bloom', 'nectar', 'apex'] as const);

const ALL_QUESTS = [
  ...DEMO_ACTIVE_QUESTS,
  { id: 'q_004', name: 'Weekend Warrior',  steps: 3, completedSteps: 3, reward: 2000, xpReward: 1000, frequency: 'weekly', endsAt: '2026-05-12' },
  { id: 'q_005', name: 'First Drop',        steps: 1, completedSteps: 1, reward: 5000, xpReward: 2000, frequency: 'once',   endsAt: null },
];

export default function ProgressionPage() {
  const cfg = TIER_CONFIG[DEMO_PROGRESSION.tier];
  const nextCfg = TIER_CONFIG[DEMO_PROGRESSION.nextTier];

  return (
    <div className="min-h-screen p-6 space-y-6">
      <h1 className="text-3xl font-black text-text-primary animate-fade-up">Progression</h1>

      {/* Tier Journey */}
      <div className="card p-6 animate-fade-up" style={{ animationDelay: '80ms' }}>
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-6">Tier Journey</h2>
        <div className="relative flex items-center gap-0">
          {TIERS.map((tier, i) => {
            const t = TIER_CONFIG[tier];
            const isCurrentOrPast = TIERS.indexOf(tier) <= TIERS.indexOf(DEMO_PROGRESSION.tier);
            const isCurrent = tier === DEMO_PROGRESSION.tier;
            return (
              <div key={tier} className="flex items-center flex-1">
                {/* Connector */}
                {i > 0 && (
                  <div className={cn('h-1 flex-1 transition-all', isCurrentOrPast ? 'opacity-100' : 'opacity-20')}
                    style={{ background: isCurrentOrPast ? t.color : 'rgba(255,255,255,0.1)' }} />
                )}
                {/* Node */}
                <div className="flex flex-col items-center gap-2 relative">
                  <div
                    className={cn('h-10 w-10 rounded-full flex items-center justify-center transition-all', isCurrent && 'ring-2 ring-offset-2 ring-offset-base-surface')}
                    style={{
                      background: isCurrentOrPast ? t.color : 'rgba(255,255,255,0.06)',
                      boxShadow: isCurrent ? `0 0 16px ${t.glow}` : 'none',
                    }}
                  >
                    {isCurrentOrPast
                      ? <span className="text-base font-black text-black">{t.multiplier}×</span>
                      : <span className="text-xs text-text-muted">{t.multiplier}×</span>
                    }
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-center"
                    style={{ color: isCurrentOrPast ? t.color : '#444' }}>
                    {t.name}
                  </div>
                  {isCurrent && (
                    <div className="absolute -top-5 text-[9px] font-black uppercase tracking-widest text-nectar-400 whitespace-nowrap">
                      ← You are here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* XP Progress to next tier */}
      <div className="card p-6 animate-fade-up" style={{ animationDelay: '160ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Progress to {nextCfg.name}</div>
            <div className="text-4xl font-black tabular-nums" style={{ color: cfg.color }}>
              {DEMO_PROGRESSION.xpProgressPct.toFixed(1)}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-text-primary">{DEMO_PROGRESSION.lifetimeXp.toLocaleString()}</div>
            <div className="text-sm text-text-muted">/ {DEMO_PROGRESSION.xpToNextTier.toLocaleString()} XP</div>
            <div className="text-xs mt-1" style={{ color: nextCfg.color }}>
              {(DEMO_PROGRESSION.xpToNextTier - DEMO_PROGRESSION.lifetimeXp).toLocaleString()} XP remaining
            </div>
          </div>
        </div>
        <div className="h-4 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
            style={{
              width: `${DEMO_PROGRESSION.xpProgressPct}%`,
              background: `linear-gradient(90deg, ${cfg.color}90, ${cfg.color})`,
              boxShadow: `0 0 12px ${cfg.glow}`,
            }}
          >
            <div className="absolute inset-0 opacity-50"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', animation: 'shimmer 2s infinite' }} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
          <Zap className="h-3 w-3 text-nectar-400" />
          Earning at {cfg.multiplier}× multiplier currently · {nextCfg.multiplier}× at {nextCfg.name}
        </div>
      </div>

      {/* Streak + Season side by side */}
      <div className="grid grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: '240ms' }}>
        {/* Streak */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Flame className="h-5 w-5 text-nectar-400" />
            <h2 className="text-sm font-bold text-text-primary">Streak</h2>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-black text-nectar-400 tabular-nums">{DEMO_PROGRESSION.currentStreakDays}</span>
            <span className="text-xl text-text-muted">days</span>
          </div>
          <div className="text-xs text-text-muted">Personal best: {DEMO_PROGRESSION.longestStreakDays} days</div>
          <div className="mt-4 grid grid-cols-7 gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className={cn('h-6 rounded-md', i < DEMO_PROGRESSION.currentStreakDays ? 'bg-nectar-400 opacity-90' : 'bg-base-overlay')}
                style={i < DEMO_PROGRESSION.currentStreakDays ? { boxShadow: '0 0 4px rgba(251,191,36,0.3)' } : {}} />
            ))}
          </div>
        </div>

        {/* Season XP */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-5 w-5 text-nectar-400" />
            <h2 className="text-sm font-bold text-text-primary">Season 1: Genesis</h2>
          </div>
          <div className="text-xs text-text-muted mb-3">Ends June 30, 2026</div>
          <div className="space-y-3">
            {[
              { xp: 5000,  label: 'Pioneer',  reward: '2,500 pts', reached: true },
              { xp: 15000, label: 'Builder',  reward: '5k pts + badge', reached: true },
              { xp: 30000, label: 'Champion', reward: '10k pts + drop', reached: false },
              { xp: 50000, label: 'Legend',   reward: '25k pts + legendary', reached: false },
            ].map(m => (
              <div key={m.xp} className={cn('flex items-center justify-between rounded-lg px-3 py-2 border text-xs', m.reached ? 'border-nectar-400/20 bg-nectar-400/5' : 'border-border-subtle bg-base-overlay')}>
                <div className={m.reached ? 'text-nectar-300 font-semibold' : 'text-text-muted'}>{m.label}</div>
                <div className="text-text-muted">{m.reward}</div>
                <div className="text-text-muted">{m.xp.toLocaleString()} XP</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quest board */}
      <div className="animate-fade-up" style={{ animationDelay: '320ms' }}>
        <h2 className="section-title mb-4">Quest Board</h2>
        <div className="grid grid-cols-3 gap-4">
          {ALL_QUESTS.map(q => {
            const pct = (q.completedSteps / q.steps) * 100;
            const done = q.completedSteps === q.steps;
            return (
              <div key={q.id} className={cn('card p-4', done && 'border-status-success/20 bg-status-success/3')}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-text-primary">{q.name}</span>
                  <span className={cn('text-[10px] rounded-full px-2 py-0.5 font-bold uppercase tracking-wider border', done ? 'border-status-success/30 bg-status-success/10 text-status-success' : 'border-border text-text-muted')}>
                    {done ? 'Complete' : q.frequency}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">{q.completedSteps}/{q.steps} steps</span>
                    <span className="text-nectar-400 font-semibold">+{q.reward.toLocaleString()} pts</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-base-overlay overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: done ? '#34D399' : 'linear-gradient(90deg, #F97316, #FBBF24)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

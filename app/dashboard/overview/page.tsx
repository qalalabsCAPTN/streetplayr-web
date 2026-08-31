'use client';

import { useState, useEffect } from 'react';
import { Zap, Flame, TrendingUp, Star, Trophy, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/nectar-portal/cn';
import { TIER_CONFIG, PLATFORM_CONFIG } from '@/lib/nectar-portal/demo';
import { getActivityAction, getLeaderboardAction } from '@/app/actions/loyalty';

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
      else setDisplay(value);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

function XpRing({ pct, tier }: { pct: number; tier: keyof typeof TIER_CONFIG }) {
  const cfg = TIER_CONFIG[tier];
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 136, height: 136 }}>
      <svg width={136} height={136} className="-rotate-90" viewBox="0 0 136 136">
        <circle cx={68} cy={68} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle
          cx={68} cy={68} r={r} fill="none"
          stroke={cfg.color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${cfg.glow})`, transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-black text-text-primary" style={{ color: cfg.color }}>{pct.toFixed(0)}%</div>
        <div className="text-[10px] text-text-muted uppercase tracking-wider">tier progress</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon: Icon, delay = 0 }: {
  label: string; value: React.ReactNode; sub?: string;
  color: string; icon: any; delay?: number;
}) {
  return (
    <div
      className="card p-5 space-y-3 animate-fade-up"
      style={{ animationDelay: `${delay}ms`, borderColor: `${color}20` }}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</div>
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-black text-text-primary tabular-nums">{value}</div>
      {sub && <div className="text-xs text-text-muted">{sub}</div>}
    </div>
  );
}

function QuestProgress({ quest }: { quest: { name: string; done: number; steps: number; status: string } }) {
  const pct = quest.steps ? (quest.done / quest.steps) * 100 : 0;
  return (
    <div className="card-hover p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">{quest.name}</span>
        <span className="text-[10px] text-nectar-400 font-semibold uppercase tracking-wider">{quest.status}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">Step {quest.done} / {quest.steps}</span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden bg-base-overlay">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #F97316, #FBBF24)' }}
          />
        </div>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: Math.max(quest.steps, 1) }).map((_, i) => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-full transition-all', i < quest.done ? 'bg-nectar-400' : 'bg-base-overlay')}
          />
        ))}
      </div>
    </div>
  );
}

function ActivityItem({ event }: { event: { source: string; delta: number; createdAt: string } }) {
  const relTime = new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-subtle last:border-0 animate-stream-in">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-text-primary font-medium">{event.source || 'wallet'}</div>
        <div className="text-xs text-text-muted mt-1">{event.delta > 0 ? '+' : ''}{event.delta} SPRR</div>
      </div>
      <span className="text-[10px] text-text-muted shrink-0">{relTime}</span>
    </div>
  );
}

export default function OverviewPage() {
  const [live, setLive] = useState<{
    email: string;
    sprrBalance: number;
    xp: number;
    lifetimeEarned: number;
    tier: 'ROOKIE' | 'PRO' | 'LEGEND' | 'CREATORS' | 'TALENT';
    progressPct: number;
    quests: { id: string; name: string; done: number; steps: number; status: string }[];
  } | null>(null);

  const [ranks, setRanks] = useState<Array<{ rank: number; name: string; isSelf: boolean }>>([]);
  const [activity, setActivity] = useState<Array<{ id: string; source: string; delta: number; createdAt: string }>>([]);

  useEffect(() => {
    (async () => {
      const { getLoyaltySnapshotAction } = await import('@/app/actions/loyalty');
      const result = await getLoyaltySnapshotAction();
      if (result.success) {
        setLive({
          email: result.data.email,
          sprrBalance: result.data.sprrBalance,
          xp: result.data.xp,
          lifetimeEarned: result.data.lifetimeEarned,
          tier: result.data.tier,
          progressPct: result.data.progressPct,
          quests: result.data.quests,
        });
      }
      const [lb, act] = await Promise.all([getLeaderboardAction(), getActivityAction()]);
      if (lb.success) setRanks(lb.data);
      if (act.success) {
        setActivity(act.data.slice(0, 6).map((t) => ({
          id: t.id,
          source: t.source,
          delta: t.delta,
          createdAt: t.createdAt,
        })));
      }
    })();
  }, []);

  const tierKey = live?.tier === 'LEGEND' ? 'nectar' : live?.tier === 'PRO' ? 'sprout' : 'seed';
  const tierCfg = TIER_CONFIG[tierKey];
  const displayName = live?.email || 'Member';
  const points = live?.sprrBalance ?? 0;
  const xp = live?.xp ?? 0;

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Hero header */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 animate-fade-up"
        style={{
          background: `linear-gradient(135deg, ${tierCfg.bg} 0%, rgba(0,0,0,0) 60%)`,
          border: `1px solid ${tierCfg.color}30`,
        }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 70% at 10% 50%, ${tierCfg.glow} 0%, transparent 60%)` }} />

        <div className="relative flex items-center justify-between gap-8">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-text-muted mb-1">Welcome back</div>
              <h1 className="text-4xl font-black text-text-primary tracking-tight">{displayName}</h1>
            </div>

            {/* Tier badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border"
              style={{ background: tierCfg.bg, borderColor: `${tierCfg.color}50`, color: tierCfg.color }}>
              <div className="h-2 w-2 rounded-full" style={{ background: tierCfg.color, boxShadow: `0 0 6px ${tierCfg.color}` }} />
              <span className="text-sm font-black uppercase tracking-widest">{tierCfg.name}</span>
              <span className="text-xs opacity-70">{tierCfg.multiplier}× multiplier</span>
            </div>

            {/* Streak */}
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-nectar-400" />
              <span className="text-sm font-semibold text-text-primary">Live Street / Playr / Legend wallet</span>
              <span className="text-xs text-text-muted">{live ? `${live.progressPct}% to next tier` : 'Sign in to load wallet'}</span>
            </div>
          </div>

          {/* XP Ring */}
          <div className="shrink-0">
            <XpRing pct={live?.progressPct ?? 0} tier={tierKey} />
            <div className="text-center mt-2 text-xs text-text-muted">
              {xp.toLocaleString()} XP · {points.toLocaleString()} SPRR
            </div>
          </div>

          {/* Platform breakdown */}
          <div className="shrink-0 space-y-2">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-3">Active on</div>
            {['streetplayr'].map(p => {
              const cfg = PLATFORM_CONFIG[p as keyof typeof PLATFORM_CONFIG];
              return (
                <div key={p} className="flex items-center gap-2">
                  <span className="text-lg">{cfg.emoji}</span>
                  <span className="text-sm text-text-secondary">{cfg.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="SPRR Balance"
          value={<AnimatedNumber value={points} />}
          sub={`${(live?.lifetimeEarned ?? 0).toLocaleString()} lifetime earned`}
          color="#FBBF24"
          icon={Zap}
          delay={0}
        />
        <StatCard
          label="Lifetime XP"
          value={<AnimatedNumber value={xp} />}
          sub="From profiles.xp + wallet_transactions"
          color={tierCfg.color}
          icon={TrendingUp}
          delay={80}
        />
        <StatCard
          label="Achievements"
          value={`${live?.quests.filter((q) => q.status === 'completed').length ?? 0} / ${live?.quests.length ?? 0}`}
          sub="Live loyalty_quests"
          color="#A78BFA"
          icon={Trophy}
          delay={160}
        />
        <StatCard
          label="Reputation"
          value={live?.tier ?? 'STREET'}
          sub="Canonical Street / Playr / Legend"
          color="#34D399"
          icon={Star}
          delay={240}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-6">

        {/* Left column — campaigns + quests */}
        <div className="col-span-1 space-y-4">

          {/* Active campaigns */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Active Campaigns</h2>
              <span className="dot-live" />
            </div>
            <div className="space-y-3">
              {(live?.quests ?? []).length === 0 && (
                <div className="card p-4 text-sm text-text-muted">No live campaigns. Quests load from loyalty_quests.</div>
              )}
              {(live?.quests ?? []).map((q) => (
                <div key={q.id} className="card p-4 text-sm">
                  <div className="font-semibold">{q.name}</div>
                  <div className="text-text-muted">{q.done}/{q.steps} · {q.status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard positions */}
          <div>
            <h2 className="section-title mb-3">Your Rankings</h2>
            <div className="card p-4 space-y-3">
              {ranks.length === 0 && <div className="text-sm text-text-muted">No live rankings yet.</div>}
              {ranks.slice(0, 5).map((lb) => (
                <div key={`${lb.rank}-${lb.name}`} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-text-primary">{lb.name}{lb.isSelf ? ' (you)' : ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-nectar-400">#{lb.rank}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center column — active quests */}
        <div className="col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Active Quests</h2>
            <a href="/dashboard/quests" className="text-xs text-nectar-400 hover:text-nectar-300 flex items-center gap-1">
              All quests <ChevronRight className="h-3 w-3" />
            </a>
          </div>
          <div className="space-y-3">
            {(live?.quests ?? []).length === 0 && (
              <div className="card p-4 text-sm text-text-muted">No live quests.</div>
            )}
            {(live?.quests ?? []).map((q) => <QuestProgress key={q.id} quest={q} />)}
          </div>
        </div>

        {/* Right column — activity feed */}
        <div className="col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Recent Activity</h2>
            <a href="/dashboard/activity" className="text-xs text-nectar-400 hover:text-nectar-300 flex items-center gap-1">
              Full history <ChevronRight className="h-3 w-3" />
            </a>
          </div>
          <div className="card px-4 py-2">
            {activity.length === 0 && <div className="py-3 text-sm text-text-muted">No wallet activity yet.</div>}
            {activity.map((e) => (
              <ActivityItem key={e.id} event={e} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Zap, Flame, TrendingUp, Star, ArrowRight, Users, Trophy, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/nectar-portal/cn';
import {
  DEMO_USER, DEMO_WALLET, DEMO_PROGRESSION, DEMO_REPUTATION,
  DEMO_ACTIVE_CAMPAIGNS, DEMO_ACTIVE_QUESTS, DEMO_ACTIVITY_TIMELINE,
  DEMO_LEADERBOARD_POSITION, TIER_CONFIG, PLATFORM_CONFIG,
} from '@/lib/nectar-portal/demo';

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
        <div className="text-[10px] text-text-muted uppercase tracking-wider">to {DEMO_PROGRESSION.nextTier}</div>
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

function CampaignBanner({ campaign }: { campaign: typeof DEMO_ACTIVE_CAMPAIGNS[0] }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 cursor-pointer group hover:border-opacity-60 transition-all"
      style={{ borderColor: `${campaign.color}30`, background: `${campaign.color}08` }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(ellipse 60% 60% at 50% 0%, ${campaign.color}12 0%, transparent 70%)` }} />
      <div className="relative flex items-center gap-4">
        <div className="text-3xl">{campaign.emoji}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="dot-live" />
            <span className="text-sm font-bold text-text-primary">{campaign.name}</span>
          </div>
          <div className="text-xs text-text-muted">{campaign.boost}</div>
          <div className="text-xs mt-1" style={{ color: campaign.color }}>Ends {campaign.endsAt}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}

function QuestProgress({ quest }: { quest: typeof DEMO_ACTIVE_QUESTS[0] }) {
  const pct = (quest.completedSteps / quest.steps) * 100;
  return (
    <div className="card-hover p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">{quest.name}</span>
        <span className="text-[10px] text-nectar-400 font-semibold uppercase tracking-wider">{quest.frequency}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">Step {quest.completedSteps} / {quest.steps}</span>
          <span className="text-nectar-400 font-semibold">+{quest.reward.toLocaleString()} pts</span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden bg-base-overlay">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #F97316, #FBBF24)' }}
          />
        </div>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: quest.steps }).map((_, i) => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-full transition-all', i < quest.completedSteps ? 'bg-nectar-400' : 'bg-base-overlay')}
          />
        ))}
      </div>
    </div>
  );
}

function ActivityItem({ event }: { event: typeof DEMO_ACTIVITY_TIMELINE[0] }) {
  const platCfg = PLATFORM_CONFIG[event.platform as keyof typeof PLATFORM_CONFIG];
  const relTime = new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-subtle last:border-0 animate-stream-in">
      <div className="text-xl shrink-0 mt-0.5">{event.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-text-primary font-medium">{event.title}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ color: platCfg?.color, background: `${platCfg?.color}18` }}>
            {platCfg?.name}
          </span>
          <span className="text-xs text-text-muted">{event.description}</span>
        </div>
      </div>
      <span className="text-[10px] text-text-muted shrink-0">{relTime}</span>
    </div>
  );
}

export default function OverviewPage() {
  const tierCfg = TIER_CONFIG[DEMO_PROGRESSION.tier];

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
              <h1 className="text-4xl font-black text-text-primary tracking-tight">{DEMO_USER.displayName}</h1>
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
              <span className="text-sm font-semibold text-text-primary">{DEMO_PROGRESSION.currentStreakDays}-day streak</span>
              <span className="text-xs text-text-muted">Best: {DEMO_PROGRESSION.longestStreakDays} days</span>
            </div>
          </div>

          {/* XP Ring */}
          <div className="shrink-0">
            <XpRing pct={DEMO_PROGRESSION.xpProgressPct} tier={DEMO_PROGRESSION.tier} />
            <div className="text-center mt-2 text-xs text-text-muted">
              {DEMO_PROGRESSION.lifetimeXp.toLocaleString()} / {DEMO_PROGRESSION.xpToNextTier.toLocaleString()} XP
            </div>
          </div>

          {/* Platform breakdown */}
          <div className="shrink-0 space-y-2">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-3">Active on</div>
            {DEMO_USER.platforms.map(p => {
              const cfg = PLATFORM_CONFIG[p as keyof typeof PLATFORM_CONFIG];
              return (
                <div key={p} className="flex items-center gap-2">
                  <span className="text-lg">{cfg.emoji}</span>
                  <span className="text-sm text-text-secondary">{cfg.name}</span>
                  {p === DEMO_USER.primaryPlatform && (
                    <span className="text-[9px] rounded-full px-1.5 py-0.5 font-bold"
                      style={{ color: cfg.color, background: `${cfg.color}20` }}>PRIMARY</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="NECTAR Points"
          value={<AnimatedNumber value={DEMO_WALLET.nectarPoints} />}
          sub={`${DEMO_WALLET.pendingPoints.toLocaleString()} pending · ${DEMO_WALLET.lifetimeEarned.toLocaleString()} lifetime`}
          color="#FBBF24"
          icon={Zap}
          delay={0}
        />
        <StatCard
          label="Lifetime XP"
          value={<AnimatedNumber value={DEMO_PROGRESSION.lifetimeXp} />}
          sub={`${DEMO_PROGRESSION.seasonXp.toLocaleString()} this season`}
          color={tierCfg.color}
          icon={TrendingUp}
          delay={80}
        />
        <StatCard
          label="Achievements"
          value={`${DEMO_PROGRESSION.achievementsUnlocked} / ${DEMO_PROGRESSION.totalAchievements}`}
          sub={`${((DEMO_PROGRESSION.achievementsUnlocked / DEMO_PROGRESSION.totalAchievements) * 100).toFixed(0)}% complete`}
          color="#A78BFA"
          icon={Trophy}
          delay={160}
        />
        <StatCard
          label="Reputation"
          value={<><AnimatedNumber value={DEMO_REPUTATION.overallScore} /><span className="text-lg text-text-muted">/100</span></>}
          sub={`Trust level: ${DEMO_REPUTATION.trustLevel}`}
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
              {DEMO_ACTIVE_CAMPAIGNS.map(c => <CampaignBanner key={c.id} campaign={c} />)}
            </div>
          </div>

          {/* Leaderboard positions */}
          <div>
            <h2 className="section-title mb-3">Your Rankings</h2>
            <div className="card p-4 space-y-3">
              {Object.entries(DEMO_LEADERBOARD_POSITION).map(([key, lb]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-text-primary">{lb.label}</div>
                    <div className="text-[10px] text-text-muted">of {lb.total.toLocaleString()} users</div>
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
            {DEMO_ACTIVE_QUESTS.map(q => <QuestProgress key={q.id} quest={q} />)}
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
            {DEMO_ACTIVITY_TIMELINE.slice(0, 6).map(e => (
              <ActivityItem key={e.id} event={e} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

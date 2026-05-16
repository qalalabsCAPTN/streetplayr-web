'use client';

import { Star, Lock, Clock, Unlock, Zap } from 'lucide-react';
import { cn } from '@/lib/nectar-portal/cn';
import { DEMO_PROGRESSION } from '@/lib/nectar-portal/demo';

const DROPS = [
  { id: 'd1', name: 'Night Owl Badge',      emoji: '🌙', status: 'live',     color: '#6366F1', eligibility: 'Night Raid participants', isEligible: true,  claimed: false, supply: null,  claimed_count: 623,  endsAt: '2026-05-31', pts: 0,    description: 'Exclusive badge for Night Raid campaign participants.' },
  { id: 'd2', name: 'Early Adopter Badge',  emoji: '🌱', status: 'owned',    color: '#34D399', eligibility: 'Platform launch users',   isEligible: true,  claimed: true,  supply: 5000, claimed_count: 4820, endsAt: null,         pts: 0,    description: 'You were one of the first. This badge never re-issues.' },
  { id: 'd3', name: 'Weekend Warrior Pin',  emoji: '🗓️', status: 'owned',    color: '#60A5FA', eligibility: 'Quest completion',         isEligible: true,  claimed: true,  supply: null, claimed_count: 18420,endsAt: null,         pts: 200,  description: 'Earned by completing the Weekend Warrior quest series.' },
  { id: 'd4', name: 'APEX Tier Drop',       emoji: '⚡', status: 'upcoming', color: '#FBBF24', eligibility: 'APEX tier only',           isEligible: false, claimed: false, supply: 312,  claimed_count: 0,    endsAt: '2026-05-21', pts: 10000, description: 'Exclusive APEX member drop. Contents revealed at launch.' },
  { id: 'd5', name: 'Diwali 2026 Exclusive',emoji: '🪔', status: 'upcoming', color: '#F97316', eligibility: 'NECTAR tier+ only',        isEligible: false, claimed: false, supply: 100,  claimed_count: 0,    endsAt: '2026-10-23', pts: 0,    description: 'The biggest drop of the year. Only for top-tier members.' },
  { id: 'd6', name: 'Game Champion Trophy', emoji: '🏆', status: 'missed',   color: '#EC4899', eligibility: 'Launch week top 50',        isEligible: false, claimed: false, supply: 50,   claimed_count: 50,   endsAt: null,         pts: 0,    description: 'Exclusive to PlayR Game launch week leaderboard top 50.' },
];

const STATUS_CONFIG = {
  live:     { label: 'Live Now',  color: '#34D399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)' },
  owned:    { label: 'Owned',     color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)' },
  upcoming: { label: 'Upcoming',  color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' },
  missed:   { label: 'Missed',    color: '#6B7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' },
};

export default function DropsPage() {
  const owned = DROPS.filter(d => d.status === 'owned').length;
  const live = DROPS.filter(d => d.status === 'live').length;

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center gap-3 animate-fade-up">
        <Star className="h-8 w-8 text-nectar-400" />
        <div>
          <h1 className="text-3xl font-black text-text-primary">Drops</h1>
          <p className="text-sm text-text-muted">{owned} owned · {live} live now · Exclusive items &amp; badges</p>
        </div>
      </div>

      {/* Live drops alert */}
      {live > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-status-success/30 bg-status-success/8 px-5 py-4 animate-fade-up" style={{ animationDelay: '80ms' }}>
          <span className="dot-live" />
          <div className="flex-1">
            <div className="text-sm font-bold text-status-success">
              {live} drop{live > 1 ? 's' : ''} available right now
            </div>
            <div className="text-xs text-status-success/70 mt-0.5">Claim before the timer runs out</div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '160ms' }}>
        {DROPS.map(drop => {
          const sCfg = STATUS_CONFIG[drop.status as keyof typeof STATUS_CONFIG];
          const pct = drop.supply ? Math.min(100, (drop.claimed_count / drop.supply) * 100) : null;
          return (
            <div
              key={drop.id}
              className={cn(
                'relative overflow-hidden rounded-2xl border p-5 transition-all duration-200',
                drop.status === 'missed' && 'opacity-50 grayscale',
                drop.status === 'live' && 'cursor-pointer hover:border-opacity-70',
              )}
              style={{ borderColor: sCfg.border, background: sCfg.bg }}
            >
              {/* Glow for live */}
              {drop.status === 'live' && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse 80% 60% at 50% -20%, ${drop.color}20 0%, transparent 60%)` }} />
              )}

              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="text-4xl">{drop.emoji}</div>
                  <span className="text-[10px] font-bold rounded-full px-2.5 py-1 border"
                    style={{ color: sCfg.color, borderColor: sCfg.border }}>
                    {sCfg.label}
                  </span>
                </div>

                <div className="mb-3">
                  <h3 className="text-base font-bold text-text-primary mb-1">{drop.name}</h3>
                  <p className="text-xs text-text-muted">{drop.description}</p>
                </div>

                {/* Eligibility */}
                <div className="flex items-center gap-1.5 mb-4 text-xs">
                  {drop.isEligible
                    ? <Unlock className="h-3 w-3 text-status-success" />
                    : <Lock className="h-3 w-3 text-text-muted" />
                  }
                  <span className={drop.isEligible ? 'text-status-success' : 'text-text-muted'}>
                    {drop.eligibility}
                  </span>
                </div>

                {/* Supply bar */}
                {drop.supply && (
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-text-muted">{drop.claimed_count} claimed</span>
                      <span style={{ color: sCfg.color }}>{drop.supply} total</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: sCfg.color }} />
                    </div>
                  </div>
                )}

                {/* Timer */}
                {drop.endsAt && (
                  <div className="flex items-center gap-1.5 text-xs mb-4">
                    <Clock className="h-3.5 w-3.5" style={{ color: sCfg.color }} />
                    <span style={{ color: sCfg.color }}>Ends {drop.endsAt}</span>
                  </div>
                )}

                {/* Points */}
                {drop.pts > 0 && (
                  <div className="flex items-center gap-1 text-xs text-nectar-400 mb-4">
                    <Zap className="h-3 w-3" />
                    <span className="font-bold">+{drop.pts.toLocaleString()} pts on claim</span>
                  </div>
                )}

                {/* Action button */}
                {drop.status === 'live' && drop.isEligible && !drop.claimed && (
                  <button className="btn-nectar w-full justify-center text-xs py-2">Claim Now</button>
                )}
                {drop.status === 'owned' && (
                  <div className="text-center text-xs font-bold text-status-info">In your collection ✓</div>
                )}
                {drop.status === 'upcoming' && !drop.isEligible && (
                  <div className="text-center text-xs text-text-muted">Not eligible with current tier</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Activity, Filter } from 'lucide-react';
import { cn } from '@/lib/nectar-portal/cn';
import { DEMO_ACTIVITY_TIMELINE, PLATFORM_CONFIG } from '@/lib/nectar-portal/demo';

const EXTENDED_ACTIVITY = [
  ...DEMO_ACTIVITY_TIMELINE,
  { id: 'act_011', type: 'purchase',             platform: 'streetplayr', title: 'Purchased Nike Air Max 97',                    description: '+563 pts · +150 XP', emoji: '👟', xp: 150,  pts: 563,  at: '2026-05-05T09:45:00Z', hasCascade: false },
  { id: 'act_012', type: 'quest_started',        platform: 'system',      title: 'Quest started: Refer 3 Friends',              description: '3 steps · up to +8,000 pts', emoji: '📋', xp: 0,   pts: 0,    at: '2026-05-04T12:00:00Z', hasCascade: false },
  { id: 'act_013', type: 'campaign_join',        platform: 'system',      title: 'Joined Night Raid campaign',                  description: '2× XP · 2× Points (00:00-04:00 UTC)', emoji: '🌙', xp: 0, pts: 0, at: '2026-05-01T00:01:00Z', hasCascade: false },
  { id: 'act_014', type: 'game_achievement',     platform: 'playr_game',  title: 'Game achievement: First Blood',               description: '+100 pts · +50 XP', emoji: '🎮', xp: 50,   pts: 100,  at: '2026-04-28T22:30:00Z', hasCascade: false },
  { id: 'act_015', type: 'leaderboard_prize',    platform: 'system',      title: 'Leaderboard prize: Weekly XP Top 50',        description: '+1,000 pts', emoji: '🏅', xp: 0,   pts: 1000, at: '2026-04-21T00:00:00Z', hasCascade: false },
];

const TYPE_LABELS: Record<string, string> = {
  purchase: 'Purchase',
  xp_gained: 'XP',
  achievement_unlocked: 'Achievement',
  quest_completed: 'Quest',
  quest_started: 'Quest',
  tier_upgrade: 'Tier',
  referral_made: 'Referral',
  referral_converted: 'Referral',
  drop_claimed: 'Drop',
  campaign_join: 'Campaign',
  streak_milestone: 'Streak',
  leaderboard_prize: 'Leaderboard',
  game_match: 'Game',
  game_achievement: 'Game',
};

function groupByDate(events: typeof EXTENDED_ACTIVITY) {
  const groups: Record<string, typeof EXTENDED_ACTIVITY> = {};
  for (const e of events) {
    const date = new Date(e.at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(e);
  }
  return Object.entries(groups);
}

export default function ActivityPage() {
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const filtered = platformFilter === 'all'
    ? EXTENDED_ACTIVITY
    : EXTENDED_ACTIVITY.filter(e => e.platform === platformFilter);
  const groups = groupByDate(filtered);

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-nectar-400/10 border border-nectar-400/20 flex items-center justify-center">
            <Activity className="h-5 w-5 text-nectar-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-text-primary">Activity</h1>
            <p className="text-sm text-text-muted">Your ecosystem timeline — all platforms, all events</p>
          </div>
        </div>

        {/* Platform filter */}
        <div className="flex gap-2">
          {['all', 'streetplayr', 'playr', 'playr_club', 'playr_game', 'system'].map(p => {
            const cfg = p === 'all' ? null : PLATFORM_CONFIG[p as keyof typeof PLATFORM_CONFIG];
            return (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize',
                  platformFilter === p
                    ? 'border-nectar-400/30 bg-nectar-400/10 text-nectar-300'
                    : 'border-border text-text-muted hover:text-text-secondary'
                )}
                style={platformFilter === p && cfg ? { borderColor: `${cfg.color}40`, background: `${cfg.color}15`, color: cfg.color } : {}}
              >
                {cfg ? `${cfg.emoji} ${cfg.name}` : 'All'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8 animate-fade-up" style={{ animationDelay: '80ms' }}>
        {groups.map(([date, events]) => (
          <div key={date}>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-3">
              <span>{date}</span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>
            <div className="card divide-y divide-border-subtle overflow-hidden">
              {events.map(event => {
                const platCfg = PLATFORM_CONFIG[event.platform as keyof typeof PLATFORM_CONFIG];
                return (
                  <div key={event.id} className="flex items-start gap-4 px-5 py-4 hover:bg-base-elevated/30 transition-colors">
                    {/* Emoji icon */}
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: `${platCfg?.color}15` }}>
                      {event.emoji}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text-primary">{event.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          style={{ color: platCfg?.color, borderColor: `${platCfg?.color}30`, background: `${platCfg?.color}10` }}>
                          {platCfg?.name}
                        </span>
                        <span className="text-xs text-text-muted">{event.description}</span>
                      </div>
                      {event.hasCascade && (
                        <div className="mt-1.5 text-[10px] text-nectar-400 flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-nectar-400" />
                          Triggered cascade events
                        </div>
                      )}
                    </div>
                    {/* Time + rewards */}
                    <div className="text-right shrink-0">
                      <div className="text-xs text-text-muted">
                        {new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {event.pts > 0 && (
                        <div className="text-xs font-bold text-nectar-400 mt-0.5">+{event.pts.toLocaleString()} pts</div>
                      )}
                      {event.xp > 0 && (
                        <div className="text-[10px] text-status-success">+{event.xp} XP</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

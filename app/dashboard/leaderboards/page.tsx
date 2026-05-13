'use client';

import { useState } from 'react';
import { BarChart3, Crown, TrendingUp, TrendingDown, Minus, Users } from 'lucide-react';
import { cn } from '@/lib/nectar-portal/cn';
import { DEMO_USER, TIER_CONFIG } from '@/lib/nectar-portal/demo';

type Board = 'xp_weekly' | 'xp_seasonal' | 'referrals' | 'streaks' | 'campaign';

const TIER_COLORS: Record<string, string> = {
  apex: '#FBBF24', nectar: '#F97316', bloom: '#60A5FA', sprout: '#34D399', seed: '#94A3B8',
};

// Seeded leaderboard data
const LEADERBOARD_DATA: Record<Board, { name: string; description: string; entries: any[] }> = {
  xp_weekly: {
    name: 'XP — This Week',
    description: 'Total XP earned in the last 7 days across all platforms',
    entries: [
      { rank: 1,  prev: 2,  name: 'Priya S.',   tier: 'apex',   platform: 'streetplayr', value: 14820, isMe: false },
      { rank: 2,  prev: 1,  name: 'Karan M.',   tier: 'apex',   platform: 'playr',       value: 13940, isMe: false },
      { rank: 3,  prev: 3,  name: 'Neha R.',    tier: 'nectar', platform: 'streetplayr', value: 11240, isMe: false },
      { rank: 4,  prev: 6,  name: 'Arjun V.',   tier: 'nectar', platform: 'playr_club',  value: 9820,  isMe: false },
      { rank: 5,  prev: 4,  name: 'Rahul K.',   tier: 'bloom',  platform: 'playr_game',  value: 8940,  isMe: false },
      { rank: 6,  prev: 8,  name: 'Divya P.',   tier: 'bloom',  platform: 'streetplayr', value: 7320,  isMe: false },
      { rank: 7,  prev: 7,  name: 'Vikram N.',  tier: 'bloom',  platform: 'playr',       value: 6840,  isMe: false },
      { rank: 8,  prev: 5,  name: 'Sneha A.',   tier: 'nectar', platform: 'playr_club',  value: 6210,  isMe: false },
      { rank: 9,  prev: 10, name: 'Ravi G.',    tier: 'sprout', platform: 'streetplayr', value: 5890,  isMe: false },
      { rank: 10, prev: 9,  name: 'Anita J.',   tier: 'bloom',  platform: 'playr',       value: 5240,  isMe: false },
      // ... gap ...
      { rank: 47, prev: 52, name: 'Rahul M.',   tier: 'bloom',  platform: 'streetplayr', value: 2840,  isMe: true },
    ],
  },
  xp_seasonal: {
    name: 'XP — Season 1',
    description: 'Total XP since Season 1 began (Jan 2026)',
    entries: [
      { rank: 1,  prev: 1,  name: 'Priya S.',   tier: 'apex',   platform: 'streetplayr', value: 184200, isMe: false },
      { rank: 2,  prev: 2,  name: 'Karan M.',   tier: 'apex',   platform: 'playr',       value: 162840, isMe: false },
      { rank: 3,  prev: 4,  name: 'Arjun V.',   tier: 'apex',   platform: 'playr_club',  value: 148200, isMe: false },
      { rank: 4,  prev: 3,  name: 'Neha R.',    tier: 'nectar', platform: 'streetplayr', value: 132100, isMe: false },
      { rank: 5,  prev: 5,  name: 'Divya P.',   tier: 'nectar', platform: 'streetplayr', value: 119800, isMe: false },
      { rank: 22, prev: 24, name: 'Rahul M.',   tier: 'bloom',  platform: 'streetplayr', value: 18420,  isMe: true },
    ],
  },
  referrals: {
    name: 'Referrals — All Time',
    description: 'Total successful referral conversions',
    entries: [
      { rank: 1,  prev: 1,  name: 'Priya S.',   tier: 'apex',   platform: 'streetplayr', value: 847, isMe: false },
      { rank: 2,  prev: 2,  name: 'Rahul K.',   tier: 'apex',   platform: 'playr',       value: 623, isMe: false },
      { rank: 3,  prev: 3,  name: 'Arjun K.',   tier: 'nectar', platform: 'streetplayr', value: 441, isMe: false },
      { rank: 4,  prev: 4,  name: 'Neha R.',    tier: 'nectar', platform: 'streetplayr', value: 312, isMe: false },
      { rank: 5,  prev: 5,  name: 'Vikram N.',  tier: 'bloom',  platform: 'playr',       value: 288, isMe: false },
      { rank: 12, prev: 14, name: 'Rahul M.',   tier: 'bloom',  platform: 'streetplayr', value: 7,   isMe: true },
    ],
  },
  streaks: {
    name: 'Current Streaks',
    description: 'Active daily streak length',
    entries: [
      { rank: 1,  prev: 1,  name: 'Meera D.',   tier: 'apex',   platform: 'playr',       value: 184, isMe: false },
      { rank: 2,  prev: 2,  name: 'Kiran B.',   tier: 'apex',   platform: 'streetplayr', value: 142, isMe: false },
      { rank: 3,  prev: 3,  name: 'Rohit P.',   tier: 'nectar', platform: 'playr_club',  value: 98,  isMe: false },
      { rank: 4,  prev: 5,  name: 'Deepa A.',   tier: 'nectar', platform: 'streetplayr', value: 84,  isMe: false },
      { rank: 5,  prev: 4,  name: 'Sanjay K.',  tier: 'bloom',  platform: 'playr',       value: 71,  isMe: false },
      { rank: 184,prev: 201,name: 'Rahul M.',   tier: 'bloom',  platform: 'streetplayr', value: 12,  isMe: true },
    ],
  },
  campaign: {
    name: 'Night Raid Campaign',
    description: 'XP earned during Night Raid (00:00–04:00 UTC)',
    entries: [
      { rank: 1,  prev: 1,  name: 'Arjun V.',   tier: 'nectar', platform: 'playr_club',  value: 8840, isMe: false },
      { rank: 2,  prev: 3,  name: 'Kiran B.',   tier: 'apex',   platform: 'playr',       value: 7420, isMe: false },
      { rank: 3,  prev: 2,  name: 'Rohit P.',   tier: 'nectar', platform: 'streetplayr', value: 6880, isMe: false },
      { rank: 4,  prev: 4,  name: 'Sneha A.',   tier: 'bloom',  platform: 'playr',       value: 5940, isMe: false },
      { rank: 5,  prev: 6,  name: 'Priya S.',   tier: 'apex',   platform: 'streetplayr', value: 5420, isMe: false },
      { rank: 31, prev: 38, name: 'Rahul M.',   tier: 'bloom',  platform: 'streetplayr', value: 840,  isMe: true },
    ],
  },
};

const TABS: Board[] = ['xp_weekly', 'xp_seasonal', 'referrals', 'streaks', 'campaign'];

function RankDelta({ prev, curr }: { prev: number; curr: number }) {
  const delta = prev - curr;
  if (delta > 0) return (
    <div className="flex items-center gap-0.5 text-status-success text-[10px] font-bold">
      <TrendingUp className="h-3 w-3" />+{delta}
    </div>
  );
  if (delta < 0) return (
    <div className="flex items-center gap-0.5 text-status-error text-[10px] font-bold">
      <TrendingDown className="h-3 w-3" />{delta}
    </div>
  );
  return <Minus className="h-3 w-3 text-text-muted" />;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="text-sm font-bold text-text-muted w-6 text-center">#{rank}</span>;
}

export default function LeaderboardsPage() {
  const [active, setActive] = useState<Board>('xp_weekly');
  const board = LEADERBOARD_DATA[active];
  const entries = board.entries;
  const myEntry = entries.find(e => e.isMe);
  const topEntries = entries.filter(e => !e.isMe && e.rank <= 10);
  const hasGap = myEntry && myEntry.rank > (topEntries.at(-1)?.rank ?? 0) + 1;

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center gap-3 animate-fade-up">
        <div className="h-10 w-10 rounded-xl bg-nectar-400/10 border border-nectar-400/20 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-nectar-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-text-primary">Leaderboards</h1>
          <p className="text-sm text-text-muted">Real-time rankings across all platforms</p>
        </div>
      </div>

      {/* Board tabs */}
      <div className="flex gap-2 flex-wrap animate-fade-up" style={{ animationDelay: '80ms' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
              active === t
                ? 'bg-nectar-400/10 border-nectar-400/30 text-nectar-300'
                : 'border-border text-text-muted hover:text-text-secondary hover:border-border-strong'
            )}
          >
            {LEADERBOARD_DATA[t].name}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="card overflow-hidden animate-fade-up" style={{ animationDelay: '160ms' }}>
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="text-base font-bold text-text-primary">{board.name}</div>
          <div className="text-xs text-text-muted mt-0.5">{board.description}</div>
        </div>

        {/* My position hero */}
        {myEntry && (
          <div className="border-b border-border px-6 py-4 bg-nectar-400/5">
            <div className="flex items-center gap-4">
              <div className="text-xs text-text-muted uppercase tracking-wider">Your position</div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-nectar-400" />
                <span className="text-xl font-black text-nectar-400">#{myEntry.rank}</span>
              </div>
              <RankDelta prev={myEntry.prev} curr={myEntry.rank} />
              <div className="flex-1" />
              <div className="text-right">
                <div className="text-lg font-bold text-text-primary tabular-nums">{myEntry.value.toLocaleString()}</div>
                <div className="text-xs text-text-muted">{active === 'referrals' ? 'referrals' : active === 'streaks' ? 'days' : 'XP'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-16">Rank</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-12">Δ</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Player</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                {active === 'referrals' ? 'Referrals' : active === 'streaks' ? 'Days' : 'XP'}
              </th>
            </tr>
          </thead>
          <tbody>
            {topEntries.map((e) => (
              <tr key={e.rank} className={cn('border-b border-border-subtle hover:bg-base-elevated/40 transition-colors')}>
                <td className="px-6 py-3"><RankBadge rank={e.rank} /></td>
                <td className="px-3 py-3"><RankDelta prev={e.prev} curr={e.rank} /></td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-base-overlay flex items-center justify-center text-xs font-bold text-text-primary">
                      {e.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{e.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold capitalize px-1.5 py-0.5 rounded"
                          style={{ color: TIER_COLORS[e.tier], background: `${TIER_COLORS[e.tier]}18` }}>
                          {e.tier}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3 text-right">
                  <span className="text-sm font-bold text-text-primary tabular-nums">{e.value.toLocaleString()}</span>
                </td>
              </tr>
            ))}

            {/* Gap indicator */}
            {hasGap && (
              <tr>
                <td colSpan={4} className="px-6 py-2 text-center text-xs text-text-muted">
                  ·  ·  ·
                </td>
              </tr>
            )}

            {/* My entry */}
            {myEntry && (
              <tr className="border-t-2 border-nectar-400/30 bg-nectar-400/5">
                <td className="px-6 py-3 text-sm font-black text-nectar-400">#{myEntry.rank}</td>
                <td className="px-3 py-3"><RankDelta prev={myEntry.prev} curr={myEntry.rank} /></td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-nectar-400/20 border border-nectar-400/30 flex items-center justify-center text-xs font-bold text-nectar-400">
                      RM
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{DEMO_USER.displayName}</div>
                      <div className="text-[10px] text-nectar-400 font-semibold">You</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3 text-right">
                  <span className="text-sm font-bold text-nectar-300 tabular-nums">{myEntry.value.toLocaleString()}</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="px-6 py-3 border-t border-border flex items-center gap-2 text-xs text-text-muted">
          <Users className="h-3.5 w-3.5" />
          Updates in realtime · Refreshed every 60 seconds
        </div>
      </div>
    </div>
  );
}

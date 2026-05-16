'use client';

import { useState } from 'react';
import { Medal, Lock, Globe, Sparkles, EyeOff, Search } from 'lucide-react';
import { cn } from '@/lib/nectar-portal/cn';

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

const RARITY_CONFIG: Record<Rarity, { label: string; color: string; bg: string; glow: string }> = {
  common:    { label: 'Common',    color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', glow: '' },
  uncommon:  { label: 'Uncommon', color: '#34D399', bg: 'rgba(52,211,153,0.08)',  glow: 'rgba(52,211,153,0.2)' },
  rare:      { label: 'Rare',     color: '#60A5FA', bg: 'rgba(96,165,250,0.08)',  glow: 'rgba(96,165,250,0.25)' },
  epic:      { label: 'Epic',     color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', glow: 'rgba(167,139,250,0.3)' },
  legendary: { label: 'Legendary',color: '#FBBF24', bg: 'rgba(251,191,36,0.08)',  glow: 'rgba(251,191,36,0.35)' },
};

interface Ach {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: Rarity;
  emoji: string;
  xpReward: number;
  pointReward: number;
  isSecret: boolean;
  isCrossPlatform: boolean;
  isSeasonal: boolean;
  unlocked: boolean;
  unlockedAt?: string;
  unlockRate: number;
}

const ACHIEVEMENTS: Ach[] = [
  { id: 'a1',  name: 'First Cop',           description: 'Complete your first order.',             category: 'purchase', rarity: 'common',   emoji: '👟', xpReward: 100,   pointReward: 200,   isSecret: false, isCrossPlatform: false, isSeasonal: false, unlocked: true,  unlockedAt: '2025-11-16', unlockRate: 67.2 },
  { id: 'a2',  name: 'Heat Seeker',          description: 'Purchase 5 limited-edition releases.',   category: 'purchase', rarity: 'uncommon', emoji: '🔥', xpReward: 500,   pointReward: 1000,  isSecret: false, isCrossPlatform: false, isSeasonal: false, unlocked: true,  unlockedAt: '2026-01-08', unlockRate: 17.0 },
  { id: 'a3',  name: 'Iron Streak',          description: 'Maintain a 30-day streak.',              category: 'loyalty',  rarity: 'rare',     emoji: '⚡', xpReward: 3000,  pointReward: 2000,  isSecret: false, isCrossPlatform: false, isSeasonal: false, unlocked: false, unlockRate: 2.9 },
  { id: 'a4',  name: 'Night Owl',            description: '20 purchases between 00:00–04:00 UTC.',  category: 'hidden',   rarity: 'uncommon', emoji: '🦉', xpReward: 800,   pointReward: 1500,  isSecret: true,  isCrossPlatform: false, isSeasonal: false, unlocked: true,  unlockedAt: '2026-05-12', unlockRate: 5.1 },
  { id: 'a5',  name: 'The Connector',        description: 'Refer 10 friends who make purchases.',   category: 'referral', rarity: 'rare',     emoji: '🕸️', xpReward: 1500,  pointReward: 3000,  isSecret: false, isCrossPlatform: false, isSeasonal: false, unlocked: false, unlockRate: 2.1 },
  { id: 'a6',  name: 'Ecosystem Citizen',    description: 'Active on all 4 platforms in one week.', category: 'social',   rarity: 'epic',     emoji: '🌐', xpReward: 5000,  pointReward: 5000,  isSecret: false, isCrossPlatform: true,  isSeasonal: false, unlocked: false, unlockRate: 0.34 },
  { id: 'a7',  name: 'Game Grinder',         description: 'Complete 100 matches on PlayR Game.',    category: 'gaming',   rarity: 'uncommon', emoji: '🎮', xpReward: 1000,  pointReward: 800,   isSecret: false, isCrossPlatform: false, isSeasonal: false, unlocked: true,  unlockedAt: '2026-04-01', unlockRate: 27.0 },
  { id: 'a8',  name: 'Pioneer',              description: 'First 500 users on any platform.',       category: 'loyalty',  rarity: 'rare',     emoji: '🌱', xpReward: 2000,  pointReward: 3000,  isSecret: false, isCrossPlatform: false, isSeasonal: false, unlocked: true,  unlockedAt: '2025-11-15', unlockRate: 1.2 },
  { id: 'a9',  name: 'Weekend Warrior',      description: 'Complete 10 weekend quests.',            category: 'loyalty',  rarity: 'uncommon', emoji: '🗓️', xpReward: 600,   pointReward: 1200,  isSecret: false, isCrossPlatform: false, isSeasonal: false, unlocked: true,  unlockedAt: '2026-03-15', unlockRate: 8.4 },
  { id: 'a10', name: 'APEX Climber',         description: 'Reach APEX tier.',                      category: 'loyalty',  rarity: 'legendary',emoji: '🏔️', xpReward: 30000, pointReward: 15000, isSecret: false, isCrossPlatform: false, isSeasonal: false, unlocked: false, unlockRate: 0.74 },
  { id: 'a11', name: 'Ambassador',           description: 'Refer 50 friends.',                     category: 'referral', rarity: 'epic',     emoji: '👑', xpReward: 10000, pointReward: 25000, isSecret: false, isCrossPlatform: false, isSeasonal: false, unlocked: false, unlockRate: 0.07 },
  { id: 'a12', name: 'Diwali Champion',      description: '#1 on the Diwali leaderboard.',         category: 'seasonal', rarity: 'legendary',emoji: '🪔', xpReward: 50000, pointReward: 25000, isSecret: false, isCrossPlatform: false, isSeasonal: true,  unlocked: false, unlockRate: 0.002 },
  { id: 'a13', name: 'Night Raider',         description: 'Participate in Night Raid campaign.',   category: 'seasonal', rarity: 'uncommon', emoji: '🌙', xpReward: 400,   pointReward: 800,   isSecret: false, isCrossPlatform: false, isSeasonal: true,  unlocked: true,  unlockedAt: '2026-05-01', unlockRate: 14.2 },
  { id: 'a14', name: 'The Whale',            description: 'Spend ₹100,000+ across all platforms.', category: 'purchase', rarity: 'rare',     emoji: '🐋', xpReward: 2000,  pointReward: 5000,  isSecret: false, isCrossPlatform: true,  isSeasonal: false, unlocked: false, unlockRate: 0.74 },
];

const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;

export default function AchievementsPage() {
  const [search, setSearch] = useState('');
  const [showUnlocked, setShowUnlocked] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');

  const filtered = ACHIEVEMENTS.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (showUnlocked === 'unlocked' && !a.unlocked) return false;
    if (showUnlocked === 'locked' && a.unlocked) return false;
    if (rarityFilter !== 'all' && a.rarity !== rarityFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <Medal className="h-8 w-8 text-nectar-400" />
          <h1 className="text-3xl font-black text-text-primary">Achievements</h1>
        </div>
        <p className="text-sm text-text-muted">
          <span className="text-nectar-400 font-bold">{unlockedCount}</span> of {ACHIEVEMENTS.length} unlocked
          <span className="mx-2 text-border">·</span>
          {((unlockedCount / ACHIEVEMENTS.length) * 100).toFixed(0)}% complete
        </p>
      </div>

      {/* Progress bar */}
      <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="h-2 w-full rounded-full overflow-hidden bg-base-elevated border border-border">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%`,
              background: 'linear-gradient(90deg, #F97316, #FBBF24)',
              boxShadow: '0 0 8px rgba(251,191,36,0.4)',
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap animate-fade-up" style={{ animationDelay: '160ms' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="portal-input pl-9 text-sm w-48"
          />
        </div>
        {(['all', 'unlocked', 'locked'] as const).map(f => (
          <button key={f} onClick={() => setShowUnlocked(f)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all', showUnlocked === f ? 'bg-nectar-400/10 border-nectar-400/30 text-nectar-300' : 'border-border text-text-muted hover:text-text-secondary')}>
            {f}
          </button>
        ))}
        <div className="flex gap-1.5">
          {(Object.keys(RARITY_CONFIG) as Rarity[]).map(r => {
            const cfg = RARITY_CONFIG[r];
            return (
              <button key={r} onClick={() => setRarityFilter(rarityFilter === r ? 'all' : r)}
                className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all capitalize', rarityFilter === r ? 'opacity-100' : 'opacity-40 hover:opacity-70')}
                style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}30` }}>
                {cfg.label}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-text-muted ml-auto">{filtered.length} shown</span>
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4 animate-fade-up" style={{ animationDelay: '240ms' }}>
        {filtered.map(a => {
          const rCfg = RARITY_CONFIG[a.rarity];
          return (
            <div
              key={a.id}
              className={cn(
                'relative rounded-2xl border p-5 transition-all duration-200 overflow-hidden',
                a.unlocked
                  ? 'hover:border-opacity-60 hover:shadow-lg cursor-pointer'
                  : 'opacity-50 grayscale'
              )}
              style={{
                borderColor: a.unlocked ? `${rCfg.color}30` : 'rgba(255,255,255,0.06)',
                background: a.unlocked ? rCfg.bg : 'rgba(255,255,255,0.02)',
                boxShadow: a.unlocked && a.rarity === 'legendary' ? `0 0 24px ${rCfg.glow}` : 'none',
              }}
            >
              {/* Glow for legendary */}
              {a.unlocked && a.rarity === 'legendary' && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${rCfg.glow} 0%, transparent 60%)` }} />
              )}

              <div className="relative flex items-start gap-3 mb-3">
                <div className="text-3xl shrink-0">
                  {a.isSecret && !a.unlocked ? '?' : a.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-sm font-bold text-text-primary">
                      {a.isSecret && !a.unlocked ? 'Hidden Achievement' : a.name}
                    </span>
                    {a.isCrossPlatform && <Globe className="h-3 w-3 text-status-info shrink-0" />}
                    {a.isSeasonal && <Sparkles className="h-3 w-3 text-yellow-400 shrink-0" />}
                    {a.isSecret && !a.unlocked && <EyeOff className="h-3 w-3 text-text-muted shrink-0" />}
                  </div>
                  <p className="text-xs text-text-muted line-clamp-2">
                    {a.isSecret && !a.unlocked ? 'Condition hidden until unlocked.' : a.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[10px] font-bold rounded-md px-2 py-0.5 border"
                  style={{ color: rCfg.color, background: rCfg.bg, borderColor: `${rCfg.color}30` }}>
                  {rCfg.label}
                </span>
                {a.unlocked && a.unlockedAt && (
                  <span className="text-[10px] text-status-success">Unlocked {a.unlockedAt}</span>
                )}
                {!a.unlocked && (
                  <span className="text-[10px] text-text-muted flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Locked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-base-overlay/60 px-2.5 py-1.5">
                  <div className="text-text-muted">XP</div>
                  <div className="font-bold text-status-success">+{a.xpReward.toLocaleString()}</div>
                </div>
                <div className="rounded-lg bg-base-overlay/60 px-2.5 py-1.5">
                  <div className="text-text-muted">Points</div>
                  <div className="font-bold text-nectar-400">+{a.pointReward.toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-3 text-[10px] text-text-muted">
                {a.unlockRate.toFixed(1)}% of players have this
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

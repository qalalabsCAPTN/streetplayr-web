// ============================================================
// Demo user profile — Rahul M., BLOOM tier, StreetPlayR primary
// Used across all portal pages as the authenticated user context.
// ============================================================

export const DEMO_USER = {
  id: 'usr_rahul_001',
  displayName: 'Rahul M.',
  username: 'rahul_m',
  avatarInitials: 'RM',
  email: 'rahul@example.com',
  tier: 'bloom' as const,
  platforms: ['streetplayr', 'playr', 'playr_club'],
  primaryPlatform: 'streetplayr' as const,
  joinedAt: '2025-11-15T10:00:00Z',
};

export const DEMO_WALLET = {
  userId: 'usr_rahul_001',
  nectarPoints: 24750,
  lifetimeEarned: 89340,
  lifetimeRedeemed: 64590,
  pendingPoints: 1250,
  lastTransactionAt: '2026-05-13T11:42:00Z',
};

export const DEMO_PROGRESSION = {
  userId: 'usr_rahul_001',
  tier: 'bloom' as const,
  tierMultiplier: 1.25,
  lifetimeXp: 18420,
  seasonXp: 8420,
  xpToNextTier: 20000,
  xpProgressPct: 92.1,
  nextTier: 'nectar' as const,
  currentStreakDays: 12,
  longestStreakDays: 24,
  lastActiveAt: '2026-05-13T11:42:00Z',
  achievementsUnlocked: 14,
  totalAchievements: 52,
  questsCompleted: 8,
  activeQuests: 3,
};

export const DEMO_REPUTATION = {
  overallScore: 78,
  trustLevel: 'verified' as const,
  engagementScore: 82,
  purchaseScore: 74,
  referralScore: 71,
  communityScore: 68,
  fraudAdjustedScore: 78,
};

export type TierId = 'seed' | 'sprout' | 'bloom' | 'nectar' | 'apex';

export const TIER_CONFIG: Record<TierId, { name: string; color: string; glow: string; bg: string; multiplier: number; xpThreshold: number }> = {
  seed:   { name: 'Seed',   color: '#94A3B8', glow: 'rgba(148,163,184,0.25)', bg: 'rgba(148,163,184,0.08)', multiplier: 1.0, xpThreshold: 0 },
  sprout: { name: 'Sprout', color: '#34D399', glow: 'rgba(52,211,153,0.25)',  bg: 'rgba(52,211,153,0.08)',  multiplier: 1.1, xpThreshold: 1000 },
  bloom:  { name: 'Bloom',  color: '#60A5FA', glow: 'rgba(96,165,250,0.25)',  bg: 'rgba(96,165,250,0.08)',  multiplier: 1.25,xpThreshold: 5000 },
  nectar: { name: 'Nectar', color: '#F97316', glow: 'rgba(249,115,22,0.25)',  bg: 'rgba(249,115,22,0.08)',  multiplier: 1.5, xpThreshold: 20000 },
  apex:   { name: 'APEX',   color: '#FBBF24', glow: 'rgba(251,191,36,0.35)',  bg: 'rgba(251,191,36,0.10)',  multiplier: 2.0, xpThreshold: 100000 },
};

export const PLATFORM_CONFIG = {
  streetplayr: { name: 'StreetPlayR', color: '#EF4444', emoji: '👟' },
  playr:       { name: 'PlayR',       color: '#8B5CF6', emoji: '🎯' },
  playr_club:  { name: 'PlayR Club',  color: '#06B6D4', emoji: '💎' },
  playr_game:  { name: 'PlayR Game',  color: '#F97316', emoji: '🎮' },
  system:      { name: 'NECTAR',      color: '#FBBF24', emoji: '⚡' },
};

export const DEMO_RECENT_TRANSACTIONS = [
  { id: 'tx_001', type: 'credit', amount: 1875, source: 'order.completed', platform: 'streetplayr', description: 'Air Jordan 1 purchase reward (1.25x Bloom)', at: '2026-05-13T11:42:00Z' },
  { id: 'tx_002', type: 'credit', amount: 500,  source: 'quest_completed', platform: 'system',      description: 'Quest: Weekend Warrior', at: '2026-05-12T20:15:00Z' },
  { id: 'tx_003', type: 'credit', amount: 2000, source: 'referral.converted', platform: 'system',   description: 'Referral bonus: Priya joined', at: '2026-05-11T14:30:00Z' },
  { id: 'tx_004', type: 'credit', amount: 750,  source: 'streak.milestone', platform: 'system',     description: '10-day streak milestone bonus', at: '2026-05-10T09:00:00Z' },
  { id: 'tx_005', type: 'credit', amount: 940,  source: 'order.completed', platform: 'playr',       description: 'PlayR order reward (1.25x Bloom)', at: '2026-05-09T16:45:00Z' },
  { id: 'tx_006', type: 'credit', amount: 188,  source: 'game.match_completed', platform: 'playr_game', description: 'Match reward (1.25x Bloom)', at: '2026-05-08T21:10:00Z' },
  { id: 'tx_007', type: 'credit', amount: 1500, source: 'referral.converted', platform: 'system',   description: 'Referral bonus: Arjun joined', at: '2026-05-07T11:00:00Z' },
  { id: 'tx_008', type: 'credit', amount: 625,  source: 'order.completed', platform: 'streetplayr', description: 'Adidas Ultraboost reward', at: '2026-05-06T13:20:00Z' },
];

export const DEMO_ACTIVITY_TIMELINE = [
  { id: 'act_001', type: 'purchase',             platform: 'streetplayr', title: 'Purchased Air Jordan 1 Retro High OG',       description: '+1,875 pts · +500 XP', emoji: '👟', xp: 500,  pts: 1875, at: '2026-05-13T11:42:00Z', hasCascade: false },
  { id: 'act_002', type: 'streak_milestone',     platform: 'system',      title: '12-day streak milestone',                      description: '+250 pts · Streak shield applied', emoji: '🔥', xp: 0,   pts: 250,  at: '2026-05-13T09:00:00Z', hasCascade: false },
  { id: 'act_003', type: 'quest_completed',      platform: 'system',      title: 'Quest completed: Weekend Warrior',             description: '+500 pts · +250 XP', emoji: '✅', xp: 250,  pts: 500,  at: '2026-05-12T20:15:00Z', hasCascade: true },
  { id: 'act_004', type: 'achievement_unlocked', platform: 'system',      title: 'Achievement: Night Owl',                       description: '+800 XP · +1,500 pts (Uncommon)', emoji: '🦉', xp: 800,  pts: 1500, at: '2026-05-12T01:15:00Z', hasCascade: false },
  { id: 'act_005', type: 'referral_converted',   platform: 'system',      title: 'Priya made her first purchase',                description: '+2,000 pts referral bonus', emoji: '👥', xp: 0,   pts: 2000, at: '2026-05-11T14:30:00Z', hasCascade: false },
  { id: 'act_006', type: 'purchase',             platform: 'playr',       title: 'Purchased on PlayR',                           description: '+940 pts · +250 XP', emoji: '🎯', xp: 250,  pts: 940,  at: '2026-05-09T16:45:00Z', hasCascade: false },
  { id: 'act_007', type: 'game_match',           platform: 'playr_game',  title: 'Match completed — 3-1 victory',                description: '+188 pts · +100 XP', emoji: '🎮', xp: 100,  pts: 188,  at: '2026-05-08T21:10:00Z', hasCascade: false },
  { id: 'act_008', type: 'referral_converted',   platform: 'system',      title: 'Arjun joined via your link',                   description: '+1,500 pts referral bonus', emoji: '🔗', xp: 0,   pts: 1500, at: '2026-05-07T11:00:00Z', hasCascade: false },
  { id: 'act_009', type: 'purchase',             platform: 'streetplayr', title: 'Purchased Adidas Ultraboost 22',               description: '+625 pts · +167 XP', emoji: '👟', xp: 167,  pts: 625,  at: '2026-05-06T13:20:00Z', hasCascade: false },
  { id: 'act_010', type: 'tier_upgrade',         platform: 'system',      title: 'Tier upgraded: Sprout → Bloom',               description: '1.25x multiplier unlocked · +2,000 pts', emoji: '🌸', xp: 1000, pts: 2000, at: '2026-04-20T15:00:00Z', hasCascade: true },
];

export const DEMO_ACTIVE_CAMPAIGNS = [
  { id: 'cmp_night_raid', name: 'Night Raid', emoji: '🌙', boost: '2x everything (00:00–04:00 UTC)', endsAt: '2026-05-31', color: '#6366F1', isEligible: true },
  { id: 'cmp_referral_blitz', name: 'Referral Blitz', emoji: '👥', boost: '2x referral points', endsAt: '2026-05-20', color: '#10B981', isEligible: true },
];

export const DEMO_ACTIVE_QUESTS = [
  { id: 'q_001', name: 'Social Butterfly', steps: 5, completedSteps: 3, reward: 3000, xpReward: 1500, frequency: 'weekly', endsAt: '2026-05-18' },
  { id: 'q_002', name: 'Streak Master', steps: 7, completedSteps: 5, reward: 1500, xpReward: 500, frequency: 'daily', endsAt: '2026-05-19' },
  { id: 'q_003', name: 'Refer 3 Friends', steps: 3, completedSteps: 1, reward: 8000, xpReward: 3000, frequency: 'once', endsAt: null },
];

export const DEMO_LEADERBOARD_POSITION = {
  xpWeekly:   { rank: 47,  total: 2840,  value: 2840,  label: 'XP this week' },
  referrals:  { rank: 12,  total: 18420, value: 7,     label: 'Referrals' },
  streak:     { rank: 184, total: 5621,  value: 12,    label: 'Streak days' },
};

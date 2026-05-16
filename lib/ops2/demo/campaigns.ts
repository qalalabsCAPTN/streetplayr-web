export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';
export type CampaignType = 'xp_boost' | 'points_multiplier' | 'drop_event' | 'leaderboard' | 'streak_boost' | 'flash_sale';
export type CampaignPriority = 'low' | 'normal' | 'high' | 'critical';

export interface CampaignBoost {
  type: 'xp_multiplier' | 'points_multiplier' | 'bonus_points' | 'streak_shield';
  value: number;
  eventTypes?: string[];
  userCapPoints?: number;
}

export interface CampaignLeaderboard {
  metric: string;
  topN: number;
  prizes: Array<{ rank: number | [number, number]; pointReward: number; badge?: string }>;
}

export interface CampaignSegmentRule {
  field: string;
  operator: string;
  value: unknown;
}

export interface Campaign {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  status: CampaignStatus;
  type: CampaignType;
  priority: CampaignPriority;
  platforms: string[];
  segmentRules: CampaignSegmentRule[];
  eligibleTiers: string[];
  boosts: CampaignBoost[];
  leaderboard?: CampaignLeaderboard;
  startsAt: string;
  endsAt: string;
  totalBudgetPoints?: number;
  pointsAwarded: number;
  participantCount: number;
  bannerUrl?: string;
  color?: string;
  emoji?: string;
  stackingPriority: number;
  isStackable: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp_diwali_rush',
    name: 'Diwali Sneaker Rush',
    tagline: '3× XP on every cop. Limited time.',
    description: 'Triple XP on all purchase events across StreetPlayR and PlayR platforms during Diwali weekend.',
    status: 'active',
    type: 'xp_boost',
    priority: 'critical',
    platforms: ['streetplayr', 'playr'],
    segmentRules: [],
    eligibleTiers: [],
    boosts: [
      { type: 'xp_multiplier', value: 3.0, eventTypes: ['order.completed'], userCapPoints: 50000 },
      { type: 'points_multiplier', value: 2.0, eventTypes: ['order.completed'] },
    ],
    leaderboard: {
      metric: 'xp_earned',
      topN: 10,
      prizes: [
        { rank: 1, pointReward: 25000, badge: 'diwali_champion' },
        { rank: 2, pointReward: 15000 },
        { rank: 3, pointReward: 10000 },
        { rank: [4, 10], pointReward: 5000 },
      ],
    },
    startsAt: '2026-10-20T00:00:00Z',
    endsAt: '2026-10-23T23:59:59Z',
    totalBudgetPoints: 500000,
    pointsAwarded: 187340,
    participantCount: 1847,
    color: '#F97316',
    emoji: '🪔',
    stackingPriority: 1,
    isStackable: false,
    createdBy: 'admin@nectar.internal',
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-20T08:12:33Z',
  },
  {
    id: 'cmp_night_raid',
    name: 'Night Raid',
    tagline: 'After midnight: 2× everything.',
    description: 'Flash campaign: double points and XP for all events between 00:00–04:00 UTC.',
    status: 'active',
    type: 'flash_sale',
    priority: 'high',
    platforms: ['playr', 'playr_club'],
    segmentRules: [{ field: 'lifetime_xp', operator: 'gte', value: 1000 }],
    eligibleTiers: ['sprout', 'bloom', 'nectar', 'apex'],
    boosts: [
      { type: 'xp_multiplier', value: 2.0, userCapPoints: 20000 },
      { type: 'points_multiplier', value: 2.0, userCapPoints: 20000 },
    ],
    startsAt: '2026-05-01T00:00:00Z',
    endsAt: '2026-05-31T23:59:59Z',
    totalBudgetPoints: 200000,
    pointsAwarded: 94210,
    participantCount: 623,
    color: '#6366F1',
    emoji: '🌙',
    stackingPriority: 2,
    isStackable: true,
    createdBy: 'growth@nectar.internal',
    createdAt: '2026-04-25T14:30:00Z',
    updatedAt: '2026-05-13T00:01:00Z',
  },
  {
    id: 'cmp_referral_blitz',
    name: 'Referral Blitz',
    tagline: 'Bring your crew. Get paid.',
    description: 'Bonus points for every successful referral during the blitz window.',
    status: 'active',
    type: 'points_multiplier',
    priority: 'normal',
    platforms: [],
    segmentRules: [],
    eligibleTiers: [],
    boosts: [
      { type: 'points_multiplier', value: 2.0, eventTypes: ['referral.converted'] },
      { type: 'bonus_points', value: 500, eventTypes: ['referral.signup'] },
    ],
    startsAt: '2026-05-10T00:00:00Z',
    endsAt: '2026-05-20T23:59:59Z',
    totalBudgetPoints: 300000,
    pointsAwarded: 52800,
    participantCount: 384,
    color: '#10B981',
    emoji: '👥',
    stackingPriority: 3,
    isStackable: true,
    createdBy: 'growth@nectar.internal',
    createdAt: '2026-05-05T09:00:00Z',
    updatedAt: '2026-05-13T12:00:00Z',
  },
  {
    id: 'cmp_apex_exclusive',
    name: 'APEX Tier Drop',
    tagline: 'Apex only. No exceptions.',
    description: 'Exclusive drop event for APEX tier members. Hidden achievements, bonus XP, early access.',
    status: 'scheduled',
    type: 'drop_event',
    priority: 'high',
    platforms: ['playr_club'],
    segmentRules: [{ field: 'tier', operator: 'eq', value: 'apex' }],
    eligibleTiers: ['apex'],
    boosts: [
      { type: 'bonus_points', value: 10000, eventTypes: ['drop.claimed'] },
      { type: 'xp_multiplier', value: 1.5 },
    ],
    startsAt: '2026-05-20T12:00:00Z',
    endsAt: '2026-05-21T12:00:00Z',
    totalBudgetPoints: 100000,
    pointsAwarded: 0,
    participantCount: 0,
    color: '#EAB308',
    emoji: '⚡',
    stackingPriority: 1,
    isStackable: false,
    createdBy: 'admin@nectar.internal',
    createdAt: '2026-05-08T16:00:00Z',
    updatedAt: '2026-05-08T16:00:00Z',
  },
  {
    id: 'cmp_streak_shield',
    name: 'Streak Defender',
    tagline: 'Protect your streak. One free pass.',
    description: 'All users with 7+ day streaks receive a streak shield — one missed day will not break their streak.',
    status: 'paused',
    type: 'streak_boost',
    priority: 'low',
    platforms: [],
    segmentRules: [{ field: 'streak_days', operator: 'gte', value: 7 }],
    eligibleTiers: [],
    boosts: [
      { type: 'streak_shield', value: 1 },
      { type: 'bonus_points', value: 250, eventTypes: ['streak.milestone'] },
    ],
    startsAt: '2026-04-01T00:00:00Z',
    endsAt: '2026-04-30T23:59:59Z',
    totalBudgetPoints: 50000,
    pointsAwarded: 31200,
    participantCount: 2140,
    color: '#3B82F6',
    emoji: '🛡️',
    stackingPriority: 5,
    isStackable: true,
    createdBy: 'ops@nectar.internal',
    createdAt: '2026-03-20T11:00:00Z',
    updatedAt: '2026-04-15T09:30:00Z',
  },
  {
    id: 'cmp_game_launch',
    name: 'PlayR Game Launch Week',
    tagline: 'First week. Max energy.',
    description: 'Celebration campaign for PlayR Game platform launch. All new game events earn double XP.',
    status: 'completed',
    type: 'xp_boost',
    priority: 'critical',
    platforms: ['playr_game'],
    segmentRules: [],
    eligibleTiers: [],
    boosts: [
      { type: 'xp_multiplier', value: 2.0, eventTypes: ['game.match_completed', 'game.achievement_unlocked'] },
      { type: 'bonus_points', value: 1000, eventTypes: ['game.first_match'] },
    ],
    startsAt: '2026-03-01T00:00:00Z',
    endsAt: '2026-03-07T23:59:59Z',
    totalBudgetPoints: 250000,
    pointsAwarded: 248730,
    participantCount: 3201,
    color: '#EC4899',
    emoji: '🎮',
    stackingPriority: 1,
    isStackable: false,
    createdBy: 'admin@nectar.internal',
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-03-07T23:59:59Z',
  },
];

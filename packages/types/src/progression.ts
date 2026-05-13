import type { UserId, AchievementId, QuestId, NectarPoints, ISO8601 } from './common.js';
import type { TierId } from './identity.js';

// ============================================================
// Progression — XP, achievements, streaks, quests, seasons
// ============================================================

export interface UserProgression {
  userId: UserId;
  tier: TierId;
  lifetimeXp: NectarPoints;
  seasonXp: NectarPoints;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveAt?: ISO8601;
  updatedAt: ISO8601;
}

export type AchievementCategory =
  | 'purchase'
  | 'social'
  | 'gaming'
  | 'loyalty'
  | 'referral'
  | 'seasonal'
  | 'hidden';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  category: AchievementCategory;
  iconUrl?: string;
  /** XP granted on unlock */
  xpReward: NectarPoints;
  /** Point reward on unlock */
  pointReward: NectarPoints;
  /** Unlock conditions expressed as rule conditions */
  unlockConditions: Array<{ field: string; operator: string; value: unknown }>;
  isSecret: boolean;
  createdAt: ISO8601;
}

export interface UserAchievement {
  userId: UserId;
  achievementId: AchievementId;
  unlockedAt: ISO8601;
  triggeringEventId?: string;
}

export type QuestStatus = 'available' | 'active' | 'completed' | 'expired' | 'locked';
export type QuestFrequency = 'once' | 'daily' | 'weekly' | 'seasonal';

export interface Quest {
  id: QuestId;
  name: string;
  description: string;
  frequency: QuestFrequency;
  steps: QuestStep[];
  rewardPoints: NectarPoints;
  rewardXp: NectarPoints;
  startsAt?: ISO8601;
  endsAt?: ISO8601;
  createdAt: ISO8601;
}

export interface QuestStep {
  stepId: string;
  description: string;
  eventType: string;
  /** How many times this event must occur */
  requiredCount: number;
}

export interface UserQuestProgress {
  userId: UserId;
  questId: QuestId;
  status: QuestStatus;
  stepProgress: Record<string, number>;
  completedAt?: ISO8601;
  startedAt: ISO8601;
  expiresAt?: ISO8601;
}

export interface Season {
  id: string;
  name: string;
  startsAt: ISO8601;
  endsAt: ISO8601;
  description?: string;
  rewards: SeasonReward[];
  createdAt: ISO8601;
}

export interface SeasonReward {
  xpThreshold: NectarPoints;
  rewardType: 'points' | 'badge' | 'drop';
  rewardValue: unknown;
  label: string;
}

import type { UserId, ISO8601 } from './common.js';

// ============================================================
// Identity — unified cross-platform user representation
// ============================================================

export type TierId = 'seed' | 'sprout' | 'bloom' | 'nectar' | 'apex';

export interface Tier {
  id: TierId;
  label: string;
  /** Minimum lifetime XP required to enter this tier */
  xpThreshold: number;
  /** Reward multiplier applied to all point grants at this tier */
  multiplier: number;
  color: string;
}

export const TIERS: Record<TierId, Tier> = {
  seed:   { id: 'seed',   label: 'Seed',   xpThreshold: 0,     multiplier: 1.0, color: '#9CA3AF' },
  sprout: { id: 'sprout', label: 'Sprout', xpThreshold: 500,   multiplier: 1.1, color: '#34D399' },
  bloom:  { id: 'bloom',  label: 'Bloom',  xpThreshold: 2000,  multiplier: 1.25, color: '#60A5FA' },
  nectar: { id: 'nectar', label: 'Nectar', xpThreshold: 7500,  multiplier: 1.5, color: '#F59E0B' },
  apex:   { id: 'apex',   label: 'Apex',   xpThreshold: 25000, multiplier: 2.0, color: '#C026D3' },
};

export type AccountStatus = 'active' | 'suspended' | 'flagged' | 'closed';

export interface IdentityUser {
  id: UserId;
  email: string;
  emailVerified: boolean;
  status: AccountStatus;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface IdentityProfile {
  userId: UserId;
  displayName: string;
  avatarUrl?: string;
  tier: TierId;
  reputationScore: number;
  /** Lifetime XP — never decreases */
  lifetimeXp: number;
  /** Current season XP */
  seasonXp: number;
  connectedPlatforms: PlatformConnection[];
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface PlatformConnection {
  platform: string;
  externalId: string;
  connectedAt: ISO8601;
  metadata?: Record<string, unknown>;
}

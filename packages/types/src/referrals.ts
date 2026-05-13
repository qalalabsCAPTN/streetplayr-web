import type { UserId, ReferralId, NectarPoints, ISO8601 } from './common.js';

// ============================================================
// Referrals — referral graph, attribution, ambassador mechanics
// ============================================================

export type ReferralStatus = 'pending' | 'converted' | 'expired' | 'invalid' | 'fraud';

export interface Referral {
  id: ReferralId;
  referrerId: UserId;
  referredUserId?: UserId;
  referralCode: string;
  status: ReferralStatus;
  /** Points granted to referrer upon conversion */
  referrerPointsGranted?: NectarPoints;
  /** Points granted to referred user as welcome bonus */
  referredPointsGranted?: NectarPoints;
  attributedOrderId?: string;
  attributedOrderValue?: number;
  convertedAt?: ISO8601;
  expiresAt?: ISO8601;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

/** An edge in the referral graph — who brought whom */
export interface ReferralEdge {
  referrerId: UserId;
  referredUserId: UserId;
  depth: number;
  referralId: ReferralId;
  createdAt: ISO8601;
}

export interface ReferralCode {
  code: string;
  userId: UserId;
  isActive: boolean;
  useCount: number;
  maxUses?: number;
  createdAt: ISO8601;
  expiresAt?: ISO8601;
}

export type AmbassadorTier = 'standard' | 'silver' | 'gold' | 'elite';

export interface AmbassadorProfile {
  userId: UserId;
  tier: AmbassadorTier;
  totalReferrals: number;
  convertedReferrals: number;
  totalPointsEarned: NectarPoints;
  conversionRate: number;
  enrolledAt: ISO8601;
  updatedAt: ISO8601;
}

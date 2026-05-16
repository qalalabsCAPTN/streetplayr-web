import type { EventId, UserId, ISO8601 } from './common.js';

// ============================================================
// Events — canonical event envelope for all NECTAR domain events
// External platforms emit events. NECTAR interprets meaning.
// ============================================================

export type KnownPlatform =
  | 'streetplayr'
  | 'playr-game'
  | 'playr-club'
  | 'nectar-internal';

// ---- Known event types -----------------------------------------------
// Namespaced: domain.action
export type EventType =
  // Commerce
  | 'purchase.completed'
  | 'purchase.refunded'
  | 'purchase.first_order'
  // Game
  | 'game.completed'
  | 'game.level_up'
  | 'game.daily_challenge_completed'
  // Membership
  | 'membership.activated'
  | 'membership.renewed'
  | 'membership.cancelled'
  // Referral
  | 'referral.link_generated'
  | 'referral.signup_attributed'
  | 'referral.converted'
  // Social
  | 'review.submitted'
  | 'content.shared'
  | 'qr.scanned'
  // Progression
  | 'streak.maintained'
  | 'streak.broken'
  | 'achievement.unlocked'
  // Drops / Rewards
  | 'drop.claimed'
  | 'quest.completed'
  | 'quest.started'
  // Identity
  | 'profile.completed'
  | 'platform.connected'
  // System
  | 'reward.executed'
  | 'wallet.credited'
  | 'wallet.debited'
  | string; // allow extension without breaking types

export type EventProcessingStatus =
  | 'received'
  | 'queued'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'dead_lettered';

/**
 * Canonical event envelope.
 * Every event entering NECTAR — from any platform — must conform to this shape.
 */
export interface NectarEvent<TPayload = Record<string, unknown>> {
  eventId: EventId;
  eventType: EventType;
  timestamp: ISO8601;
  /** The user this event is about */
  actorUserId: UserId;
  /** Which platform emitted this event */
  platform: KnownPlatform | string;
  /** Platform-assigned session or trace ID for debugging */
  platformTraceId?: string;
  payload: TPayload;
  metadata?: EventMetadata;
}

export interface EventMetadata {
  /** HMAC signature from the emitting platform */
  signature?: string;
  /** Schema version of this event payload */
  schemaVersion?: string;
  /** Replay flag — set when re-processing a failed event */
  isReplay?: boolean;
  /** IP address of originating request (for fraud signals) */
  ipAddress?: string;
  /** User-agent of originating request */
  userAgent?: string;
  [key: string]: unknown;
}

/** Stored event record with processing state */
export interface StoredEvent extends NectarEvent {
  status: EventProcessingStatus;
  processingAttempts: number;
  lastAttemptAt?: ISO8601;
  processedAt?: ISO8601;
  errorMessage?: string;
  createdAt: ISO8601;
}

// ---- Typed payload interfaces for known events -------------------------

export interface PurchaseCompletedPayload {
  orderId: string;
  orderTotal: number;
  currency: string;
  lineItems: Array<{ productId: string; quantity: number; price: number }>;
  isFirstOrder?: boolean;
}

export interface GameCompletedPayload {
  gameId: string;
  gameMode: string;
  score: number;
  durationSeconds: number;
  rank?: number;
}

export interface ReferralConvertedPayload {
  referralCode: string;
  referrerId: UserId;
  referredUserId: UserId;
  convertedOrderId?: string;
  convertedOrderValue?: number;
}

export interface QuestCompletedPayload {
  questId: string;
  questName: string;
  completionTimeMs: number;
}

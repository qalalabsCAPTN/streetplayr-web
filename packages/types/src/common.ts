// ============================================================
// Common primitives used across all NECTAR domains
// ============================================================

export type UUID = string;
export type ISO8601 = string;
export type UnixMs = number;

export type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId = Brand<UUID, 'UserId'>;
export type WalletId = Brand<UUID, 'WalletId'>;
export type TransactionId = Brand<UUID, 'TransactionId'>;
export type EventId = Brand<UUID, 'EventId'>;
export type RuleId = Brand<UUID, 'RuleId'>;
export type ReferralId = Brand<UUID, 'ReferralId'>;
export type CampaignId = Brand<UUID, 'CampaignId'>;
export type QuestId = Brand<UUID, 'QuestId'>;
export type AchievementId = Brand<UUID, 'AchievementId'>;

/** Integer Nectar Points — always stored as integers, never floats */
export type NectarPoints = Brand<number, 'NectarPoints'>;

export interface PaginationParams {
  limit: number;
  offset: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface Result<T, E = Error> {
  ok: boolean;
  data?: T;
  error?: E;
}

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<E extends Error>(error: E): Result<never, E> {
  return { ok: false, error };
}

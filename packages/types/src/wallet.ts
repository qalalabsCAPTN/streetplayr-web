import type { UserId, WalletId, TransactionId, NectarPoints, ISO8601 } from './common.js';

// ============================================================
// Wallet — immutable append-only ledger types
// BALANCES ARE NEVER DIRECTLY MUTATED.
// All balances derive from transaction history.
// ============================================================

export type WalletType = 'points' | 'credits' | 'xp';

export interface WalletAccount {
  id: WalletId;
  userId: UserId;
  walletType: WalletType;
  /** Computed read-only balance — never stored, always derived */
  readonly balance: NectarPoints;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export type TransactionType =
  | 'credit'    // Points added
  | 'debit'     // Points consumed
  | 'hold'      // Points reserved (pending)
  | 'release'   // Hold released without consuming
  | 'expire';   // Points expired per policy

export type TransactionStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'expired';

export type TransactionSource =
  | 'reward_execution'
  | 'referral_bonus'
  | 'quest_completion'
  | 'achievement_unlock'
  | 'admin_adjustment'
  | 'expiration'
  | 'redemption'
  | 'drop_claim';

/** Immutable ledger entry. Once written, never mutated. */
export interface WalletTransaction {
  id: TransactionId;
  walletId: WalletId;
  userId: UserId;
  type: TransactionType;
  status: TransactionStatus;
  source: TransactionSource;
  amount: NectarPoints;
  /** Running balance AFTER this transaction was applied */
  balanceAfter: NectarPoints;
  /** Idempotency key — prevents double-writes */
  idempotencyKey: string;
  /** Reference to the triggering domain object */
  referenceId?: string;
  referenceType?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: ISO8601;
  /** Transactions are append-only — no updatedAt */
}

export interface WalletBalance {
  walletId: WalletId;
  userId: UserId;
  walletType: WalletType;
  available: NectarPoints;
  held: NectarPoints;
  total: NectarPoints;
  computedAt: ISO8601;
}

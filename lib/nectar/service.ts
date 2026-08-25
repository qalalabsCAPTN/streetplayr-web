/**
 * NECTAR read-service — the ONE seam the Admin goes through to read
 * ecosystem/NECTAR data (wallets, ledger, reward rules, reward
 * executions, events).
 *
 * Server-only. Never imported from a client component. Uses the
 * service-role admin Supabase client because NECTAR's HTTP API
 * (apps/api in the NECTAR monorepo) is not deployed anywhere reachable
 * from this app in the current environment — this is the SAME shared
 * Supabase project NECTAR itself writes to (see ECOSYSTEM_CONTRACTS.md,
 * NECTAR_FOUNDATION_GREEN_REPORT.md), so reading it server-side here is
 * equivalent in trust level to NECTAR's own apps/api reading it, just
 * without an HTTP hop. This is a deliberate, documented interim choice —
 * see UNIFIED_ADMIN_ARCHITECTURE.md "NECTAR service boundary" for the
 * swap-to-HTTP migration path once NECTAR's API is actually deployed.
 *
 * HARD RULE: this file is READ-ONLY. No function here writes to
 * `nectar_wallet_transactions`, `reward_executions`, `events`, or
 * `reward_rules`. Wallet/ledger mutations must go through NECTAR's own
 * RewardEngine/LedgerRepository (i.e. the real pipeline), never a
 * direct Admin insert — see PURCHASE_COMPLETED_CONTRACT.md and
 * NECTAR_FOUNDATION_GREEN_REPORT.md for why that boundary matters.
 *
 * Canonical ledger table: `nectar_wallet_transactions`. NEVER
 * `wallet_transactions` (StreetPlayR's separate, unrelated, legacy
 * table — see STREETPLAYR_WALLET_RECONCILIATION.md's correction notice).
 */
import { createAdminClient } from '@/lib/supabase/admin';

export interface NectarWalletBalance {
  walletId: string;
  userId: string;
  walletType: string;
  available: number;
  held: number;
  total: number;
  computedAt: string;
}

export interface NectarLedgerTransaction {
  id: string;
  walletId: string | null;
  userId: string;
  type: string;
  status: string | null;
  source: string;
  amount: number | null;
  balanceAfter: number | null;
  idempotencyKey: string | null;
  referenceId: string | null;
  referenceType: string | null;
  description: string | null;
  createdAt: string;
}

export interface NectarRewardExecution {
  id: string;
  ruleId: string;
  ruleName: string | null;
  userId: string;
  eventId: string | null;
  status: string;
  pointsGranted: number;
  xpGranted: number;
  multiplierApplied: number;
  transactionId: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface NectarEcosystemEvent {
  id: string;
  eventType: string;
  platform: string;
  actorUserId: string | null;
  status: string;
  processingAttempts: number;
  errorMessage: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface NectarRewardRule {
  id: string;
  name: string;
  description: string | null;
  status: string;
  type: string;
  triggers: string[];
  baseAmount: number;
  cooldownSeconds: number | null;
  maxUsagePerUser: number | null;
  createdAt: string;
}

/** Reads a user's wallet balance for a given wallet type (default 'points'). */
export async function getWalletBalance(
  userId: string,
  walletType: string = 'points'
): Promise<NectarWalletBalance | null> {
  const db = createAdminClient();
  const { data: wallet } = await db
    .from('wallet_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('wallet_type', walletType)
    .maybeSingle();

  if (!wallet) return null;

  const { data } = await db
    .from('wallet_balances')
    .select('*')
    .eq('wallet_id', wallet.id)
    .maybeSingle();

  if (!data) return null;

  return {
    walletId: data.wallet_id,
    userId: data.user_id,
    walletType: data.wallet_type,
    available: data.available ?? 0,
    held: data.held ?? 0,
    total: data.total ?? 0,
    computedAt: data.computed_at,
  };
}

/** Lists ledger transactions from the canonical NECTAR ledger. */
export async function listLedgerTransactions(opts?: {
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ transactions: NectarLedgerTransaction[]; total: number; error?: string }> {
  const db = createAdminClient();
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let query = db
    .from('nectar_wallet_transactions')
    .select('id, wallet_id, user_id, type, status, source, amount, balance_after, idempotency_key, reference_id, reference_type, description, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.userId) query = query.eq('user_id', opts.userId);

  const { data, error, count } = await query;
  if (error) return { transactions: [], total: 0, error: error.message };

  const transactions: NectarLedgerTransaction[] = (data ?? []).map((row: any) => ({
    id: row.id,
    walletId: row.wallet_id,
    userId: row.user_id,
    type: row.type,
    status: row.status,
    source: row.source,
    amount: row.amount,
    balanceAfter: row.balance_after,
    idempotencyKey: row.idempotency_key,
    referenceId: row.reference_id,
    referenceType: row.reference_type,
    description: row.description,
    createdAt: row.created_at,
  }));

  return { transactions, total: count ?? transactions.length };
}

/** Lists reward executions, optionally joined with the rule name. */
export async function listRewardExecutions(opts?: {
  userId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ executions: NectarRewardExecution[]; total: number; error?: string }> {
  const db = createAdminClient();
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let query = db
    .from('reward_executions')
    .select('id, rule_id, user_id, event_id, status, points_granted, xp_granted, multiplier_applied, transaction_id, failure_reason, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.userId) query = query.eq('user_id', opts.userId);
  if (opts?.status) query = query.eq('status', opts.status);

  const { data, error, count } = await query;
  if (error) return { executions: [], total: 0, error: error.message };

  const ruleIds = Array.from(new Set((data ?? []).map((r: any) => r.rule_id).filter(Boolean)));
  let ruleNames: Record<string, string> = {};
  if (ruleIds.length > 0) {
    const { data: rules } = await db.from('reward_rules').select('id, name').in('id', ruleIds);
    ruleNames = Object.fromEntries((rules ?? []).map((r: any) => [r.id, r.name]));
  }

  const executions: NectarRewardExecution[] = (data ?? []).map((row: any) => ({
    id: row.id,
    ruleId: row.rule_id,
    ruleName: ruleNames[row.rule_id] ?? null,
    userId: row.user_id,
    eventId: row.event_id,
    status: row.status,
    pointsGranted: row.points_granted ?? 0,
    xpGranted: row.xp_granted ?? 0,
    multiplierApplied: row.multiplier_applied ?? 1,
    transactionId: row.transaction_id,
    failureReason: row.failure_reason,
    createdAt: row.created_at,
  }));

  return { executions, total: count ?? executions.length };
}

/** Lists ecosystem events from the real `events` table. */
export async function listEcosystemEvents(opts?: {
  platform?: string;
  status?: string | string[];
  limit?: number;
}): Promise<{ events: NectarEcosystemEvent[]; error?: string }> {
  const db = createAdminClient();
  const limit = opts?.limit ?? 100;

  let query = db
    .from('events')
    .select('id, event_type, platform, actor_user_id, status, processing_attempts, error_message, created_at, processed_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (opts?.platform) query = query.eq('platform', opts.platform);
  if (opts?.status) {
    query = Array.isArray(opts.status) ? query.in('status', opts.status) : query.eq('status', opts.status);
  }

  const { data, error } = await query;
  if (error) return { events: [], error: error.message };

  const events: NectarEcosystemEvent[] = (data ?? []).map((row: any) => ({
    id: row.id,
    eventType: row.event_type,
    platform: row.platform,
    actorUserId: row.actor_user_id,
    status: row.status,
    processingAttempts: row.processing_attempts ?? 0,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    processedAt: row.processed_at,
  }));

  return { events };
}

/** Lists reward rules (read-only — rule authoring is a NECTAR concern, not Admin's, until a write API exists). */
export async function listRewardRules(): Promise<{ rules: NectarRewardRule[]; error?: string }> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('reward_rules')
    .select('id, name, description, status, type, triggers, base_amount, cooldown_seconds, max_usage_per_user, created_at')
    .order('created_at', { ascending: false });

  if (error) return { rules: [], error: error.message };

  const rules: NectarRewardRule[] = (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    type: row.type,
    triggers: row.triggers ?? [],
    baseAmount: row.base_amount ?? 0,
    cooldownSeconds: row.cooldown_seconds,
    maxUsagePerUser: row.max_usage_per_user,
    createdAt: row.created_at,
  }));

  return { rules };
}

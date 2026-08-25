'use server';

/**
 * Admin server actions for NECTAR (ecosystem) read surfaces.
 *
 * These are the ONLY sanctioned entry points the Admin UI uses to read
 * NECTAR data — every one delegates to lib/nectar/service.ts (the
 * single service-layer seam) and is gated by requireSSRRole(). No
 * client component ever imports lib/nectar/service.ts directly or
 * queries Supabase for these tables itself.
 *
 * Read-only, deliberately. There is no writeLedgerEntry/adjustNectarWallet
 * action here — see lib/nectar/service.ts's header comment for why.
 */
import { requireSSRRole } from '@/lib/auth/ssr';
import { OPS_ROLES } from '@/lib/auth/permissions';
import {
  getWalletBalance,
  listLedgerTransactions,
  listRewardExecutions,
  listEcosystemEvents,
  listRewardRules,
  type NectarWalletBalance,
  type NectarLedgerTransaction,
  type NectarRewardExecution,
  type NectarEcosystemEvent,
  type NectarRewardRule,
} from '@/lib/nectar/service';

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function getNectarWalletBalanceAction(
  userId: string,
  walletType = 'points'
): Promise<ActionResult<NectarWalletBalance | null>> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { success: false, error: auth.error.error };

  try {
    const balance = await getWalletBalance(userId, walletType);
    return { success: true, data: balance };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to read wallet balance' };
  }
}

export async function listNectarLedgerAction(opts?: {
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<{ transactions: NectarLedgerTransaction[]; total: number }>> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { success: false, error: auth.error.error };

  const { transactions, total, error } = await listLedgerTransactions(opts);
  if (error) return { success: false, error };
  return { success: true, data: { transactions, total } };
}

export async function listNectarRewardExecutionsAction(opts?: {
  userId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<{ executions: NectarRewardExecution[]; total: number }>> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { success: false, error: auth.error.error };

  const { executions, total, error } = await listRewardExecutions(opts);
  if (error) return { success: false, error };
  return { success: true, data: { executions, total } };
}

export async function listNectarEventsAction(opts?: {
  platform?: string;
  status?: string | string[];
  limit?: number;
}): Promise<ActionResult<NectarEcosystemEvent[]>> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { success: false, error: auth.error.error };

  const { events, error } = await listEcosystemEvents(opts);
  if (error) return { success: false, error };
  return { success: true, data: events };
}

export async function listNectarRewardRulesAction(): Promise<ActionResult<NectarRewardRule[]>> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { success: false, error: auth.error.error };

  const { rules, error } = await listRewardRules();
  if (error) return { success: false, error };
  return { success: true, data: rules };
}

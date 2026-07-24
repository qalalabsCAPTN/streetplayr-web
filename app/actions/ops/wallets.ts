'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSSRRole } from '@/lib/auth/ssr';
import { OPS_ROLES } from '@/lib/auth/permissions';

export type AdminWalletTxRow = {
  id: string;
  user_id: string;
  type: string;
  source: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  wallet_type: string;
};

/**
 * Admin nectar wallet ledger — service-role read, no browser Supabase.
 * Replaces getSupabaseClient on /admin/nectar/wallets.
 */
export async function listAdminWalletTransactionsAction(opts?: {
  siteSlug?: string;
  search?: string;
  limit?: number;
}): Promise<{ success: boolean; error?: string; transactions?: AdminWalletTxRow[] }> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  const limit = opts?.limit ?? 100;

  try {
    const admin = createAdminClient();
    let siteId: string | undefined;

    if (opts?.siteSlug) {
      const { data: site } = await admin
        .from('sites')
        .select('id')
        .eq('slug', opts.siteSlug)
        .single();
      siteId = (site as { id: string } | null)?.id;
      if (!siteId) return { success: true, transactions: [] };
    }

    let query = admin
      .from('wallet_transactions')
      .select('id, user_id, type, source, delta, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (siteId) query = query.eq('site_id', siteId);

    const term = opts?.search?.trim();
    if (term) {
      query = query.or(`user_id.ilike.%${term}%,source.ilike.%${term}%`);
    }

    const { data: rows, error } = await query;
    if (error) return { success: false, error: error.message, transactions: [] };

    const txRows = (rows ?? []) as Array<{
      id: string;
      user_id: string;
      type: string;
      source: string;
      delta: number;
      created_at: string;
    }>;

    const transactions: AdminWalletTxRow[] = txRows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      source: row.source,
      amount: Math.abs(row.delta ?? 0),
      balance_after: 0,
      description: row.source || row.type || 'Transaction',
      created_at: row.created_at,
      wallet_type: 'sprr',
    }));

    return { success: true, transactions };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to list wallet transactions',
      transactions: [],
    };
  }
}

export async function adjustWalletAction(
  userId: string,
  delta: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  if (delta === 0) return { success: false, error: 'Delta must be non-zero' };
  if (!reason.trim()) return { success: false, error: 'Reason is required' };

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('sprr_balance')
      .eq('id', userId)
      .single();

    if (!profile) return { success: false, error: 'User not found' };

    const newBalance = Math.max(0, (profile.sprr_balance ?? 0) + delta);
    await admin.from('profiles').update({ sprr_balance: newBalance }).eq('id', userId);
    await admin.from('wallet_transactions').insert({
      user_id: userId,
      type: delta > 0 ? 'earned' : 'spent',
      delta,
      source: reason,
    });

    await admin.from('manual_wallet_adjustments').insert({
      ops_user_id: auth.user.id,
      user_id: userId,
      adjustment_type: delta > 0 ? 'credit' : 'debit',
      amount: Math.abs(delta),
      reason,
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getWalletTransactionsAction(userId: string, page = 1, pageSize = 20) {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { data: [], total: 0, error: auth.error.error };

  try {
    const admin = createAdminClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count } = await admin
      .from('wallet_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);
    return { data: data ?? [], total: count ?? 0 };
  } catch {
    return { data: [], total: 0 };
  }
}

export async function getAllTransactionsAction(page = 1, pageSize = 50) {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { data: [], total: 0, error: auth.error.error };

  try {
    const admin = createAdminClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count } = await admin
      .from('wallet_transactions')
      .select('*, profiles!inner(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    return { data: data ?? [], total: count ?? 0 };
  } catch {
    return { data: [], total: 0 };
  }
}

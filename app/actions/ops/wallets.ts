'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function adjustWalletAction(
  userId: string,
  delta: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (delta === 0) return { success: false, error: 'Delta must be non-zero' };
  if (!reason.trim()) return { success: false, error: 'Reason is required' };

  try {
    const admin = createAdminClient();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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

    // Audit trail
    if (user) {
      await admin.from('manual_wallet_adjustments').insert({
        ops_user_id: user.id,
        user_id: userId,
        adjustment_type: delta > 0 ? 'credit' : 'debit',
        amount: Math.abs(delta),
        reason,
      });
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getWalletTransactionsAction(userId: string, page = 1, pageSize = 20) {
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

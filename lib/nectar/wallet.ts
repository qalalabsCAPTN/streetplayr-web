import { createAdminClient } from '@/lib/supabase/admin';

export interface WalletData {
  sprrBalance: number;
  xp: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  pendingPoints: number;
}

export interface WalletTransaction {
  id: string;
  type: string;   // 'earned' | 'referral_bonus' | 'adjustment' | 'redemption'
  delta: number;
  source: string;
  description?: string | null;
  siteId?: string | null;
  createdAt: string;
}

export interface MonthlyEarning {
  month: string;   // e.g. "May 2026"
  earned: number;
  redeemed: number;
}

/**
 * Fetch the current wallet balance and stats for a user from real DB.
 */
export async function getWalletBalance(userId: string): Promise<WalletData> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('sprr_balance, xp')
    .eq('id', userId)
    .single();

  const { data: txs } = await admin
    .from('wallet_transactions')
    .select('type, delta')
    .eq('user_id', userId);

  const all = txs ?? [];
  const lifetimeEarned = all
    .filter((t: any) => t.delta > 0)
    .reduce((s: number, t: any) => s + (t.delta ?? 0), 0);
  const lifetimeRedeemed = all
    .filter((t: any) => t.type === 'redemption' || t.delta < 0)
    .reduce((s: number, t: any) => s + Math.abs(t.delta ?? 0), 0);

  return {
    sprrBalance: profile?.sprr_balance ?? 0,
    xp: profile?.xp ?? 0,
    lifetimeEarned,
    lifetimeRedeemed,
    pendingPoints: 0, // No pending concept in current schema
  };
}

/**
 * Fetch recent wallet transactions for a user (latest 100).
 */
export async function getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('wallet_transactions')
    .select('id, type, delta, source, site_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  return (data ?? []).map((t: any) => ({
    id: t.id,
    type: (t.delta ?? 0) >= 0 ? 'credit' : 'debit',
    delta: t.delta ?? 0,
    source: t.source ?? '',
    description: formatTransactionDescription(t.source, t.delta),
    siteId: t.site_id ?? null,
    createdAt: t.created_at,
  }));
}

/**
 * Aggregate monthly earned/redeemed from wallet_transactions.
 * Returns last 6 months, newest first.
 */
export async function getMonthlyEarnings(userId: string): Promise<MonthlyEarning[]> {
  const admin = createAdminClient();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data } = await admin
    .from('wallet_transactions')
    .select('type, delta, created_at')
    .eq('user_id', userId)
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at', { ascending: false });

  const byMonth: Record<string, { earned: number; redeemed: number }> = {};

  for (const tx of data ?? []) {
    const d = new Date(tx.created_at);
    const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' }); // "May 2026"
    if (!byMonth[key]) byMonth[key] = { earned: 0, redeemed: 0 };

    const delta = tx.delta ?? 0;
    if (delta > 0) {
      byMonth[key].earned += delta;
    } else {
      byMonth[key].redeemed += Math.abs(delta);
    }
  }

  // Return sorted newest-first, up to 6 months
  return Object.entries(byMonth)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 6)
    .map(([month, v]) => ({ month, ...v }));
}

function formatTransactionDescription(source: string, delta: number): string {
  const map: Record<string, string> = {
    earned: 'SP-RR earned',
    referral_bonus: 'Referral bonus',
    adjustment: 'Manual adjustment',
    redemption: 'Reward redeemed',
    welcome_bonus: 'Welcome bonus',
    purchase: 'Purchase reward',
  };
  return map[source] ?? (delta >= 0 ? 'Points credited' : 'Points debited');
}

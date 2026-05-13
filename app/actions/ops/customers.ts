'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function getCustomerDetailAction(customerId: string) {
  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .single();
    if (!profile) return null;

    const { data: orders } = await admin
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', customerId)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: walletTx } = await admin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', customerId)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: referrals } = await admin
      .from('referral_claims')
      .select('*, referred:profiles!referral_claims_referred_id_fkey(full_name, email)')
      .eq('referrer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: referredBy } = await admin
      .from('referral_claims')
      .select('*, referrer:profiles!referral_claims_referrer_id_fkey(full_name, email)')
      .eq('referred_id', customerId)
      .maybeSingle();

    return {
      profile,
      orders: orders ?? [],
      walletTx: walletTx ?? [],
      referrals: referrals ?? [],
      referredBy,
    };
  } catch {
    return null;
  }
}

export async function getCustomersPaginatedAction(page = 1, pageSize = 20) {
  try {
    const admin = createAdminClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data: profiles, count } = await admin
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    return { data: profiles ?? [], total: count ?? 0 };
  } catch {
    return { data: [], total: 0 };
  }
}

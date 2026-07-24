'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSSRRole } from '@/lib/auth/ssr';
import { OPS_ROLES } from '@/lib/auth/permissions';
import { deriveTier } from '@/lib/nectar/engine';
import type { CustomerOverview } from '@/types/ops2/ops';

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  sprr_balance: number | null;
  lifetime_xp: number | null;
  last_active_at: string | null;
  created_at: string;
};

async function resolveSiteId(
  admin: ReturnType<typeof createAdminClient>,
  siteSlug?: string
): Promise<string | undefined> {
  if (!siteSlug) return undefined;
  const { data } = await admin.from('sites').select('id').eq('slug', siteSlug).single();
  return (data as { id: string } | null)?.id;
}

/**
 * Admin customers list — aggregates spend/orders/platforms server-side.
 * Replaces browser getSupabaseClient reads on /admin/customers.
 */
export async function listAdminCustomersAction(opts?: {
  siteSlug?: string;
  search?: string;
}): Promise<{ success: boolean; error?: string; customers?: CustomerOverview[]; total?: number }> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  try {
    const admin = createAdminClient();
    const siteId = await resolveSiteId(admin, opts?.siteSlug);

    let ordersQuery = admin
      .from('orders')
      .select('id, user_id, total, site_id')
      .order('created_at', { ascending: false })
      .limit(500);
    let txQuery = admin
      .from('wallet_transactions')
      .select('user_id, site_id')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (siteId) {
      ordersQuery = ordersQuery.eq('site_id', siteId);
      txQuery = txQuery.eq('site_id', siteId);
    }

    const [{ data: siteRows }, { data: orders }, { data: walletTx }] = await Promise.all([
      admin.from('sites').select('id, slug'),
      ordersQuery,
      txQuery,
    ]);

    const siteList = (siteRows ?? []) as Array<{ id: string; slug: string }>;
    const orderRows = (orders ?? []) as Array<{
      user_id: string;
      total: number;
      site_id?: string | null;
    }>;
    const txRows = (walletTx ?? []) as Array<{ user_id: string; site_id?: string | null }>;

    const relevantUserIds = new Set<string>();
    const spendByUser: Record<string, number> = {};
    const orderCountByUser: Record<string, number> = {};
    const platformByUser: Record<string, Set<string>> = {};
    const slugBySiteId = new Map(siteList.map((row) => [row.id, row.slug]));

    for (const order of orderRows) {
      relevantUserIds.add(order.user_id);
      spendByUser[order.user_id] = (spendByUser[order.user_id] ?? 0) + (order.total ?? 0);
      orderCountByUser[order.user_id] = (orderCountByUser[order.user_id] ?? 0) + 1;
      const slug = order.site_id ? slugBySiteId.get(order.site_id) : undefined;
      if (slug) {
        if (!platformByUser[order.user_id]) platformByUser[order.user_id] = new Set<string>();
        platformByUser[order.user_id]!.add(slug);
      }
    }

    for (const tx of txRows) {
      relevantUserIds.add(tx.user_id);
      const slug = tx.site_id ? slugBySiteId.get(tx.site_id) : undefined;
      if (slug) {
        if (!platformByUser[tx.user_id]) platformByUser[tx.user_id] = new Set<string>();
        platformByUser[tx.user_id]!.add(slug);
      }
    }

    let profilesQuery = admin
      .from('profiles')
      .select('id, email, full_name, sprr_balance, lifetime_xp, last_active_at, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (siteId) {
      const userIds = Array.from(relevantUserIds);
      if (userIds.length === 0) {
        return { success: true, customers: [], total: 0 };
      }
      profilesQuery = profilesQuery.in('id', userIds);
    }

    const term = opts?.search?.trim();
    if (term) {
      profilesQuery = profilesQuery.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
    }

    const { data: profiles, error } = await profilesQuery;
    if (error) return { success: false, error: error.message };

    const customers: CustomerOverview[] = ((profiles as ProfileRow[] | null) ?? []).map((profile) => ({
      userId: profile.id,
      displayName: profile.full_name || 'Unknown',
      email: profile.email || '—',
      status: 'active',
      tier: deriveTier(profile.sprr_balance ?? 0),
      lifetimeXp: profile.lifetime_xp ?? 0,
      pointsBalance: profile.sprr_balance ?? 0,
      totalSpend: spendByUser[profile.id] ?? 0,
      orderCount: orderCountByUser[profile.id] ?? 0,
      referralCount: 0,
      joinedAt: profile.created_at,
      lastActiveAt: profile.last_active_at ?? undefined,
      riskScore: 0,
      connectedPlatforms: opts?.siteSlug
        ? [opts.siteSlug]
        : Array.from(platformByUser[profile.id] ?? []).slice(0, 4),
    }));

    return { success: true, customers, total: customers.length };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to list customers',
      customers: [],
      total: 0,
    };
  }
}

export async function getCustomerDetailAction(customerId: string) {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return null;

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
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { data: [], total: 0 };

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

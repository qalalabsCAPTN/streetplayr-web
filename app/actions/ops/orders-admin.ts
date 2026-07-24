'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSSRRole } from '@/lib/auth/ssr';
import { OPS_ROLES } from '@/lib/auth/permissions';

export type AdminOrderRow = {
  id: string;
  user_id: string;
  status: string;
  total: number;
  created_at: string;
};

/**
 * Admin orders list — service-role read, no browser Supabase.
 * Replaces getSupabaseClient on /admin/orders.
 */
export async function listAdminOrdersAction(opts?: {
  siteSlug?: string;
  limit?: number;
}): Promise<{ success: boolean; error?: string; orders?: AdminOrderRow[] }> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  const limit = opts?.limit ?? 50;

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
      if (!siteId) return { success: true, orders: [] };
    }

    let query = admin
      .from('orders')
      .select('id, user_id, status, total, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (siteId) query = query.eq('site_id', siteId);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message, orders: [] };

    return { success: true, orders: (data ?? []) as AdminOrderRow[] };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to list orders',
      orders: [],
    };
  }
}

'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSSRRole } from '@/lib/auth/ssr';
import { OPS_ROLES } from '@/lib/auth/permissions';

export type AdminOrderRow = {
  id: string;
  order_number: string;
  customer_email: string;
  status: string;
  payment_status: string;
  grand_total: number;
  created_at: string;
};

export async function listAdminOrdersAction(opts?: {
  siteSlug?: string;
  limit?: number;
}): Promise<{ success: boolean; error?: string; orders?: AdminOrderRow[] }> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  const limit = opts?.limit ?? 50;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('orders')
      .select('id, order_number, customer_id, status, payment_status, grand_total, created_at, customers(email)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      const fallback = await admin
        .from('orders')
        .select('id, order_number, customer_id, status, payment_status, grand_total, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (fallback.error) return { success: false, error: fallback.error.message, orders: [] };
      return {
        success: true,
        orders: (fallback.data ?? []).map((o: any) => ({
          id: o.id,
          order_number: o.order_number,
          customer_email: o.customer_id,
          status: o.status,
          payment_status: o.payment_status,
          grand_total: Number(o.grand_total ?? 0),
          created_at: o.created_at,
        })),
      };
    }

    return {
      success: true,
      orders: (data ?? []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        customer_email: o.customers?.email ?? o.customer_id,
        status: o.status,
        payment_status: o.payment_status,
        grand_total: Number(o.grand_total ?? 0),
        created_at: o.created_at,
      })),
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to list orders',
      orders: [],
    };
  }
}

export async function getAdminOrderAction(orderId: string) {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { success: false as const, error: 'forbidden' };
  const { OrderService } = await import('@/lib/orchestration/order');
  const order = await OrderService.getById(orderId);
  if (!order) return { success: false as const, error: 'not found' };
  return { success: true as const, order };
}

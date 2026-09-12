'use server';

import { requireSSRRole } from '@/lib/auth/ssr';
import { OPS_ROLES } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  buildCouponUtilization,
  normalizeCouponCode,
  validateCouponDraft,
  type CouponDraft,
  type CouponRow,
  type CouponRedemptionRow,
  type CouponUtilization,
} from '@/lib/commerce/coupons';

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

const WRITE_ROLES = ['super_admin', 'ops_admin'] as const;

function asCouponRow(row: Record<string, unknown>): CouponRow {
  return {
    id: String(row.id),
    code: String(row.code),
    kind: row.kind === 'percent' ? 'percent' : 'fixed',
    value: Number(row.value),
    min_subtotal: Number(row.min_subtotal ?? 0),
    max_redemptions: row.max_redemptions == null ? null : Number(row.max_redemptions),
    max_per_user: row.max_per_user == null ? null : Number(row.max_per_user),
    starts_at: (row.starts_at as string | null) ?? null,
    ends_at: (row.ends_at as string | null) ?? null,
    is_active: Boolean(row.is_active),
  };
}

export async function listCouponAnalyticsAction(): Promise<
  ActionResult<{
    coupons: CouponUtilization[];
    totals: { coupons: number; active: number; redemptions: number; discountTotal: number };
    recent: Array<{
      id: string;
      code: string;
      amount: number;
      userId: string;
      orderId: string | null;
      createdAt: string;
    }>;
  }>
> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { success: false, error: auth.error.error };

  const admin = createAdminClient();
  const [couponsRes, redemptionsRes] = await Promise.all([
    admin.from('coupons').select('*').order('created_at', { ascending: false }),
    admin
      .from('coupon_redemptions')
      .select('id, coupon_id, user_id, order_id, amount, created_at')
      .order('created_at', { ascending: false })
      .limit(2000),
  ]);

  if (couponsRes.error) return { success: false, error: 'Could not load coupons.' };
  if (redemptionsRes.error) return { success: false, error: 'Could not load coupon usage.' };

  const coupons = (couponsRes.data ?? []).map((row) => asCouponRow(row as Record<string, unknown>));
  const redemptions = (redemptionsRes.data ?? []) as CouponRedemptionRow[];
  const utilization = buildCouponUtilization(coupons, redemptions);
  const codeById = new Map(utilization.map((c) => [c.id, c.code]));
  const recent = ((redemptionsRes.data ?? []) as Array<CouponRedemptionRow & { id: string; created_at: string }>)
    .slice(0, 25)
    .map((row) => ({
      id: row.id,
      code: codeById.get(row.coupon_id) ?? '—',
      amount: Number(row.amount) || 0,
      userId: row.user_id,
      orderId: row.order_id ?? null,
      createdAt: row.created_at,
    }));

  return {
    success: true,
    data: {
      coupons: utilization,
      totals: {
        coupons: utilization.length,
        active: utilization.filter((c) => c.is_active).length,
        redemptions: utilization.reduce((sum, c) => sum + c.redemptions, 0),
        discountTotal: utilization.reduce((sum, c) => sum + c.discountTotal, 0),
      },
      recent,
    },
  };
}

export async function createCouponAction(input: CouponDraft): Promise<ActionResult<CouponRow>> {
  const auth = await requireSSRRole([...WRITE_ROLES]);
  if ('error' in auth) return { success: false, error: auth.error.error };

  const draft: CouponDraft = {
    ...input,
    code: normalizeCouponCode(input.code),
    value: Number(input.value),
    min_subtotal: Number(input.min_subtotal ?? 0),
    max_redemptions: input.max_redemptions == null ? null : Number(input.max_redemptions),
    max_per_user: input.max_per_user == null ? null : Number(input.max_per_user),
    starts_at: input.starts_at || null,
    ends_at: input.ends_at || null,
  };
  const invalid = validateCouponDraft(draft);
  if (invalid) return { success: false, error: invalid };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('coupons')
    .insert({
      code: draft.code,
      kind: draft.kind,
      value: draft.value,
      min_subtotal: draft.min_subtotal,
      max_redemptions: draft.max_redemptions,
      max_per_user: draft.max_per_user ?? 1,
      starts_at: draft.starts_at,
      ends_at: draft.ends_at,
      is_active: draft.is_active,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') return { success: false, error: 'That coupon code already exists.' };
    return { success: false, error: 'Could not create coupon.' };
  }
  return { success: true, data: asCouponRow(data as Record<string, unknown>) };
}

export async function setCouponActiveAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<{ id: string; is_active: boolean }>> {
  const auth = await requireSSRRole([...WRITE_ROLES]);
  if ('error' in auth) return { success: false, error: auth.error.error };
  if (!id) return { success: false, error: 'Coupon is missing.' };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('coupons')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('id, is_active')
    .single();

  if (error || !data) return { success: false, error: 'Could not update coupon.' };
  return { success: true, data: { id: data.id as string, is_active: Boolean(data.is_active) } };
}

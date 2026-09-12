import { createAdminClient } from '@/lib/supabase/admin';

export type CouponRow = {
  id: string;
  code: string;
  kind: 'percent' | 'fixed';
  value: number;
  min_subtotal: number;
  max_redemptions: number | null;
  max_per_user: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

export type CouponQuote = {
  couponId: string;
  code: string;
  discount: number;
};

export type CouponDraft = {
  code: string;
  kind: 'percent' | 'fixed';
  value: number;
  min_subtotal: number;
  max_redemptions: number | null;
  max_per_user: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

export type CouponRedemptionRow = {
  coupon_id: string;
  user_id: string;
  amount: number;
  created_at?: string;
  order_id?: string | null;
};

export type CouponUtilization = CouponRow & {
  redemptions: number;
  uniqueUsers: number;
  discountTotal: number;
  remaining: number | null;
  utilizationPct: number | null;
};

const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{1,31}$/;

export function normalizeCouponCode(raw: string): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

export function validateCouponDraft(input: CouponDraft): string | null {
  const code = normalizeCouponCode(input.code);
  if (!CODE_RE.test(code)) {
    return 'Code must be 2–32 characters: letters, numbers, hyphen or underscore.';
  }
  if (input.kind !== 'percent' && input.kind !== 'fixed') {
    return 'Choose percent or fixed amount.';
  }
  const value = Number(input.value);
  if (!Number.isFinite(value) || value <= 0) return 'Enter a discount value greater than 0.';
  if (input.kind === 'percent' && value > 100) return 'Percent off cannot exceed 100.';
  const minSubtotal = Number(input.min_subtotal ?? 0);
  if (!Number.isFinite(minSubtotal) || minSubtotal < 0) return 'Minimum cart value cannot be negative.';
  if (input.max_redemptions != null) {
    const cap = Number(input.max_redemptions);
    if (!Number.isInteger(cap) || cap < 1) return 'Max redemptions must be a whole number ≥ 1, or empty.';
  }
  if (input.max_per_user != null) {
    const per = Number(input.max_per_user);
    if (!Number.isInteger(per) || per < 1) return 'Max per customer must be a whole number ≥ 1, or empty.';
  }
  if (input.starts_at && input.ends_at && new Date(input.ends_at) <= new Date(input.starts_at)) {
    return 'End date must be after the start date.';
  }
  return null;
}

export function buildCouponUtilization(
  coupons: CouponRow[],
  redemptions: CouponRedemptionRow[]
): CouponUtilization[] {
  const byCoupon = new Map<string, { count: number; users: Set<string>; amount: number }>();
  for (const row of redemptions) {
    const cur = byCoupon.get(row.coupon_id) ?? { count: 0, users: new Set<string>(), amount: 0 };
    cur.count += 1;
    cur.users.add(row.user_id);
    cur.amount += Number(row.amount) || 0;
    byCoupon.set(row.coupon_id, cur);
  }
  return coupons.map((coupon) => {
    const stats = byCoupon.get(coupon.id) ?? { count: 0, users: new Set<string>(), amount: 0 };
    const remaining =
      coupon.max_redemptions == null ? null : Math.max(0, coupon.max_redemptions - stats.count);
    const utilizationPct =
      coupon.max_redemptions && coupon.max_redemptions > 0
        ? Math.min(100, Math.round((stats.count / coupon.max_redemptions) * 1000) / 10)
        : null;
    return {
      ...coupon,
      redemptions: stats.count,
      uniqueUsers: stats.users.size,
      discountTotal: Math.round(stats.amount * 100) / 100,
      remaining,
      utilizationPct,
    };
  });
}

function money(n: number): number {
  return Math.round(Math.max(0, n) * 100) / 100;
}

export async function quoteCoupon(params: {
  code: string;
  subtotal: number;
  userId: string;
}): Promise<{ ok: true; data: CouponQuote } | { ok: false; error: string }> {
  const code = params.code.trim().toUpperCase();
  if (!code) return { ok: false, error: 'Enter a promo code.' };

  const admin = createAdminClient();
  const { data: coupon, error } = await admin
    .from('coupons')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (error) return { ok: false, error: 'Promo codes are unavailable right now.' };
  if (!coupon || !coupon.is_active) return { ok: false, error: 'This promo code is not valid.' };

  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    return { ok: false, error: 'This promo code is not active yet.' };
  }
  if (coupon.ends_at && new Date(coupon.ends_at).getTime() < now) {
    return { ok: false, error: 'This promo code has expired.' };
  }
  if (Number(coupon.min_subtotal ?? 0) > params.subtotal) {
    return { ok: false, error: `Minimum cart value is ₹${coupon.min_subtotal}.` };
  }

  if (coupon.max_redemptions != null) {
    const { count } = await admin
      .from('coupon_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id);
    if ((count ?? 0) >= coupon.max_redemptions) {
      return { ok: false, error: 'This promo code has been fully used.' };
    }
  }

  if (coupon.max_per_user != null) {
    const { count } = await admin
      .from('coupon_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('user_id', params.userId);
    if ((count ?? 0) >= coupon.max_per_user) {
      return { ok: false, error: 'You have already used this promo code.' };
    }
  }

  const value = Number(coupon.value);
  const discount =
    coupon.kind === 'percent'
      ? money(params.subtotal * (value / 100))
      : money(Math.min(value, params.subtotal));

  if (discount <= 0) return { ok: false, error: 'This promo code does not apply.' };

  return {
    ok: true,
    data: { couponId: coupon.id, code: coupon.code, discount },
  };
}

export async function recordCouponRedemption(params: {
  couponId: string;
  userId: string;
  orderId: string;
  amount: number;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from('coupon_redemptions').insert({
    coupon_id: params.couponId,
    user_id: params.userId,
    order_id: params.orderId,
    amount: params.amount,
  });
}

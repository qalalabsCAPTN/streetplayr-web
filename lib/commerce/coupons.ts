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

import { describe, expect, it } from 'vitest';
import {
  buildCouponUtilization,
  normalizeCouponCode,
  validateCouponDraft,
  type CouponDraft,
  type CouponRow,
} from './coupons';

const base: CouponDraft = {
  code: 'playr10',
  kind: 'percent',
  value: 10,
  min_subtotal: 999,
  max_redemptions: 100,
  max_per_user: 1,
  starts_at: null,
  ends_at: null,
  is_active: true,
};

describe('coupon drafts', () => {
  it('normalizes codes to uppercase without spaces', () => {
    expect(normalizeCouponCode(' playr 10 ')).toBe('PLAYR10');
  });

  it('accepts a valid percent coupon', () => {
    expect(validateCouponDraft(base)).toBeNull();
  });

  it('rejects percent over 100 and empty codes', () => {
    expect(validateCouponDraft({ ...base, value: 120 })).toMatch(/100/);
    expect(validateCouponDraft({ ...base, code: 'x' })).toBeTruthy();
  });

  it('rejects an end date before the start date', () => {
    expect(
      validateCouponDraft({
        ...base,
        starts_at: '2026-09-12T10:00:00.000Z',
        ends_at: '2026-09-01T10:00:00.000Z',
      })
    ).toMatch(/after/i);
  });
});

describe('coupon utilization', () => {
  const coupons: CouponRow[] = [
    {
      id: 'c1',
      code: 'PLAYR10',
      kind: 'percent',
      value: 10,
      min_subtotal: 0,
      max_redemptions: 10,
      max_per_user: 1,
      starts_at: null,
      ends_at: null,
      is_active: true,
    },
    {
      id: 'c2',
      code: 'FLAT200',
      kind: 'fixed',
      value: 200,
      min_subtotal: 0,
      max_redemptions: null,
      max_per_user: null,
      starts_at: null,
      ends_at: null,
      is_active: true,
    },
  ];

  it('counts redemptions, unique users, and remaining cap', () => {
    const rows = buildCouponUtilization(coupons, [
      { coupon_id: 'c1', user_id: 'u1', amount: 100 },
      { coupon_id: 'c1', user_id: 'u1', amount: 50 },
      { coupon_id: 'c1', user_id: 'u2', amount: 80 },
      { coupon_id: 'c2', user_id: 'u3', amount: 200 },
    ]);
    const playr = rows.find((r) => r.code === 'PLAYR10')!;
    expect(playr.redemptions).toBe(3);
    expect(playr.uniqueUsers).toBe(2);
    expect(playr.discountTotal).toBe(230);
    expect(playr.remaining).toBe(7);
    expect(playr.utilizationPct).toBe(30);
    const flat = rows.find((r) => r.code === 'FLAT200')!;
    expect(flat.remaining).toBeNull();
    expect(flat.utilizationPct).toBeNull();
    expect(flat.redemptions).toBe(1);
  });
});

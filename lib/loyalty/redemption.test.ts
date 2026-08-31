import { describe, expect, it } from 'vitest';
import {
  MEMBER_CREDIT_MAX_RATIO,
  maxRedeemableCredits,
  payableAfterCredits,
} from './redemption';

describe('MEMBER_CREDIT_MAX_RATIO', () => {
  it('caps member credits at 10% of subtotal', () => {
    expect(MEMBER_CREDIT_MAX_RATIO).toBe(0.1);
  });
});

describe('maxRedeemableCredits', () => {
  it('caps at floor(subtotal * 0.1) when balance is larger (10000, 1999 → 199)', () => {
    expect(maxRedeemableCredits(10000, 1999)).toBe(199);
  });

  it('caps at balance when balance is smaller (100, 1999 → 100)', () => {
    expect(maxRedeemableCredits(100, 1999)).toBe(100);
  });

  it('returns 0 for zero or negative inputs', () => {
    expect(maxRedeemableCredits(0, 1999)).toBe(0);
    expect(maxRedeemableCredits(100, 0)).toBe(0);
    expect(maxRedeemableCredits(-50, 1999)).toBe(0);
    expect(maxRedeemableCredits(100, -1999)).toBe(0);
    expect(maxRedeemableCredits(-1, -1)).toBe(0);
  });

  it('never returns a negative amount', () => {
    expect(maxRedeemableCredits(-10000, 1999)).toBe(0);
    expect(maxRedeemableCredits(100, Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it('returns integers only', () => {
    expect(Number.isInteger(maxRedeemableCredits(100.9, 1999.7))).toBe(true);
    expect(maxRedeemableCredits(100.9, 1999)).toBe(100);
  });
});

describe('payableAfterCredits', () => {
  it('subtracts applied credits from subtotal', () => {
    expect(payableAfterCredits(1999, 999)).toBe(1000);
    expect(payableAfterCredits(1999, 100)).toBe(1899);
  });

  it('never goes below 0', () => {
    expect(payableAfterCredits(100, 500)).toBe(0);
    expect(payableAfterCredits(0, 10)).toBe(0);
    expect(payableAfterCredits(-50, 10)).toBe(0);
    expect(payableAfterCredits(100, -10)).toBe(100);
  });

  it('returns integers only', () => {
    expect(Number.isInteger(payableAfterCredits(1999.9, 0.4))).toBe(true);
  });
});

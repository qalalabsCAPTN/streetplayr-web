import { describe, expect, it } from 'vitest';
import {
  MEMBER_CREDIT_MAX_RATIO,
  maxRedeemableCredits,
  payableAfterCredits,
} from './redemption';

describe('MEMBER_CREDIT_MAX_RATIO', () => {
  it('defines dynamic caps based on tier', () => {
    expect(MEMBER_CREDIT_MAX_RATIO.ROOKIE).toBe(0.05);
    expect(MEMBER_CREDIT_MAX_RATIO.LEGEND).toBe(0.1);
  });
});

describe('maxRedeemableCredits', () => {
  it('caps at floor(subtotal * 0.05) for ROOKIE when balance is larger (10000, 2000 → 100)', () => {
    expect(maxRedeemableCredits(10000, 2000, 'ROOKIE')).toBe(100);
  });

  it('caps at floor(subtotal * 0.075) for PRO when balance is larger (10000, 2000 → 150)', () => {
    expect(maxRedeemableCredits(10000, 2000, 'PRO')).toBe(150);
  });

  it('caps at floor(subtotal * 0.1) for LEGEND when balance is larger (10000, 2000 → 200)', () => {
    expect(maxRedeemableCredits(10000, 2000, 'LEGEND')).toBe(200);
  });

  it('caps at balance when balance is smaller (100, 20000 → 100)', () => {
    expect(maxRedeemableCredits(100, 20000, 'ROOKIE')).toBe(100);
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
    expect(maxRedeemableCredits(100.9, 1999)).toBe(99);
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

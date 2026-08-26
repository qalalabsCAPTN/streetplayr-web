import { describe, expect, it } from 'vitest';
import { quoteTotals } from './totals';

describe('quoteTotals — server-authoritative commerce rules', () => {
  it('applies domestic shipping and GST instead of silent zeros', () => {
    const t = quoteTotals({ subtotal: 500, discount: 0, country: 'IN' });
    expect(t.shipping).toBe(99);
    expect(t.tax).toBeGreaterThan(0);
    expect(t.grandTotal).toBeCloseTo(500 + 99 + t.tax, 2);
  });

  it('grants free shipping at the documented threshold', () => {
    const t = quoteTotals({ subtotal: 1999, discount: 0, country: 'IN' });
    expect(t.shipping).toBe(0);
    expect(t.tax).toBeGreaterThan(0);
  });

  it('zero-rates export GST and charges international shipping', () => {
    const t = quoteTotals({ subtotal: 500, discount: 0, country: 'US' });
    expect(t.tax).toBe(0);
    expect(t.shipping).toBe(1499);
  });

  it('never lets discount exceed subtotal', () => {
    const t = quoteTotals({ subtotal: 100, discount: 500, country: 'IN' });
    expect(t.discount).toBe(100);
    expect(t.grandTotal).toBeGreaterThanOrEqual(0);
  });
});

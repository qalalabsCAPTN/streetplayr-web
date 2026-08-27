import { describe, expect, it } from 'vitest';
import { orderInsertMoney, quoteTotals } from './totals';

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

  it('₹5 + ₹99 shipping GST rounds to whole rupees so INTEGER order columns accept it', () => {
    const t = quoteTotals({ subtotal: 5, discount: 0, country: 'IN' });
    expect(t.shipping).toBe(99);
    expect(t.tax).toBe(5);
    expect(t.grandTotal).toBe(109);
    const row = orderInsertMoney(t);
    expect(row.tax_amount).toBe(5);
    expect(row.tax_total).toBe(5);
    expect(row.grand_total).toBe(109);
    expect(Number.isInteger(row.tax_amount)).toBe(true);
    expect(Number.isInteger(row.grand_total)).toBe(true);
  });

  it('GSTIN omitted or present quotes the same apparel GST — field is optional', () => {
    const open = quoteTotals({ subtotal: 5, discount: 0, country: 'IN' });
    const b2b = quoteTotals({ subtotal: 5, discount: 0, country: 'IN', gstin: '22AAAAA0000A1Z5' });
    expect(open.tax).toBe(b2b.tax);
    expect(open.grandTotal).toBe(b2b.grandTotal);
  });
});

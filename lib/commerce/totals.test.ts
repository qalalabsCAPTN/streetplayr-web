import { describe, expect, it } from 'vitest';
import { orderInsertMoney, quoteTotals, shippingDisplay } from './totals';

describe('quoteTotals — exclusive GST + shipping', () => {
  it('₹800 at 18% charges ₹200 shipping and GST on basic only', () => {
    const t = quoteTotals({ subtotal: 800, discount: 0, country: 'IN', taxPercent: 18 });
    expect(t.shipping).toBe(200);
    expect(t.tax).toBe(144);
    expect(t.grandTotal).toBe(1144);
    expect(t.subtotal + t.shipping + t.tax).toBe(t.grandTotal);
    expect(t.taxLabel).toBe('GST');
    expect(t.shippingLabel).toBe('₹200');
  });

  it('₹1000 at 18% is FREE shipping and GST is not inside basic amount', () => {
    const t = quoteTotals({ subtotal: 1000, discount: 0, country: 'IN', taxPercent: 18 });
    expect(t.shipping).toBe(0);
    expect(t.tax).toBe(180);
    expect(t.grandTotal).toBe(1180);
    expect(t.subtotal).toBe(1000);
    expect(shippingDisplay(t.shipping)).toBe('FREE');
  });

  it('₹999 still pays shipping; ₹1000 is free', () => {
    const atCap = quoteTotals({ subtotal: 999, discount: 0, country: 'IN', taxPercent: 18 });
    expect(atCap.shipping).toBe(200);
    const over = quoteTotals({ subtotal: 1000, discount: 0, country: 'IN', taxPercent: 5 });
    expect(over.shipping).toBe(0);
  });

  it('multiple lines: GST uses provided UniWare percent on combined basic', () => {
    const t = quoteTotals({ subtotal: 500 + 800, discount: 0, country: 'IN', taxPercent: 5 });
    expect(t.subtotal).toBe(1300);
    expect(t.shipping).toBe(0);
    expect(t.tax).toBe(Math.round(1300 * 0.05));
    expect(t.grandTotal).toBe(1300 + t.tax);
  });

  it('coupon reduces taxable basic before GST; shipping uses after-discount value', () => {
    const t = quoteTotals({ subtotal: 1000, discount: 200, country: 'IN', taxPercent: 18 });
    expect(t.discount).toBe(200);
    expect(t.shipping).toBe(200);
    expect(t.tax).toBe(144);
    expect(t.grandTotal).toBe(800 + 200 + 144);
  });

  it('zero-rates export GST and charges international shipping', () => {
    const t = quoteTotals({ subtotal: 500, discount: 0, country: 'US', taxPercent: 18 });
    expect(t.tax).toBe(0);
    expect(t.shipping).toBe(1499);
    expect(t.grandTotal).toBe(500 + 1499);
  });

  it('never lets discount exceed subtotal', () => {
    const t = quoteTotals({ subtotal: 100, discount: 500, country: 'IN', taxPercent: 18 });
    expect(t.discount).toBe(100);
    expect(t.grandTotal).toBeGreaterThanOrEqual(0);
  });

  it('₹5 exclusive GST rounds to whole rupees for INTEGER order columns', () => {
    const t = quoteTotals({ subtotal: 5, discount: 0, country: 'IN', taxPercent: 5 });
    expect(t.shipping).toBe(200);
    expect(t.tax).toBe(0);
    expect(t.grandTotal).toBe(205);
    const row = orderInsertMoney(t);
    expect(row.grand_total).toBe(205);
    expect(Number.isInteger(row.tax_amount)).toBe(true);
    expect(row.grand_total).toBe(row.subtotal + row.shipping_cost + row.tax_amount - row.discount_total);
  });

  it('identity: Basic Amount − discount + shipping + GST = grand_total', () => {
    for (const subtotal of [800, 999, 1000, 2499]) {
      for (const discount of [0, 100]) {
        for (const taxPercent of [5, 18]) {
          const t = quoteTotals({ subtotal, discount, country: 'IN', taxPercent });
          expect(t.grandTotal).toBe(t.subtotal - t.discount + t.shipping + t.tax);
          const row = orderInsertMoney(t);
          expect(row.grand_total).toBe(
            row.subtotal + row.shipping_cost + row.tax_amount - row.discount_total
          );
        }
      }
    }
  });

  it('GSTIN omitted or present quotes the same apparel GST — field is optional', () => {
    const open = quoteTotals({ subtotal: 800, discount: 0, country: 'IN', taxPercent: 18 });
    const b2b = quoteTotals({
      subtotal: 800,
      discount: 0,
      country: 'IN',
      taxPercent: 18,
      gstin: '22AAAAA0000A1Z5',
    });
    expect(open.tax).toBe(b2b.tax);
    expect(open.grandTotal).toBe(b2b.grandTotal);
  });
});

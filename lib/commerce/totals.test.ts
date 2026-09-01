import { describe, expect, it } from 'vitest';
import { orderInsertMoney, quoteTotals, shippingDisplay, splitInclusiveMrp } from './totals';

describe('quoteTotals — MRP-inclusive GST split + shipping', () => {
  it('₹3,499 MRP at 18% extracts GST; does not add GST on top', () => {
    const t = quoteTotals({ subtotal: 3499, discount: 0, country: 'IN', taxPercent: 18 });
    expect(t.subtotal).toBe(2965);
    expect(t.tax).toBe(534);
    expect(t.shipping).toBe(0);
    expect(t.grandTotal).toBe(3499);
    expect(t.subtotal + t.shipping + t.tax).toBe(t.grandTotal);
    expect(t.taxLabel).toBe('GST');
    expect(shippingDisplay(t.shipping)).toBe('FREE');
  });

  it('₹800 MRP at 18% charges ₹200 shipping; total is MRP + shipping', () => {
    const t = quoteTotals({ subtotal: 800, discount: 0, country: 'IN', taxPercent: 18 });
    const split = splitInclusiveMrp(800, 18);
    expect(t.subtotal).toBe(split.basic);
    expect(t.tax).toBe(split.tax);
    expect(t.shipping).toBe(200);
    expect(t.grandTotal).toBe(800 + 200);
    expect(t.subtotal + t.shipping + t.tax).toBe(t.grandTotal);
    expect(t.shippingLabel).toBe('₹200');
  });

  it('₹1000 MRP is FREE shipping; grand total stays MRP', () => {
    const t = quoteTotals({ subtotal: 1000, discount: 0, country: 'IN', taxPercent: 18 });
    expect(t.shipping).toBe(0);
    expect(t.grandTotal).toBe(1000);
    expect(t.subtotal + t.tax).toBe(1000);
  });

  it('₹999 still pays shipping; ₹1000 is free', () => {
    const atCap = quoteTotals({ subtotal: 999, discount: 0, country: 'IN', taxPercent: 18 });
    expect(atCap.shipping).toBe(200);
    expect(atCap.grandTotal).toBe(999 + 200);
    const over = quoteTotals({ subtotal: 1000, discount: 0, country: 'IN', taxPercent: 5 });
    expect(over.shipping).toBe(0);
    expect(over.grandTotal).toBe(1000);
  });

  it('multiple lines: GST uses provided UniWare percent on combined MRP', () => {
    const t = quoteTotals({ subtotal: 500 + 800, discount: 0, country: 'IN', taxPercent: 5 });
    const split = splitInclusiveMrp(1300, 5);
    expect(t.subtotal).toBe(split.basic);
    expect(t.tax).toBe(split.tax);
    expect(t.shipping).toBe(0);
    expect(t.grandTotal).toBe(1300);
  });

  it('coupon reduces MRP before GST split; shipping uses after-discount MRP', () => {
    const t = quoteTotals({ subtotal: 1000, discount: 200, country: 'IN', taxPercent: 18 });
    expect(t.discount).toBe(200);
    expect(t.shipping).toBe(200);
    const split = splitInclusiveMrp(800, 18);
    expect(t.subtotal).toBe(split.basic);
    expect(t.tax).toBe(split.tax);
    expect(t.grandTotal).toBe(800 + 200);
  });

  it('zero-rates export GST and charges international shipping', () => {
    const t = quoteTotals({ subtotal: 500, discount: 0, country: 'US', taxPercent: 18 });
    expect(t.tax).toBe(0);
    expect(t.subtotal).toBe(500);
    expect(t.shipping).toBe(1499);
    expect(t.grandTotal).toBe(500 + 1499);
  });

  it('never lets discount exceed subtotal', () => {
    const t = quoteTotals({ subtotal: 100, discount: 500, country: 'IN', taxPercent: 18 });
    expect(t.discount).toBe(100);
    expect(t.grandTotal).toBeGreaterThanOrEqual(0);
  });

  it('₹5 MRP exclusive-split rounds to whole rupees for INTEGER order columns', () => {
    const t = quoteTotals({ subtotal: 5, discount: 0, country: 'IN', taxPercent: 5 });
    expect(t.shipping).toBe(200);
    expect(t.tax).toBe(0);
    expect(t.grandTotal).toBe(205);
    const row = orderInsertMoney(t);
    expect(row.grand_total).toBe(205);
    expect(Number.isInteger(row.tax_amount)).toBe(true);
    expect(row.grand_total).toBe(row.subtotal + row.shipping_cost + row.tax_amount);
  });

  it('identity: Basic Amount + Shipping + GST = grand_total (= MRP after discount + shipping)', () => {
    for (const mrp of [800, 999, 1000, 2499, 3499]) {
      for (const discount of [0, 100]) {
        for (const taxPercent of [5, 18]) {
          const t = quoteTotals({ subtotal: mrp, discount, country: 'IN', taxPercent });
          expect(t.grandTotal).toBe(t.subtotal + t.shipping + t.tax);
          const netMrp = mrp - Math.min(discount, mrp);
          expect(t.subtotal + t.tax).toBe(netMrp);
          expect(t.grandTotal).toBe(netMrp + t.shipping);
          const row = orderInsertMoney(t);
          expect(row.grand_total).toBe(row.subtotal + row.shipping_cost + row.tax_amount);
        }
      }
    }
  });

  it('GSTIN omitted or present quotes the same apparel GST — field is optional', () => {
    const open = quoteTotals({ subtotal: 3499, discount: 0, country: 'IN', taxPercent: 18 });
    const b2b = quoteTotals({
      subtotal: 3499,
      discount: 0,
      country: 'IN',
      taxPercent: 18,
      gstin: '22AAAAA0000A1Z5',
    });
    expect(open.tax).toBe(b2b.tax);
    expect(open.grandTotal).toBe(b2b.grandTotal);
  });
});

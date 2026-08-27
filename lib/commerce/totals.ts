/**
 * Server-authoritative checkout totals.
 *
 * Production business rules (override via env, never via client):
 * - Domestic (IN) shipping: ₹SHIPPING_DOMESTIC_INR (default 99), free at
 *   SHIPPING_FREE_OVER_INR (default 1999) on goods subtotal after discounts.
 * - International shipping: ₹SHIPPING_INTL_INR (default 1499).
 * - Apparel GST: GST_APPAREL_RATE percent (default 5) on (goods + shipping)
 *   for IN destinations. Export (non-IN) is zero-rated.
 * - GSTIN is captured for B2B invoices; rate is still the apparel GST rate
 *   unless GST_B2B_RATE is set.
 */

export type TotalsInput = {
  subtotal: number;
  discount: number;
  country: string;
  state?: string;
  gstin?: string;
};

export type TotalsResult = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  taxRate: number;
  taxLabel: string;
  shippingLabel: string;
};

function money(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

/** Whole rupees for legacy INTEGER order columns (tax_amount, shipping_cost, subtotal). */
export function rupeesInt(n: number): number {
  return Math.round(money(n));
}

/**
 * Dual-write payload: live `*_total` columns keep paise; INTEGER duals
 * (`tax_amount`, `shipping_cost`, `subtotal`) cannot store "5.2" GST.
 */
export function orderInsertMoney(totals: TotalsResult) {
  return {
    subtotal: rupeesInt(totals.subtotal),
    shipping_total: totals.shipping,
    tax_total: rupeesInt(totals.tax),
    shipping_cost: rupeesInt(totals.shipping),
    tax_amount: rupeesInt(totals.tax),
    discount_total: rupeesInt(totals.discount),
    grand_total: rupeesInt(totals.grandTotal),
  };
}

function envNumber(key: string, fallback: number): number {
  const raw = Number(process.env[key]);
  return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
}

export function calcShipping(subtotalAfterDiscount: number, country: string): {
  shipping: number;
  label: string;
} {
  const goods = money(subtotalAfterDiscount);
  const dest = (country || 'IN').toUpperCase();
  if (dest === 'IN') {
    const freeOver = envNumber('SHIPPING_FREE_OVER_INR', 1999);
    const domestic = envNumber('SHIPPING_DOMESTIC_INR', 99);
    if (goods >= freeOver) {
      return { shipping: 0, label: `Free shipping over ₹${freeOver}` };
    }
    return { shipping: domestic, label: `Standard shipping ₹${domestic}` };
  }
  const intl = envNumber('SHIPPING_INTL_INR', 1499);
  return { shipping: intl, label: `International shipping ₹${intl}` };
}

export function calcTax(params: {
  goodsAndShipping: number;
  country: string;
  gstin?: string;
}): { tax: number; rate: number; label: string } {
  const dest = (params.country || 'IN').toUpperCase();
  if (dest !== 'IN') {
    return { tax: 0, rate: 0, label: 'Export — zero-rated' };
  }
  const percent = params.gstin
    ? envNumber('GST_B2B_RATE', envNumber('GST_APPAREL_RATE', 5))
    : envNumber('GST_APPAREL_RATE', 5);
  const rate = percent / 100;
  const tax = rupeesInt(params.goodsAndShipping * rate);
  return {
    tax,
    rate,
    label: params.gstin ? `GST ${percent}% (GSTIN)` : `GST ${percent}%`,
  };
}

export function quoteTotals(input: TotalsInput): TotalsResult {
  const subtotal = money(input.subtotal);
  const discount = Math.min(money(input.discount), subtotal);
  const afterDiscount = money(subtotal - discount);
  const { shipping, label: shippingLabel } = calcShipping(afterDiscount, input.country);
  const { tax, rate, label: taxLabel } = calcTax({
    goodsAndShipping: afterDiscount + shipping,
    country: input.country,
    gstin: input.gstin,
  });
  return {
    subtotal,
    discount,
    shipping,
    tax,
    grandTotal: money(afterDiscount + shipping + tax),
    taxRate: rate,
    taxLabel,
    shippingLabel,
  };
}

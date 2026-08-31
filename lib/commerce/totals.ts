/**
 * Server-authoritative checkout totals.
 *
 * Production business rules (override via env, never via client):
 * - Domestic (IN) shipping: ₹SHIPPING_DOMESTIC_INR (default 99), free at
 *   SHIPPING_FREE_OVER_INR (default 1999) on goods subtotal after discounts.
 * - International shipping: ₹SHIPPING_INTL_INR (default 1499).
 * - Catalog prices are UniWare MRP (tax-inclusive). GstTaxTypeCode (5 or 18)
 *   is the invoice split, not a surcharge — never sell above MRP.
 * - IN GST is extracted from (goods + shipping). Export is zero-rated.
 * - GSTIN is captured for B2B invoices; rate is still the apparel GST rate
 *   unless GST_B2B_RATE is set.
 */

export type TotalsInput = {
  subtotal: number;
  discount: number;
  country: string;
  state?: string;
  gstin?: string;
  /** UniWare GST percent for this cart (weighted). Falls back to GST_APPAREL_RATE. */
  taxPercent?: number;
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

/** GST already inside an MRP / shipping charge: tax = inclusive × rate / (100 + rate). */
export function extractInclusiveGst(inclusiveAmount: number, percent: number): number {
  const inclusive = money(inclusiveAmount);
  if (inclusive <= 0 || !(percent > 0)) return 0;
  return rupeesInt((inclusive * percent) / (100 + percent));
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
  taxPercent?: number;
}): { tax: number; rate: number; label: string } {
  const dest = (params.country || 'IN').toUpperCase();
  if (dest !== 'IN') {
    return { tax: 0, rate: 0, label: 'Export — zero-rated' };
  }
  const apparel = params.taxPercent ?? envNumber('GST_APPAREL_RATE', 5);
  const percent = params.gstin
    ? envNumber('GST_B2B_RATE', apparel)
    : apparel;
  const rate = percent / 100;
  const tax = extractInclusiveGst(params.goodsAndShipping, percent);
  return {
    tax,
    rate,
    label: params.gstin ? `GST ${percent}% incl. (GSTIN)` : `GST ${percent}% (incl.)`,
  };
}

export function cartGstPercent(
  lines: Array<{ amount: number; gstPercent?: number | null }>
): number {
  const fallback = envNumber('GST_APPAREL_RATE', 5);
  const usable = lines.filter(
    (line) => typeof line.gstPercent === 'number' && line.gstPercent > 0 && line.amount > 0
  );
  if (!usable.length) return fallback;
  const total = usable.reduce((sum, line) => sum + line.amount, 0);
  if (total <= 0) return fallback;
  return usable.reduce((sum, line) => sum + (line.gstPercent as number) * line.amount, 0) / total;
}

export function quoteTotals(input: TotalsInput): TotalsResult {
  const subtotal = money(input.subtotal);
  const discount = Math.min(money(input.discount), subtotal);
  const afterDiscount = money(subtotal - discount);
  const { shipping, label: shippingLabel } = calcShipping(afterDiscount, input.country);
  const payable = money(afterDiscount + shipping);
  const { tax, rate, label: taxLabel } = calcTax({
    goodsAndShipping: payable,
    country: input.country,
    gstin: input.gstin,
    taxPercent: input.taxPercent,
  });
  return {
    subtotal,
    discount,
    shipping,
    tax,
    grandTotal: payable,
    taxRate: rate,
    taxLabel,
    shippingLabel,
  };
}

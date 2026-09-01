/**
 * Server-authoritative checkout totals.
 *
 * UniWare MaxRetailPrice is MRP (GST-inclusive). Never add GST on top.
 *
 * Production business rules (override via env, never via client):
 * - Domestic (IN) shipping: ₹SHIPPING_DOMESTIC_INR (default 200), FREE when
 *   MRP after discount > SHIPPING_FREE_OVER_INR (default 999).
 * - International shipping: ₹SHIPPING_INTL_INR (default 1499).
 * - IN GST is extracted from MRP at UniWare GstTaxTypeCode (5 or 18),
 *   else GST_APPAREL_RATE (default 5). GST is not charged on shipping.
 *   Export is zero-rated.
 * - GSTIN is captured for B2B invoices; rate is still the apparel GST rate
 *   unless GST_B2B_RATE is set.
 * - Basic Amount = MRP after discount, exclusive of GST
 * - grand_total = Basic Amount + Shipping + GST  (= MRP after discount + Shipping)
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
  /** Exclusive basic after discount — the Basic Amount shown in the breakdown. */
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
 *
 * `subtotal` is exclusive Basic Amount (after discount). Discount is stored
 * separately and must not be subtracted again from grand_total.
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

/** Exclusive GST on a taxable (pre-tax) amount. Kept for non-MRP callers. */
export function exclusiveGst(amount: number, percent: number): number {
  const taxable = money(amount);
  if (taxable <= 0 || !(percent > 0)) return 0;
  return rupeesInt((taxable * percent) / 100);
}

/**
 * Split GST-inclusive MRP into Basic Amount + GST.
 * tax = round(MRP × percent / (100 + percent)); basic = MRP − tax.
 */
export function splitInclusiveMrp(inclusiveAmount: number, percent: number): {
  basic: number;
  tax: number;
} {
  const incl = rupeesInt(inclusiveAmount);
  if (incl <= 0 || !(percent > 0)) return { basic: incl, tax: 0 };
  const tax = rupeesInt((incl * percent) / (100 + percent));
  return { basic: incl - tax, tax };
}

export function shippingDisplay(shipping: number): string {
  return shipping <= 0 ? 'FREE' : `₹${Math.round(shipping).toLocaleString('en-IN')}`;
}

/** Display UniWare GST % (5, 18, or weighted cart average). */
export function displayGstPercent(percent: number): string {
  const rounded = Math.round(percent * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatGstLineLabel(percent?: number | null): string {
  if (percent == null || !(percent > 0)) return 'GST';
  return `GST (${displayGstPercent(percent)}%)`;
}

/** Convert quoteTotals taxRate (0.18) → display percent (18). */
export function percentFromTaxRate(taxRate: number): number | null {
  if (!(taxRate > 0)) return null;
  return Math.round(taxRate * 1000) / 10;
}

/** Infer GST % from exclusive basic + tax split (legacy orders). */
export function inferGstPercentFromSplit(exclusiveBasic: number, tax: number): number | null {
  if (exclusiveBasic <= 0 || tax <= 0) return null;
  return Math.round((tax * 1000) / exclusiveBasic) / 10;
}

export function gstPercentFromShippingAddress(addr: unknown): number | null {
  const ship = addr as { gst_percent?: string | number } | null | undefined;
  if (ship?.gst_percent == null || ship.gst_percent === '') return null;
  const n = Number(ship.gst_percent);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function resolveOrderGstPercent(order: {
  subtotal: number;
  taxAmount: number;
  shippingAddress?: unknown;
  gstPercent?: number | null;
}): number | null {
  if (order.gstPercent != null && order.gstPercent > 0) return order.gstPercent;
  const fromAddr = gstPercentFromShippingAddress(order.shippingAddress);
  if (fromAddr != null) return fromAddr;
  return inferGstPercentFromSplit(order.subtotal, order.taxAmount);
}

export function calcShipping(subtotalAfterDiscount: number, country: string): {
  shipping: number;
  label: string;
} {
  const goods = money(subtotalAfterDiscount);
  const dest = (country || 'IN').toUpperCase();
  if (dest === 'IN') {
    const freeOver = envNumber('SHIPPING_FREE_OVER_INR', 999);
    const domestic = envNumber('SHIPPING_DOMESTIC_INR', 200);
    if (goods > freeOver) {
      return { shipping: 0, label: 'FREE' };
    }
    return { shipping: domestic, label: shippingDisplay(domestic) };
  }
  const intl = envNumber('SHIPPING_INTL_INR', 1499);
  return { shipping: intl, label: shippingDisplay(intl) };
}

export function calcTax(params: {
  taxableAmount: number;
  country: string;
  gstin?: string;
  taxPercent?: number;
}): { tax: number; basic: number; rate: number; label: string } {
  const dest = (params.country || 'IN').toUpperCase();
  const incl = rupeesInt(params.taxableAmount);
  if (dest !== 'IN') {
    return { tax: 0, basic: incl, rate: 0, label: 'GST' };
  }
  const apparel = params.taxPercent ?? envNumber('GST_APPAREL_RATE', 5);
  const percent = params.gstin
    ? envNumber('GST_B2B_RATE', apparel)
    : apparel;
  const { basic, tax } = splitInclusiveMrp(incl, percent);
  return {
    tax,
    basic,
    rate: percent / 100,
    label: 'GST',
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
  const mrp = money(input.subtotal);
  const discount = Math.min(money(input.discount), mrp);
  const netMrp = money(mrp - discount);
  const { shipping, label: shippingLabel } = calcShipping(netMrp, input.country);
  const { tax, basic, rate, label: taxLabel } = calcTax({
    taxableAmount: netMrp,
    country: input.country,
    gstin: input.gstin,
    taxPercent: input.taxPercent,
  });
  return {
    subtotal: basic,
    discount,
    shipping,
    tax,
    grandTotal: money(basic + shipping + tax),
    taxRate: rate,
    taxLabel,
    shippingLabel,
  };
}

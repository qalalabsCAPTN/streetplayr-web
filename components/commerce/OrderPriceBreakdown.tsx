import type { CSSProperties } from 'react';
import { formatPrice } from '@/lib/utils/format';
import { shippingDisplay, formatGstLineLabel } from '@/lib/commerce/totals';

export type PriceBreakdownAmounts = {
  subtotal: number;
  discount?: number;
  shipping: number | null;
  tax: number | null;
  grandTotal: number | null;
  /** UniWare GST rate (5, 18, or weighted cart %). */
  taxPercent?: number | null;
};

/** Canonical GST/shipping breakdown. Amounts must come from the server quote or order row. */
export function OrderPriceBreakdown({
  subtotal,
  discount = 0,
  shipping,
  tax,
  grandTotal,
  taxPercent,
  pending = false,
  includeTotal = true,
}: PriceBreakdownAmounts & { pending?: boolean; includeTotal?: boolean }) {
  const shipReady = !pending && shipping != null;
  const taxReady = !pending && tax != null;
  const totalReady = !pending && grandTotal != null;

  const row: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12 };

  return (
    <>
      {discount > 0 && (
        <div style={row}>
          <span>Discount</span>
          <span>−{formatPrice(discount)}</span>
        </div>
      )}
      <div style={row}>
        <span>Basic Amount</span>
        <span>{pending ? '…' : formatPrice(subtotal)}</span>
      </div>
      <div style={row}>
        <span>Shipping</span>
        <span>{shipReady ? shippingDisplay(shipping) : '…'}</span>
      </div>
      <div style={row}>
        <span>{formatGstLineLabel(taxPercent)}</span>
        <span>{taxReady ? formatPrice(tax) : '…'}</span>
      </div>
      {includeTotal && (
        <div style={{ ...row, fontWeight: 700 }}>
          <span>Total</span>
          <span>{totalReady ? formatPrice(grandTotal) : '…'}</span>
        </div>
      )}
    </>
  );
}

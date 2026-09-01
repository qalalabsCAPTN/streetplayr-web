import { getOrderAction } from '@/app/actions/order';
import { isInvoiceEligible } from '@/lib/commerce/order-paid';
import { forbidden, notFound, unauthorized } from 'next/navigation';
import Link from 'next/link';
import { OrderPriceBreakdown } from '@/components/commerce/OrderPriceBreakdown';

export const dynamic = 'force-dynamic';

export default async function OrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getOrderAction(id);
  if (result.code === 'UNAUTHORIZED') unauthorized();
  if (result.code === 'FORBIDDEN') forbidden();
  if (!result.success || !result.data) notFound();
  const order = result.data;

  if (!isInvoiceEligible(order)) {
    forbidden();
  }

  const ship = order.shippingAddress as Record<string, string>;

  return (
    <div className="acct-card" style={{ padding: 24 }}>
      <p className="acct-card__eyebrow">Invoice</p>
      <h1 className="acct-hero__name">StreetPlayR</h1>
      <p>Order {order.orderNumber}</p>
      <p>Status: {order.status} · Payment: {order.paymentStatus ?? 'pending'}</p>
      <p>Bill to: {ship.name || ship.email || 'Customer'}</p>
      <p>
        {ship.line1 || ship.address_line_1} {ship.city} {ship.postalCode || ship.pincode} {ship.country}
      </p>
      <table className="data-table" style={{ marginTop: 24, width: '100%' }}>
        <thead>
          <tr>
            <th align="left">Item</th>
            <th align="right">Qty</th>
            <th align="right">Unit</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>{item.productTitle ?? item.productId}</td>
              <td align="right">{item.quantity}</td>
              <td align="right">₹{item.price.toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <OrderPriceBreakdown
        subtotal={order.subtotal}
        discount={order.discountTotal ?? 0}
        shipping={order.shippingCost}
        tax={order.taxAmount}
        grandTotal={order.total}
      />
      <p className="acct-card__sub">Print this page for a PDF copy. Amounts are server snapshots from the order row.</p>
      <Link href={`/profile/orders/${order.id}`}>← Order</Link>
      {' · '}
      <a href={`/profile/orders/${order.id}/invoice/download`}>Download invoice</a>
    </div>
  );
}

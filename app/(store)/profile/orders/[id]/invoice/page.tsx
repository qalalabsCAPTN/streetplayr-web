import { getOrderAction } from '@/app/actions/order';
import { isInvoiceEligible, isPayableOrder } from '@/lib/commerce/order-paid';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getOrderAction(id);
  if (!result.success || !result.data) notFound();
  const order = result.data;

  if (!isInvoiceEligible(order)) {
    return (
      <div className="acct-card" style={{ padding: 24 }}>
        <p className="acct-card__eyebrow">Payment</p>
        <h1 className="acct-hero__name">
          {isPayableOrder(order) ? 'Payment pending' : 'Invoice unavailable'}
        </h1>
        <p>Order {order.orderNumber}</p>
        <p>
          Status: {order.status} · Payment: {order.paymentStatus ?? 'pending'}
        </p>
        <p className="acct-card__sub">
          A purchase invoice is issued only after Easebuzz confirms payment. This order has not been paid.
        </p>
        {isPayableOrder(order) && (
          <p>
            <Link href={`/checkout?error=payment_failed&order_id=${order.id}`}>Retry payment</Link>
          </p>
        )}
        <Link href={`/profile/orders/${order.id}`}>← Order</Link>
      </div>
    );
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
      <p>Subtotal ₹{order.subtotal.toLocaleString('en-IN')}</p>
      <p>Shipping ₹{order.shippingCost.toLocaleString('en-IN')}</p>
      <p>Tax ₹{order.taxAmount.toLocaleString('en-IN')}</p>
      <p>Discount ₹{(order.discountTotal ?? 0).toLocaleString('en-IN')}</p>
      <h2>Grand total ₹{order.total.toLocaleString('en-IN')}</h2>
      <p className="acct-card__sub">Print this page for a PDF copy. Amounts are server snapshots from the order row.</p>
      <Link href={`/profile/orders/${order.id}`}>← Order</Link>
      {' · '}
      <a href={`/profile/orders/${order.id}/invoice/download`}>Download invoice</a>
    </div>
  );
}

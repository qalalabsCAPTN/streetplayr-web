'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Order } from '@/lib/orchestration/types';
import { customerOrderStatusLabel, isInvoiceEligible, isPayableOrder } from '@/lib/commerce/order-paid';

function money(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [exchangeItemId, setExchangeItemId] = useState('');
  const [exchangeVariantId, setExchangeVariantId] = useState('');
  const [exchangeOptions, setExchangeOptions] = useState<Array<{ id: string; label: string }>>([]);

  async function load() {
    const { getOrderAction } = await import('@/app/actions/order');
    const result = await getOrderAction(params.id);
    if (!result.success || !result.data) {
      setError(result.error ?? 'Order not found');
      setOrder(null);
      return;
    }
    setOrder(result.data);
    setError(null);
  }

  useEffect(() => {
    load().catch(() => setError('Failed to load order'));
  }, [params.id]);

  if (error && !order) {
    return (
      <div>
        <p className="acct-card__sub">{error}</p>
        <Link href="/profile/orders">← Orders</Link>
      </div>
    );
  }

  if (!order) return <p className="acct-card__sub">Loading…</p>;

  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const canReturn = ['shipped', 'delivered'].includes(order.status);
  const canRetry = isPayableOrder(order);
  const canInvoice = isInvoiceEligible(order);

  return (
    <div>
      <Link href="/profile/orders" className="acct-card__sub">← Orders</Link>
      <div className="acct-hero">
        <p className="acct-hero__greet">{customerOrderStatusLabel(order)}</p>
        <h1 className="acct-hero__name">{order.orderNumber}</h1>
      </div>

      <div className="acct-card" style={{ marginBottom: 20 }}>
        <span className="acct-card__eyebrow">Totals</span>
        <p>Subtotal {money(order.subtotal)}</p>
        <p>Shipping {money(order.shippingCost)}</p>
        <p>Tax {money(order.taxAmount)}</p>
        <p>Discount {money(order.discountTotal ?? 0)}</p>
        <h2 className="acct-card__head-title">{money(order.total)}</h2>
        <p className="acct-card__sub">Payment: {order.paymentStatus ?? 'pending'}</p>
      </div>

      <div className="acct-card" style={{ marginBottom: 20 }}>
        <span className="acct-card__eyebrow">Items</span>
        {order.items.map((item) => (
          <p key={item.id}>
            {item.productTitle ?? item.productId} {item.variantTitle ? `· ${item.variantTitle}` : ''} ×{item.quantity} — {money(item.price)}
          </p>
        ))}
      </div>

      <div className="acct-card" style={{ marginBottom: 20 }}>
        <span className="acct-card__eyebrow">Tracking</span>
        <p>{order.carrier || 'Carrier pending'}</p>
        <p>{order.trackingNumber || 'No tracking number yet'}</p>
      </div>

      <div className="acct-card" style={{ marginBottom: 20 }}>
        <span className="acct-card__eyebrow">Documents</span>
        {canInvoice ? (
          <p>
            <Link href={`/profile/orders/${order.id}/invoice`}>View invoice</Link>
            {' · '}
            <a href={`/profile/orders/${order.id}/invoice/download`}>Download invoice</a>
          </p>
        ) : (
          <p className="acct-card__sub">
            Invoice is issued after successful payment.
            {canRetry ? ' Complete payment to receive an invoice.' : ''}
          </p>
        )}
      </div>

      {error && <p className="checkout-error">{error}</p>}

      {canRetry && (
        <button
          type="button"
          className="storefront-cta"
          disabled={!!busy}
          onClick={() => router.push(`/checkout?error=payment_failed&order_id=${order.id}`)}
        >
          Retry payment
        </button>
      )}

      {canCancel && (
        <button
          type="button"
          className="storefront-cta"
          disabled={!!busy}
          onClick={async () => {
            setBusy('cancel');
            const { cancelMyOrderAction } = await import('@/app/actions/order');
            const result = await cancelMyOrderAction(order.id);
            setBusy(null);
            if (!result.success) setError(result.error ?? 'Cancel failed');
            else await load();
          }}
        >
          {busy === 'cancel' ? 'Cancelling…' : 'Cancel order'}
        </button>
      )}

      {canReturn && (
        <div className="acct-card" style={{ marginTop: 16 }}>
          <span className="acct-card__eyebrow">Return / exchange</span>
          <textarea
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="Reason"
            rows={3}
            style={{ width: '100%', margin: '8px 0' }}
          />
          <button
            type="button"
            className="storefront-cta"
            disabled={!!busy}
            onClick={async () => {
              setBusy('return');
              const { requestReturnAction } = await import('@/app/actions/order');
              const result = await requestReturnAction(order.id, returnReason);
              setBusy(null);
              if (!result.success) setError(result.error ?? 'Return failed');
              else await load();
            }}
          >
            Request return
          </button>
          <div style={{ marginTop: 16 }}>
            <p className="acct-card__sub">Exchange to another size of the same product. This opens a return with the replacement SKU recorded.</p>
            <select
              value={exchangeItemId}
              onChange={async (e) => {
                const id = e.target.value;
                setExchangeItemId(id);
                setExchangeVariantId('');
                const item = order.items.find((i) => i.id === id);
                if (!item) {
                  setExchangeOptions([]);
                  return;
                }
                const { getExchangeOptionsAction } = await import('@/app/actions/order');
                const opts = await getExchangeOptionsAction(item.productId);
                setExchangeOptions(opts.success ? opts.data : []);
              }}
              style={{ width: '100%', margin: '8px 0' }}
            >
              <option value="">Select item</option>
              {order.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.productTitle ?? item.productId} {item.variantTitle ? `· ${item.variantTitle}` : ''}
                </option>
              ))}
            </select>
            <select
              value={exchangeVariantId}
              onChange={(e) => setExchangeVariantId(e.target.value)}
              style={{ width: '100%', margin: '8px 0' }}
            >
              <option value="">Replacement size</option>
              {exchangeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <button
              type="button"
              className="storefront-cta"
              disabled={!!busy || !exchangeItemId || !exchangeVariantId}
              onClick={async () => {
                setBusy('exchange');
                const { requestExchangeAction } = await import('@/app/actions/order');
                const result = await requestExchangeAction(order.id, exchangeItemId, exchangeVariantId, returnReason);
                setBusy(null);
                if (!result.success) setError(result.error ?? 'Exchange failed');
                else await load();
              }}
            >
              {busy === 'exchange' ? 'Submitting…' : 'Request exchange'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

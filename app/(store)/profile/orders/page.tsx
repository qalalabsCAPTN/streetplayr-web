'use client';

import { useEffect, useState } from 'react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  createdAt: string;
  status: string;
  total: number;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatPrice(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const { getMyOrdersAction } = await import('@/app/actions/order');
        const result = await getMyOrdersAction();

        if (result.success && result.data) {
          const mapped: Order[] = result.data.map((o: any) => ({
            id: o.id,
            createdAt: o.createdAt,
            status: o.status,
            total: o.total,
            items: [],
          }));
          setOrders(mapped);
        }
      } catch {}
      setLoading(false);
    }
    loadOrders();
  }, []);

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  if (loading) {
    return (
      <div>
        <div className="acct-hero">
          <p className="acct-hero__greet">Purchases</p>
          <h1 className="acct-hero__name">Orders</h1>
        </div>
        <p className="acct-card__sub">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="acct-hero">
        <p className="acct-hero__greet">Purchases</p>
        <h1 className="acct-hero__name">Orders</h1>
      </div>

      {orders.length > 0 ? (
        <>
          <div className="acct-grid acct-grid--4" style={{ marginBottom: 28 }}>
            <div className="acct-card">
              <span className="acct-card__eyebrow">Total orders</span>
              <h2 className="acct-card__head-title">{orders.length}</h2>
            </div>
            <div className="acct-card">
              <span className="acct-card__eyebrow">Total spent</span>
              <h2 className="acct-card__head-title">{formatPrice(totalSpent)}</h2>
            </div>
            <div className="acct-card">
              <span className="acct-card__eyebrow">Delivered</span>
              <h2 className="acct-card__head-title" style={{ color: '#1a7f37' }}>{deliveredCount}</h2>
            </div>
            <div className="acct-card">
              <span className="acct-card__eyebrow">Cancelled</span>
              <h2 className="acct-card__head-title" style={{ color: '#c0301f' }}>{cancelledCount}</h2>
            </div>
          </div>

          <div className="acct-orders">
            {orders.map((order) => (
              <div key={order.id} className="acct-order">
                <div className="acct-order__head">
                  <div>
                    <p className="acct-order__id">#{order.id.slice(0, 8)}</p>
                    <p className="acct-order__date">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`acct-order__status acct-order__status--${order.status}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div className="acct-order__foot">
                  <span className="acct-order__total">{formatPrice(order.total)}</span>
                  <button type="button" className="acct-order__view">View details →</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="acct-empty" style={{ margin: 0 }}>
          <p className="acct-empty__title">Nothing acquired yet.</p>
          <p className="acct-empty__sub">When you place your first order, it will appear here.</p>
          <a href="/collections" className="storefront-cta storefront-cta--inline">Explore collection</a>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

interface Order { id: string; order_number: string | null; status: string; grand_total: number; currency: string; created_at: string; placed_at: string | null; }
function formatDate(ts: string) { if (!ts) return '—'; return new Date(ts).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await fetch('/api/nectar/orders'); if (res.ok) { const d = await res.json(); setOrders(d.orders ?? []); } } catch {} finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="dash-page">
      <section className="dash-hero-sm"><p className="dash-hero-eyebrow">Order History</p><h1 className="dash-hero-title">Your Acquisitions</h1></section>
      {loading ? <div className="dash-loading-pulse" /> : orders.length > 0 ? (
        <section className="dash-section"><div className="dash-timeline">{orders.map((o) => (
          <div key={o.id} className="dash-timeline-item">
            <div className="dash-timeline-left"><div className="dash-timeline-title">{o.order_number || 'Order'}</div><div className="dash-timeline-sub">{o.status} · {formatDate(o.placed_at || o.created_at)}</div></div>
            <div className="dash-timeline-right">{o.currency} {((o.grand_total ?? 0) / 100).toFixed(2)}</div>
          </div>
        ))}</div></section>
      ) : <div className="dash-empty"><p className="dash-empty-title">No orders yet</p><p className="dash-empty-sub">Your purchases and drops will appear here.</p></div>}
    </div>
  );
}

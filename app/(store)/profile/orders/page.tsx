'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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
  draft: 'Draft',
  pending_payment: 'Pending Payment',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  on_hold: 'On Hold',
  refunded: 'Refunded',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data } = await supabase
          .from('orders')
          .select('id, created_at, status, total, order_items(id, product_id, variant_id, quantity, price)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data) {
          // Fetch product names for all referenced product_ids
          const productIds = data.flatMap((o: any) =>
            (o.order_items ?? []).map((i: any) => i.product_id)
          );
          const productNames: Record<string, string> = {};
          if (productIds.length > 0) {
            const { data: products } = await supabase
              .from('products')
              .select('id, name')
              .in('id', productIds);
            if (products) {
              for (const p of products) productNames[p.id] = p.name;
            }
          }

          setOrders(data.map((o: any) => ({
            id: o.id,
            createdAt: o.created_at,
            status: o.status,
            total: o.total,
            items: (o.order_items ?? []).map((i: any) => ({
              id: i.id,
              name: productNames[i.product_id] ?? i.product_id.slice(0, 8),
              quantity: i.quantity,
              price: i.price,
            })),
          })));
        }
      } catch {}
      setLoading(false);
    }
    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="profile-page-root">
        <div className="profile-page-header">
          <p className="profile-page-eyebrow">Your acquisitions</p>
          <h1 className="profile-page-title">Orders</h1>
        </div>
        <div className="flex h-[30vh] items-center justify-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/30">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-root">
      <motion.div
        className="profile-page-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="profile-page-eyebrow">Your acquisitions</p>
        <h1 className="profile-page-title">Orders</h1>
      </motion.div>

      {orders.length > 0 ? (
        <div className="orders-list">
          {orders.map((order, i) => (
            <motion.article
              key={order.id}
              className="order-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="order-card-header">
                <div>
                  <p className="order-card-id">#{order.id.slice(0, 8)}</p>
                  <p className="order-card-date">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
                <span className="order-card-status">
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              <div className="order-card-items">
                {order.items.map((item, i) => (
                  <div key={i} className="order-card-item">
                    <span className="order-card-item-name">{item.name}</span>
                    <span className="order-card-item-meta">Qty: {item.quantity} · ₹{item.price.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="order-card-footer">
                <span className="order-card-total">₹{order.total.toLocaleString('en-IN')}</span>
                <button
                  className="order-card-action"
                  id={`order-details-${order.id}`}
                  type="button"
                >
                  View Details →
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <motion.div
          className="profile-empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="profile-empty-headline">Nothing acquired yet.</p>
          <p className="profile-empty-sub">
            When you place your first order, it will appear here.
          </p>
        </motion.div>
      )}
    </div>
  );
}

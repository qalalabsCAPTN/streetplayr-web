'use client';

import { motion } from 'framer-motion';

// ─── Mock Order Data ──────────────────────────────────────────────────────────
type OrderStatus = 'DELIVERED' | 'PROCESSING' | 'SHIPPED' | 'CANCELLED';

interface MockOrder {
  id: string;
  date: string;
  status: OrderStatus;
  total: number;
  items: { name: string; color: string; size: string }[];
}

const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'SP-2025-001',
    date: '2025-04-28T10:30:00Z',
    status: 'DELIVERED',
    total: 3999,
    items: [{ name: 'Arch Oversized Tee', color: 'Chalk', size: 'L' }],
  },
  {
    id: 'SP-2025-002',
    date: '2025-05-02T14:15:00Z',
    status: 'SHIPPED',
    total: 5499,
    items: [
      { name: 'Monolith Cargo', color: 'Onyx', size: '32' },
    ],
  },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  DELIVERED:  { label: 'Delivered',  color: 'var(--sp-success)' },
  PROCESSING: { label: 'Processing', color: 'var(--sp-accent)' },
  SHIPPED:    { label: 'Shipped',    color: 'var(--tier-player)' },
  CANCELLED:  { label: 'Cancelled',  color: 'var(--sp-error)' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function OrderCard({ order, index }: { order: MockOrder; index: number }) {
  const status = STATUS_CONFIG[order.status];

  return (
    <motion.article
      className="order-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`Order ${order.id}`}
    >
      <div className="order-card-header">
        <div>
          <p className="order-card-id">#{order.id}</p>
          <p className="order-card-date">{formatDate(order.date)}</p>
        </div>
        <span
          className="order-card-status"
          style={{ color: status.color, borderColor: status.color }}
        >
          {status.label}
        </span>
      </div>

      <div className="order-card-items">
        {order.items.map((item, i) => (
          <div key={i} className="order-card-item">
            <span className="order-card-item-name">{item.name}</span>
            <span className="order-card-item-meta">{item.color} · {item.size}</span>
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
  );
}

export default function OrdersPage() {
  const hasOrders = MOCK_ORDERS.length > 0;

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

      {hasOrders ? (
        <div className="orders-list">
          {MOCK_ORDERS.map((order, i) => (
            <OrderCard key={order.id} order={order} index={i} />
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

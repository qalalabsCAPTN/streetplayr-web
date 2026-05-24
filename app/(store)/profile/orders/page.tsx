'use client';

import { motion } from 'framer-motion';
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
      <div className="max-w-[min(98vw,2560px)]">
        <div className="mb-10 border-l-4 border-[#ddb7ff] pl-6">
          <div className="h-3 w-48 bg-white/[0.04] mb-2" />
          <div className="h-12 w-64 bg-white/[0.03]" />
        </div>
        <div className="flex h-[30vh] items-center justify-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/30">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[min(98vw,2560px)]">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 border-l-4 border-[#ddb7ff] pl-6"
      >
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-tight text-[#eadfed] leading-none">
          Orders
        </h1>
      </motion.header>

      {orders.length > 0 ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
          >
            <div className="bg-[#1f1a23] border border-white/[0.06] p-5 rounded-xl">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 block mb-2">Total Orders</span>
              <span className="font-display text-3xl text-[#eadfed]">{orders.length}</span>
            </div>
            <div className="bg-[#1f1a23] border border-white/[0.06] p-5 rounded-xl">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 block mb-2">Total Spent</span>
              <span className="font-display text-3xl text-[#eadfed]">{formatPrice(totalSpent)}</span>
            </div>
            <div className="bg-[#1f1a23] border border-white/[0.06] p-5 rounded-xl">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 block mb-2">Delivered</span>
              <span className="font-display text-3xl text-green-400">{deliveredCount}</span>
            </div>
            <div className="bg-[#1f1a23] border border-white/[0.06] p-5 rounded-xl">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 block mb-2">Cancelled</span>
              <span className="font-display text-3xl text-red-400">{cancelledCount}</span>
            </div>
          </motion.div>

          <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#1f1a23] border border-white/[0.06] p-5 md:p-6 hover:border-white/[0.1] transition-colors rounded-xl"
            >
              <div className="flex items-start justify-between mb-5 pb-5 border-b border-white/[0.05]">
                <div>
                  <p className="font-mono text-[11px] text-white/80 uppercase tracking-[0.1em]">
                    #{order.id.slice(0, 8)}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 mt-1">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-3 py-1 border rounded ${
                  order.status === 'delivered' ? 'text-green-400 border-green-500/30' :
                  order.status === 'cancelled' ? 'text-red-400 border-red-500/30' :
                  order.status === 'shipped' ? 'text-[#ddb7ff] border-[#ddb7ff]/30' :
                  'text-white/40 border-white/[0.15]'
                }`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                <span className="font-display text-2xl uppercase text-[#eadfed]">{formatPrice(order.total)}</span>
                <button
                  type="button"
                  className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white transition-colors py-2"
                >
                  View Details →
                </button>
              </div>
            </motion.div>
          ))}
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border border-white/[0.06] p-12 text-center rounded-xl"
        >
          <p className="font-display text-3xl uppercase text-white/15 mb-3">Nothing acquired yet.</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/20 mb-6">
            When you place your first order, it will appear here.
          </p>
          <a
            href="/collections"
            className="inline-block border border-white/[0.2] px-8 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 hover:bg-white hover:text-[#16111b] transition-all rounded-xl"
          >
            Explore Collection
          </a>
        </motion.div>
      )}
    </div>
  );
}

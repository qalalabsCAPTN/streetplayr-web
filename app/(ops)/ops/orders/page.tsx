import React from "react";

type OrderStatus =
  | "draft" | "pending_payment" | "confirmed" | "processing"
  | "shipped" | "delivered" | "cancelled" | "on_hold" | "refunded";

const ORDERS: {
  id: string;
  customer: string;
  email: string;
  status: OrderStatus;
  total: number;
  items: number;
  timeline: { time: string; event: string }[];
}[] = [
  {
    id: "SP-ORD-0421",
    customer: "Arjun Mehta",
    email: "arjun.m@example.com",
    status: "processing",
    total: 440,
    items: 2,
    timeline: [
      { time: "10:04", event: "Fulfillment Batch 04 — picking in progress" },
      { time: "09:42", event: "Payment confirmed — Stripe ID pi_3Lx..." },
      { time: "09:40", event: "Order submitted — reservation held" },
    ],
  },
  {
    id: "SP-ORD-0420",
    customer: "Priya Sharma",
    email: "priya.s@example.com",
    status: "shipped",
    total: 220,
    items: 1,
    timeline: [
      { time: "08:15", event: "Dispatched — tracking ID SP-DHL-0420" },
      { time: "06:30", event: "Label generated — warehouse handshake complete" },
      { time: "2026-05-06", event: "Order confirmed — payment settled" },
    ],
  },
  {
    id: "SP-ORD-0419",
    customer: "Rohan Patel",
    email: "rohan.p@example.com",
    status: "delivered",
    total: 350,
    items: 1,
    timeline: [
      { time: "2026-05-05", event: "Delivered — signed by recipient" },
      { time: "2026-05-03", event: "In transit — customs clearance passed" },
    ],
  },
  {
    id: "SP-ORD-0418",
    customer: "Ananya Gupta",
    email: "ananya.g@example.com",
    status: "pending_payment",
    total: 935,
    items: 3,
    timeline: [
      { time: "10:22", event: "Payment initiated — awaiting confirmation" },
    ],
  },
  {
    id: "SP-ORD-0417",
    customer: "Vikram Singh",
    email: "vikram.s@example.com",
    status: "cancelled",
    total: 550,
    items: 1,
    timeline: [
      { time: "09:15", event: "Cancelled — customer request, full refund issued" },
      { time: "09:00", event: "Payment held — reservation released" },
    ],
  },
  {
    id: "SP-ORD-0416",
    customer: "Neha Kapoor",
    email: "neha.k@example.com",
    status: "on_hold",
    total: 275,
    items: 2,
    timeline: [
      { time: "10:30", event: "Flagged — address verification required" },
      { time: "10:28", event: "Order submitted — payment processing" },
    ],
  },
];

const STATUS_STYLES: Record<OrderStatus, { color: string; label: string }> = {
  draft: { color: "text-[var(--ops-text-muted)]", label: "Draft" },
  pending_payment: { color: "text-yellow-400", label: "Pending Payment" },
  confirmed: { color: "text-blue-400", label: "Confirmed" },
  processing: { color: "text-[var(--sp-accent)]", label: "Processing" },
  shipped: { color: "text-blue-300", label: "Shipped" },
  delivered: { color: "text-green-400", label: "Delivered" },
  cancelled: { color: "text-red-400/70", label: "Cancelled" },
  on_hold: { color: "text-orange-400", label: "On Hold" },
  refunded: { color: "text-[var(--ops-text-muted)]", label: "Refunded" },
};

export default function OrdersPage() {
  const activeOrders = ORDERS.filter((o) =>
    ["pending_payment", "confirmed", "processing"].includes(o.status)
  ).length;

  return (
    <div className="space-y-12">
      <section className="flex items-end justify-between border-b border-[var(--ops-border-subtle)] pb-8">
        <div>
          <h1 className="font-display text-6xl uppercase tracking-tight text-white">
            Order Narratives
          </h1>
          <p className="mt-4 text-[10px] font-mono text-[var(--ops-text-secondary)] uppercase tracking-[0.2em]">
            Fulfillment Lifecycle / {ORDERS.length} Active Dossiers
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-xl font-mono text-[var(--sp-accent)]">{activeOrders}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">In Progress</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono text-green-400">
              {ORDERS.filter((o) => o.status === "delivered").length}
            </div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Delivered</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Revenue</div>
            <div className="text-xl font-mono text-white">
              ${ORDERS.reduce((s, o) => s + (o.status !== "cancelled" ? o.total : 0), 0).toLocaleString()}
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {ORDERS.map((order) => (
          <div
            key={order.id}
            className="group p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20 hover:bg-[var(--ops-bg-surface)]/40 transition-all duration-500"
          >
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className={`text-[9px] font-mono uppercase tracking-[0.2em] ${STATUS_STYLES[order.status].color}`}>
                    {STATUS_STYLES[order.status].label}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--ops-text-muted)]">
                    {order.id}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-display uppercase tracking-tight text-white group-hover:pl-4 transition-all duration-700">
                    {order.customer}
                  </h3>
                  <p className="text-[10px] font-mono text-[var(--ops-text-secondary)] mt-1">{order.email}</p>
                </div>
                <div className="flex items-center gap-8 text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                  <span>{order.items} Item{order.items > 1 ? "s" : ""}</span>
                  <span>${order.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="relative pl-5 space-y-3 min-w-[260px] before:absolute before:left-[2px] before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-[var(--ops-border-subtle)]">
                {order.timeline.slice(0, 2).map((entry, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[19px] top-1 w-[5px] h-[5px] rounded-full bg-[var(--ops-text-muted)] border border-[var(--ops-bg-base)]" />
                    <span className="text-[8px] font-mono text-[var(--ops-text-muted)] block">{entry.time}</span>
                    <p className="text-[9px] font-mono text-[var(--ops-text-secondary)] leading-relaxed">{entry.event}</p>
                  </div>
                ))}
                {order.timeline.length > 2 && (
                  <p className="text-[8px] font-mono text-[var(--ops-text-muted)] pl-1">
                    +{order.timeline.length - 2} more events
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="pt-12 border-t border-[var(--ops-border-subtle)] flex gap-24">
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Fulfillment Authority</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Stripe / ShipEngine Sync</div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Last Scanning Batch</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Batch 04 — 10:04:32 AM</div>
        </div>
      </section>
    </div>
  );
}

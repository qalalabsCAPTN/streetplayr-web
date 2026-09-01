import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { shippingDisplay } from "@/lib/commerce/totals";

type OrderStatus =
  | "pending" | "confirmed" | "processing" | "fulfilling"
  | "shipped" | "delivered" | "cancelled" | "returned" | "refunded";

const STATUS_STYLES: Record<OrderStatus, { color: string; label: string }> = {
  pending: { color: "text-yellow-400", label: "Pending Payment" },
  confirmed: { color: "text-blue-400", label: "Confirmed" },
  processing: { color: "text-[var(--sp-accent)]", label: "Processing" },
  fulfilling: { color: "text-orange-400", label: "Fulfilling" },
  shipped: { color: "text-blue-300", label: "Shipped" },
  delivered: { color: "text-green-400", label: "Delivered" },
  cancelled: { color: "text-red-400/70", label: "Cancelled" },
  returned: { color: "text-orange-300", label: "Returned" },
  refunded: { color: "text-[var(--ops-text-muted)]", label: "Refunded" },
};

async function getOrdersWithTimeline() {
  try {
    const admin = createAdminClient();

    const { data: orders } = await admin
      .from("orders")
      .select("id, order_number, customer_id, status, grand_total, subtotal, shipping_total, shipping_cost, tax_total, tax_amount, discount_total, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const orderIds = (orders ?? []).map((o: any) => o.id);

    const { data: orderItems } = await admin
      .from("order_items")
      .select("order_id, quantity, unit_price, total_price")
      .in("order_id", orderIds.length > 0 ? orderIds : ["00000000-0000-0000-0000-000000000000"]);

    const { data: events } = await admin
      .from("operational_events")
      .select("resource_id, message, created_at, severity")
      .eq("resource_type", "orders")
      .in("resource_id", orderIds.length > 0 ? orderIds : ["00000000-0000-0000-0000-000000000000"])
      .order("created_at", { ascending: false });

    const itemsByOrder: Record<string, number> = {};
    for (const item of orderItems ?? []) {
      itemsByOrder[item.order_id] = (itemsByOrder[item.order_id] ?? 0) + 1;
    }

    const eventsByOrder: Record<string, { time: string; event: string }[]> = {};
    for (const e of events ?? []) {
      if (!eventsByOrder[e.resource_id]) eventsByOrder[e.resource_id] = [];
      if (eventsByOrder[e.resource_id].length < 3) {
        eventsByOrder[e.resource_id].push({
          time: formatTime(e.created_at),
          event: e.message,
        });
      }
    }

    return (orders ?? []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number ?? o.id,
      status: o.status as OrderStatus,
      total: Number(o.grand_total ?? 0),
      subtotal: Number(o.subtotal ?? 0),
      shipping: Number(o.shipping_total ?? o.shipping_cost ?? 0),
      tax: Number(o.tax_total ?? o.tax_amount ?? 0),
      discount: Number(o.discount_total ?? 0),
      items: itemsByOrder[o.id] ?? 0,
      timeline: eventsByOrder[o.id] ?? [],
    }));
  } catch {
    return [];
  }
}

function formatTime(ts: string) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default async function OrdersPage() {
  const orders = await getOrdersWithTimeline();
  const activeOrders = orders.filter((o) =>
    ["pending", "confirmed", "processing", "fulfilling"].includes(o.status)
  ).length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const revenue = orders.reduce(
    (s, o) => s + (o.status !== "cancelled" && o.status !== "refunded" ? o.total : 0),
    0
  );

  return (
    <div className="space-y-12">
      <section className="flex items-end justify-between border-b border-[var(--ops-border-subtle)] pb-8">
        <div>
          <h1 className="font-display text-6xl uppercase tracking-tight text-white">
            Order Narratives
          </h1>
          <p className="mt-4 text-[10px] font-mono text-[var(--ops-text-secondary)] uppercase tracking-[0.2em]">
            Fulfillment Lifecycle / {orders.length} Active Dossiers
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-xl font-mono text-[var(--sp-accent)]">{activeOrders}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">In Progress</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono text-green-400">{deliveredCount}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Delivered</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Revenue</div>
            <div className="text-xl font-mono text-white">
              ₹{revenue.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </section>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="group p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20 hover:bg-[var(--ops-bg-surface)]/40 transition-all duration-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className={`text-[9px] font-mono uppercase tracking-[0.2em] ${STATUS_STYLES[order.status]?.color ?? "text-white/40"}`}>
                      {STATUS_STYLES[order.status]?.label ?? order.status}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--ops-text-muted)]">
                      {order.id.slice(0, 8)}...
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-display uppercase tracking-tight text-white group-hover:pl-4 transition-all duration-700">
                      Order {order.orderNumber}
                    </h3>
                  </div>
                  <div className="flex items-center gap-8 text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                    <span>{order.items} Item{order.items !== 1 ? "s" : ""}</span>
                    <span>Basic Amount ₹{order.subtotal.toLocaleString("en-IN")}</span>
                    {(order.discount ?? 0) > 0 && (
                      <span>Discount ₹{order.discount.toLocaleString("en-IN")}</span>
                    )}
                    <span>Shipping {shippingDisplay(order.shipping)}</span>
                    <span>GST ₹{order.tax.toLocaleString("en-IN")}</span>
                    <span>Total ₹{Number(order.total).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {order.timeline.length > 0 && (
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
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[40vh] items-center justify-center border border-dashed border-[var(--ops-border-subtle)]">
          <div className="text-center">
            <p className="font-mono text-[11px] text-[var(--ops-text-muted)] uppercase tracking-[0.2em]">
              No orders yet
            </p>
            <p className="mt-2 font-mono text-[10px] text-[var(--ops-text-muted)]">
              Orders placed on the storefront will appear here.
            </p>
          </div>
        </div>
      )}

      <section className="pt-12 border-t border-[var(--ops-border-subtle)] flex gap-24">
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Fulfillment Authority</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Payment / ShipEngine Sync</div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Data Source</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Supabase Orders + Events</div>
        </div>
      </section>
    </div>
  );
}

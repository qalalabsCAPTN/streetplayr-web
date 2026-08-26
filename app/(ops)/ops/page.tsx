import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";

interface DropSummary {
  id: string;
  title: string;
  status: string;
  products: number;
}

interface EventSummary {
  time: string;
  title: string;
  desc: string;
  severity: string;
}

function formatTime(ts: string) {
  if (!ts) return "—";
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

async function getDashboard() {
  try {
    const admin = createAdminClient();

    const [collectionsRes, eventsRes, ordersRes] = await Promise.all([
      admin.from("collections").select("id, name, is_active, created_at").limit(20),
      admin.from("operational_events")
        .select("id, action, message, severity, created_at, domain")
        .order("created_at", { ascending: false })
        .limit(10),
      admin.from("orders").select("status"),
    ]);

    const drops: DropSummary[] = await Promise.all(
      (collectionsRes.data ?? []).map(async (c: any) => {
        const { count } = await admin
          .from("collection_products")
          .select("*", { count: "exact", head: true })
          .eq("collection_id", c.id);
        return {
          id: c.id,
          title: c.name,
          status: c.is_active ? "Active" : "Draft",
          products: count ?? 0,
        };
      })
    );

    const events: EventSummary[] = (eventsRes.data ?? []).map((e: any) => ({
      time: formatTime(e.created_at),
      title: e.action,
      desc: e.message,
      severity: e.severity,
    }));

    const orderStatuses = (ordersRes.data ?? []).map((o: any) => o.status as string);
    const pendingCount = orderStatuses.filter((s) => s === "pending" || s === "processing" || s === "confirmed").length;

    return { drops, events, pendingCount, totalOrders: orderStatuses.length };
  } catch {
    return { drops: [], events: [], pendingCount: 0, totalOrders: 0 };
  }
}

export default async function OpsDashboard() {
  const { drops, events, pendingCount, totalOrders } = await getDashboard();

  return (
    <div className="space-y-16">
      <section>
        <h1 className="font-display text-7xl uppercase tracking-tight leading-[0.85] text-white">
          Operational<br />Command Center
        </h1>
        <p className="mt-6 text-sm text-[var(--ops-text-secondary)] font-mono tracking-widest uppercase">
          System Status: Optimal / Active Brand: StreetPlayR
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Active Drops */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">
              Active Orchestration
            </h2>
            <span className="text-[10px] font-mono text-[var(--ops-text-secondary)]">
              {drops.filter((d) => d.status === "Active").length} Events Running
            </span>
          </div>

          {drops.length > 0 ? (
            <div className="space-y-4">
              {drops.filter((d) => d.status === "Active" || d.status === "Draft").slice(0, 5).map((drop) => (
                <div key={drop.id} className="group p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/40 hover:bg-[var(--ops-bg-surface)] transition-all duration-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-[var(--sp-accent)] uppercase tracking-widest mb-2 block">
                        {drop.status}
                      </span>
                      <h3 className="text-3xl font-display uppercase tracking-tight text-white group-hover:tracking-normal transition-all duration-700">
                        {drop.title}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-mono text-white mb-1">{drop.products}</div>
                      <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Products</div>
                    </div>
                  </div>
                  <div className="mt-8 h-[1px] w-full bg-[var(--ops-border-subtle)] relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-[var(--sp-accent)] transition-all duration-1000" style={{ width: "0%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[20vh] items-center justify-center border border-dashed border-[var(--ops-border-subtle)]">
              <p className="text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                No active drops
              </p>
            </div>
          )}
        </div>

        {/* Urgency Narrative */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">
              Urgency Narrative
            </h2>
            <span className="text-[10px] font-mono text-[var(--ops-text-secondary)]">
              {pendingCount} pending
            </span>
          </div>

          {events.length > 0 ? (
            <div className="relative pl-6 space-y-8 before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--ops-border-subtle)]">
              {events.slice(0, 5).map((event, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-[27px] top-1.5 w-[7px] h-[7px] rounded-full border border-[var(--ops-bg-base)] ${
                    event.severity === "warning" || event.severity === "error" ? "bg-orange-400/80" : "bg-[var(--ops-text-muted)]"
                  }`} />
                  <span className="text-[9px] font-mono text-[var(--ops-text-muted)] block mb-1">
                    {event.time}
                  </span>
                  <h4 className="text-sm font-mono uppercase tracking-wider text-white">
                    {event.title}
                  </h4>
                  <p className="text-[11px] text-[var(--ops-text-secondary)] mt-1 leading-relaxed line-clamp-2">
                    {event.desc}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[20vh] items-center justify-center border border-dashed border-[var(--ops-border-subtle)]">
              <p className="text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                No recent events
              </p>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
            <span>{totalOrders} total orders</span>
            <span>Events feed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

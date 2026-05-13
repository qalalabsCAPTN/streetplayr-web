import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { DropActions } from "./DropActions";

const DROP_STATES = ["draft", "scheduled", "active", "cooling", "archived"] as const;
type DropState = (typeof DROP_STATES)[number];

interface DropItem {
  id: string;
  title: string;
  state: DropState;
  products: number;
  isActive: boolean;
  releaseDate: string;
  timeline: { time: string; event: string; severity: "info" | "warning" }[];
}

const STATE_DISPLAY: Record<DropState, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  active: "Active",
  cooling: "Cooling",
  archived: "Archived",
};

const STATE_COLORS: Record<string, string> = {
  active: "text-[var(--sp-accent)]",
  scheduled: "text-blue-400",
  draft: "text-[var(--ops-text-muted)]",
  cooling: "text-orange-400",
  archived: "text-[var(--ops-text-muted)]/50",
};

const STATE_BORDERS: Record<string, string> = {
  active: "border-[var(--sp-accent)]/20 hover:border-[var(--sp-accent)]/40",
  scheduled: "border-blue-400/10 hover:border-blue-400/30",
  draft: "border-[var(--ops-border-subtle)]",
  cooling: "border-orange-400/10 hover:border-orange-400/30",
  archived: "border-[var(--ops-border-subtle)] opacity-60",
};

function formatTime(ts: string) {
  if (!ts) return "—";
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

async function getDrops(): Promise<DropItem[]> {
  try {
    const admin = createAdminClient();

    const { data: collections } = await admin
      .from("collections")
      .select("id, name, slug, is_active, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: collectionProducts } = await admin
      .from("collection_products")
      .select("collection_id, product_id");

    const productCountMap: Record<string, number> = {};
    for (const cp of collectionProducts ?? []) {
      productCountMap[cp.collection_id] = (productCountMap[cp.collection_id] ?? 0) + 1;
    }

    const { data: events } = await admin
      .from("operational_events")
      .select("resource_id, message, created_at, severity")
      .eq("resource_type", "collections")
      .order("created_at", { ascending: false })
      .limit(200);

    const eventMap: Record<string, { time: string; event: string; severity: "info" | "warning" }[]> = {};
    for (const e of events ?? []) {
      if (!eventMap[e.resource_id]) eventMap[e.resource_id] = [];
      if (eventMap[e.resource_id].length < 5) {
        eventMap[e.resource_id].push({
          time: formatTime(e.created_at),
          event: e.message,
          severity: e.severity === "warning" || e.severity === "error" ? "warning" : "info",
        });
      }
    }

    return (collections ?? []).map((c: any): DropItem => {
      let state: DropState = "draft";
      if (c.is_active) state = "active";
      const pCount = productCountMap[c.id] ?? 0;
      return {
        id: c.id,
        title: c.name,
        state,
        products: pCount,
        isActive: c.is_active ?? false,
        releaseDate: c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN", {
          month: "short", day: "numeric", year: "numeric",
        }) : "—",
        timeline: eventMap[c.id] ?? [],
      };
    });
  } catch {
    return [];
  }
}

export default async function DropsPage() {
  const drops = await getDrops();
  const activeCount = drops.filter((d) => d.state === "active").length;
  const upcomingCount = drops.filter((d) => d.state === "scheduled" || d.state === "draft").length;

  return (
    <div className="space-y-16">
      <section className="flex items-end justify-between border-b border-[var(--ops-border-subtle)] pb-8">
        <div>
          <h1 className="font-display text-6xl uppercase tracking-tight text-white">
            Drop Orchestration
          </h1>
          <p className="mt-4 text-[10px] font-mono text-[var(--ops-text-secondary)] uppercase tracking-[0.2em]">
            Release Sequence Authority / {drops.length} Managed Objects
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-xl font-mono text-[var(--sp-accent)]">{activeCount}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Active</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono text-blue-400">{upcomingCount}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Upcoming</div>
          </div>
        </div>
      </section>

      {drops.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {drops.map((drop) => (
            <div
              key={drop.id}
              className={`group p-8 border bg-[var(--ops-bg-surface)]/20 transition-all duration-500 ${STATE_BORDERS[drop.state]}`}
            >
              <div className="flex items-start justify-between mb-8">
                <div className="space-y-2">
                  <span className={`text-[9px] font-mono uppercase tracking-[0.2em] block ${STATE_COLORS[drop.state]}`}>
                    {STATE_DISPLAY[drop.state]}
                  </span>
                  <h3 className="text-3xl font-display uppercase tracking-tight text-white group-hover:tracking-normal transition-all duration-700">
                    {drop.title}
                  </h3>
                  <div className="text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                    ID: {drop.id.slice(0, 8)}...
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 mb-8">
                <div>
                  <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Products</div>
                  <div className="text-lg font-mono text-white">{drop.products}</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Release</div>
                  <div className="text-lg font-mono text-white">{drop.releaseDate}</div>
                </div>
              </div>

              {drop.timeline.length > 0 && (
                <div className="relative pl-5 space-y-4 before:absolute before:left-[2px] before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-[var(--ops-border-subtle)]">
                  {drop.timeline.map((entry, i) => (
                    <div key={i} className="relative">
                      <div className={`absolute -left-[19px] top-1.5 w-[5px] h-[5px] rounded-full border border-[var(--ops-bg-base)] ${
                        entry.severity === "warning" ? "bg-orange-400/80" : "bg-[var(--ops-text-muted)]"
                      }`} />
                      <span className="text-[8px] font-mono text-[var(--ops-text-muted)] block">{entry.time}</span>
                      <p className="text-[10px] font-mono text-[var(--ops-text-secondary)] leading-relaxed">{entry.event}</p>
                    </div>
                  ))}
                </div>
              )}

              <DropActions collectionId={drop.id} isActive={drop.isActive} />

              <div className="mt-8 pt-6 border-t border-[var(--ops-border-subtle)] flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                  Collection ID: {drop.id.slice(0, 8)}
                </span>
                <span className="text-[8px] font-mono text-white uppercase tracking-widest border-b border-white/20 pb-0.5">
                  Managed via Collections
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[40vh] items-center justify-center border border-dashed border-[var(--ops-border-subtle)]">
          <div className="text-center">
            <p className="font-mono text-[11px] text-[var(--ops-text-muted)] uppercase tracking-[0.2em]">
              No drops configured
            </p>
            <p className="mt-2 font-mono text-[10px] text-[var(--ops-text-muted)]">
              Create collections in the CRM to manage drops here.
            </p>
          </div>
        </div>
      )}

      <section className="pt-12 border-t border-[var(--ops-border-subtle)] flex gap-24">
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Drop Engine</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Collections API</div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Data Source</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">collections + collection_products + events</div>
        </div>
      </section>
    </div>
  );
}

import React from "react";

const DROP_STATES = ["Draft", "Scheduled", "Active", "Cooling", "Archived"] as const;

const DROPS = [
  {
    id: "sp-d1-genesis",
    title: "Genesis Archive Drop",
    state: "Active",
    campaign: "Genesis v1",
    products: 4,
    pressure: "88%",
    timer: "02:14:55",
    releaseDate: "2026-05-01",
    timeline: [
      { time: "10:04", event: "Allocation contention flagged — Size L", severity: "warning" as const },
      { time: "09:42", event: "Fulfillment Batch 04 locked", severity: "info" as const },
      { time: "08:15", event: "Drop activated — reservation pool open", severity: "info" as const },
    ],
  },
  {
    id: "sp-d2-lookbook04",
    title: "Seasonal Lookbook 04",
    state: "Scheduled",
    campaign: "Lookbook 04",
    products: 6,
    pressure: "12%",
    timer: "18:44:12",
    releaseDate: "2026-05-15",
    timeline: [
      { time: "11:20", event: "Editorial assets approved — Sanity sync", severity: "info" as const },
      { time: "09:00", event: "Pricing strategy finalized", severity: "info" as const },
    ],
  },
  {
    id: "sp-d3-stealth",
    title: "Stealth Tech Capsule",
    state: "Draft",
    campaign: "Noir Technical",
    products: 3,
    pressure: "0%",
    timer: "--:--:--",
    releaseDate: "TBD",
    timeline: [
      { time: "14:02", event: "Sample production queue opened", severity: "info" as const },
    ],
  },
  {
    id: "sp-d4-vanguard",
    title: "Vanguard Archive",
    state: "Archived",
    campaign: "Launch 2025",
    products: 2,
    pressure: "0%",
    timer: "--:--:--",
    releaseDate: "2025-12-01",
    timeline: [
      { time: "2025-12-01", event: "Drop concluded — all allocations released", severity: "info" as const },
    ],
  },
];

const STATE_COLORS: Record<string, string> = {
  Active: "text-[var(--sp-accent)]",
  Scheduled: "text-blue-400",
  Draft: "text-[var(--ops-text-muted)]",
  Cooling: "text-orange-400",
  Archived: "text-[var(--ops-text-muted)]/50",
};

const STATE_BORDERS: Record<string, string> = {
  Active: "border-[var(--sp-accent)]/20 hover:border-[var(--sp-accent)]/40",
  Scheduled: "border-blue-400/10 hover:border-blue-400/30",
  Draft: "border-[var(--ops-border-subtle)]",
  Cooling: "border-orange-400/10 hover:border-orange-400/30",
  Archived: "border-[var(--ops-border-subtle)] opacity-60",
};

export default function DropsPage() {
  const activeCount = DROPS.filter((d) => d.state === "Active").length;
  const upcomingCount = DROPS.filter((d) => d.state === "Scheduled" || d.state === "Draft").length;

  return (
    <div className="space-y-16">
      <section className="flex items-end justify-between border-b border-[var(--ops-border-subtle)] pb-8">
        <div>
          <h1 className="font-display text-6xl uppercase tracking-tight text-white">
            Drop Orchestration
          </h1>
          <p className="mt-4 text-[10px] font-mono text-[var(--ops-text-secondary)] uppercase tracking-[0.2em]">
            Release Sequence Authority / {DROPS.length} Managed Objects
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
          <button className="px-6 py-2 bg-white text-black font-mono text-[10px] uppercase tracking-widest hover:bg-[var(--sp-cta-hover-bg)] transition-colors">
            New Drop
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {DROPS.map((drop) => (
          <div
            key={drop.id}
            className={`group p-8 border bg-[var(--ops-bg-surface)]/20 transition-all duration-500 ${STATE_BORDERS[drop.state]}`}
          >
            <div className="flex items-start justify-between mb-8">
              <div className="space-y-2">
                <span className={`text-[9px] font-mono uppercase tracking-[0.2em] block ${STATE_COLORS[drop.state]}`}>
                  {drop.state}
                </span>
                <h3 className="text-3xl font-display uppercase tracking-tight text-white group-hover:tracking-normal transition-all duration-700">
                  {drop.title}
                </h3>
                <div className="text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                  ID: {drop.id} / Campaign: {drop.campaign}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono text-white">{drop.timer}</div>
                <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Countdown</div>
              </div>
            </div>

            <div className="flex items-center gap-8 mb-8">
              <div>
                <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Products</div>
                <div className="text-lg font-mono text-white">{drop.products}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Pressure</div>
                <div className="text-lg font-mono text-white">{drop.pressure}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Release</div>
                <div className="text-lg font-mono text-white">{drop.releaseDate}</div>
              </div>
            </div>

            <div className="h-[1px] w-full bg-[var(--ops-border-subtle)] relative overflow-hidden mb-8">
              <div
                className="absolute inset-y-0 left-0 bg-[var(--sp-accent)] transition-all duration-1000"
                style={{ width: drop.pressure }}
              />
            </div>

            <div className="relative pl-5 space-y-4 before:absolute before:left-[2px] before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-[var(--ops-border-subtle)]">
              {drop.timeline.map((entry, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-[19px] top-1.5 w-[5px] h-[5px] rounded-full border border-[var(--ops-bg-base)] ${
                    entry.severity === 'warning' ? 'bg-orange-400/80' : 'bg-[var(--ops-text-muted)]'
                  }`} />
                  <span className="text-[8px] font-mono text-[var(--ops-text-muted)] block">{entry.time}</span>
                  <p className="text-[10px] font-mono text-[var(--ops-text-secondary)] leading-relaxed">{entry.event}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--ops-border-subtle)] flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Manage Drop</span>
              <button className="text-[8px] font-mono text-white uppercase tracking-widest border-b border-white/20 pb-0.5">Open Orchestration</button>
            </div>
          </div>
        ))}
      </div>

      <section className="pt-12 border-t border-[var(--ops-border-subtle)] flex gap-24">
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Sync Authority</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Supabase / Sanity CMS</div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Next Scheduled</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Seasonal Lookbook 04 — 2026-05-15</div>
        </div>
      </section>
    </div>
  );
}

import React from "react";

export default function OpsDashboard() {
  return (
    <div className="space-y-16">
      {/* Narrative Header */}
      <section>
        <h1 className="font-display text-7xl uppercase tracking-tight leading-[0.85] text-white">
          Operational<br />Command Center
        </h1>
        <p className="mt-6 text-sm text-[var(--ops-text-secondary)] font-mono tracking-widest uppercase">
          System Status: Optimal / Active Brand: StreetPlayR
        </p>
      </section>

      {/* Orchestration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Active Drops - Horizontal Logic Readiness */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">
              Active Orchestration
            </h2>
            <span className="text-[10px] font-mono text-[var(--ops-text-secondary)]">
              2 Events Running
            </span>
          </div>
          
          <div className="space-y-4">
            {[
              { id: "d1", title: "Genesis Archive Drop", status: "Active", pressure: "88%", time: "02:14:55" },
              { id: "d2", title: "Seasonal Lookbook 04", status: "Pre-Launch", pressure: "12%", time: "18:44:12" }
            ].map((drop) => (
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
                    <div className="text-2xl font-mono text-white mb-1">{drop.pressure}</div>
                    <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Pressure</div>
                  </div>
                </div>
                
                <div className="mt-8 h-[1px] w-full bg-[var(--ops-border-subtle)] relative overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-[var(--sp-accent)] transition-all duration-1000" 
                    style={{ width: drop.pressure }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fulfillment Urgency - Vertical Narrative Readiness */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">
              Urgency Narrative
            </h2>
          </div>

          <div className="relative pl-6 space-y-12 before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--ops-border-subtle)]">
            {[
              { time: "10:04", title: "Batch 04 Fulfillment", desc: "128 items pending scanning", type: "high" },
              { time: "09:42", title: "Tier 1 Priority Shipping", desc: "Genesis members priority lock", type: "med" },
              { time: "08:15", title: "International Customs Sync", desc: "Global logistics handshake complete", type: "low" }
            ].map((event, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[27px] top-1.5 w-[7px] h-[7px] rounded-full bg-[var(--ops-text-muted)] border border-[var(--ops-bg-base)]" />
                <span className="text-[9px] font-mono text-[var(--ops-text-muted)] block mb-1">
                  {event.time}
                </span>
                <h4 className="text-sm font-mono uppercase tracking-wider text-white">
                  {event.title}
                </h4>
                <p className="text-[11px] text-[var(--ops-text-secondary)] mt-1 leading-relaxed">
                  {event.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Editorial Empty State Readiness (Mocked hidden) */}
      <section className="hidden pt-12 border-t border-[var(--ops-border-subtle)] text-center opacity-20">
         <div className="font-display text-4xl uppercase text-[var(--ops-text-muted)]">
           Quiet Orchestration
         </div>
         <p className="text-[10px] font-mono uppercase tracking-[0.2em] mt-2">
           No active anomalies detected
         </p>
      </section>
    </div>
  );
}

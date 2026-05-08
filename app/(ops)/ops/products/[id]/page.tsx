import React from "react";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  // Mocked state for orchestration logic
  const currentStatus = "Active Drop";
  const statuses = ["Draft", "Editorial Review", "Scheduled", "Reserved", "Active Drop", "Cooling", "Archived"];

  return (
    <div className="space-y-16">
      {/* Dossier Header */}
      <section className="flex flex-col xl:flex-row gap-12 items-start justify-between border-b border-[var(--ops-border-subtle)] pb-12">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="group relative">
              <span className="px-3 py-1 bg-[var(--sp-accent)]/10 border border-[var(--sp-accent)]/20 text-[var(--sp-accent)] text-[9px] font-mono uppercase tracking-[0.2em] cursor-pointer hover:bg-[var(--sp-accent)]/20 transition-all">
                {currentStatus}
              </span>
              {/* Intentional State Transition Overlay Readiness */}
              <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--ops-bg-elevated)] border border-[var(--ops-border-subtle)] shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 z-50 p-2">
                {statuses.map(status => (
                  <button key={status} className="w-full text-left px-3 py-2 text-[9px] font-mono uppercase tracking-widest text-[var(--ops-text-muted)] hover:text-white hover:bg-[var(--ops-bg-surface)] transition-colors">
                    Transition to {status}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
              ID: {id} / SK: SP-GNS-001
            </span>
          </div>
          <h1 className="font-display text-7xl sm:text-8xl uppercase tracking-tighter text-white leading-[0.85]">
            Genesis Archive<br />Hoodie
          </h1>
          <p className="max-w-xl text-[var(--ops-text-secondary)] text-sm leading-relaxed">
            Infrastructure-grade heavyweight fleece with modular utility fragments. 
            Part of the initial Genesis Release Cycle. Managed via Supabase Commerce Authority.
          </p>
        </div>

        <div className="w-full xl:w-auto flex flex-wrap gap-12">
          <div className="space-y-1">
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Global Pressure</div>
            <div className="text-5xl font-display text-white">88%</div>
            <div className="flex gap-1 mt-2">
               {[1,2,3,4,5].map(i => (
                 <div key={i} className={`h-0.5 w-4 ${i <= 4 ? 'bg-[var(--sp-accent)]' : 'bg-[var(--ops-border-subtle)]'}`} />
               ))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Allocation Contention</div>
            <div className="text-5xl font-display text-[var(--sp-error)] opacity-80">High</div>
            <p className="text-[8px] font-mono text-[var(--sp-error)] uppercase tracking-widest mt-2 animate-pulse">
              Fulfillment Lock Imminent
            </p>
          </div>
        </div>
      </section>

      {/* Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16">
        
        {/* Scarcity Intelligence */}
        <div className="space-y-16">
          
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">
                Scarcity Intelligence
              </h2>
              <div className="flex gap-4">
                 <button className="text-[9px] font-mono uppercase tracking-widest text-[var(--ops-text-secondary)] hover:text-white transition-colors">
                   Lock Reservations
                 </button>
                 <button className="text-[9px] font-mono uppercase tracking-widest text-[var(--sp-accent)] hover:opacity-70 transition-opacity">
                   Manual Allocation Shift
                 </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { size: "S", stock: 12, reserved: 4, pressure: "60%", status: "Stable" },
                { size: "M", stock: 0, reserved: 2, pressure: "100%", status: "Depleted" },
                { size: "L", stock: 45, reserved: 42, pressure: "94%", status: "Contention" },
                { size: "XL", stock: 18, reserved: 8, pressure: "45%", status: "Stable" },
              ].map((variant) => (
                <div key={variant.size} className="p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20 relative overflow-hidden group">
                  {/* Subtle pressure background */}
                  <div 
                    className="absolute inset-y-0 left-0 bg-[var(--sp-accent)]/5 transition-all duration-1000" 
                    style={{ width: variant.pressure }} 
                  />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <span className="font-display text-4xl text-white tracking-tighter">{variant.size}</span>
                      <span className={`text-[9px] font-mono uppercase tracking-widest ${
                        variant.status === 'Contention' ? 'text-orange-400' : 
                        variant.status === 'Depleted' ? 'text-[var(--sp-error)]' : 'text-[var(--ops-text-muted)]'
                      }`}>
                        {variant.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-1">Pool</div>
                        <div className="text-2xl font-mono text-white leading-none">{variant.stock}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-1">Reserved</div>
                        <div className="text-2xl font-mono text-[var(--ops-text-secondary)] leading-none">{variant.reserved}</div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-[var(--ops-border-subtle)] flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Pressure: {variant.pressure}</span>
                      <button className="text-[8px] font-mono text-white uppercase tracking-widest border-b border-white/20 pb-0.5">Adjust Pool</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Media Orchestration (Cinematic Sequencing) */}
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">
                Cinematic Release Sequencing
              </h2>
              <button className="text-[9px] font-mono uppercase tracking-widest text-[var(--ops-text-secondary)] hover:text-white transition-colors">
                Edit Narrative Sequence
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 h-auto sm:h-[400px]">
              {/* Primary Narrative Frame */}
              <div className="sm:col-span-3 bg-[var(--ops-bg-surface)] border border-[var(--ops-border-subtle)] flex items-center justify-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[var(--sp-accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="absolute top-4 left-4">
                   <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest bg-[var(--ops-bg-base)]/80 px-2 py-1">Role: Drop Hero Media</span>
                 </div>
                 <span className="relative z-10 text-[9px] font-mono text-[var(--ops-text-muted)] group-hover:text-white uppercase tracking-[0.3em] transition-colors">
                   Aesthetic Anchor Asset (Missing)
                 </span>
              </div>
              
              {/* Secondary Contextual Fragments */}
              <div className="flex flex-col gap-4">
                <div className="flex-1 bg-[var(--ops-bg-surface)] border border-[var(--ops-border-subtle)] flex flex-col items-center justify-center relative group">
                  <div className="absolute top-2 left-2">
                   <span className="text-[7px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest bg-[var(--ops-bg-base)]/80 px-1 py-0.5">Macro Detail</span>
                  </div>
                  <span className="text-[9px] font-mono text-[var(--ops-text-muted)] group-hover:text-white uppercase tracking-widest transition-colors mt-4">Hardware</span>
                </div>
                <div className="flex-1 bg-[var(--ops-bg-surface)] border border-[var(--ops-border-subtle)] flex flex-col items-center justify-center relative group">
                  <div className="absolute top-2 left-2">
                   <span className="text-[7px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest bg-[var(--ops-bg-base)]/80 px-1 py-0.5">Mobile Flow</span>
                  </div>
                  <span className="text-[9px] font-mono text-[var(--ops-text-muted)] group-hover:text-white uppercase tracking-widest transition-colors mt-4">9:16 Crop</span>
                </div>
                <div className="flex-1 bg-[var(--ops-bg-surface)] border border-[var(--ops-border-subtle)] flex flex-col items-center justify-center relative group opacity-50">
                  <div className="absolute top-2 left-2">
                   <span className="text-[7px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest bg-[var(--ops-bg-base)]/80 px-1 py-0.5">Lookbook Link</span>
                  </div>
                  <span className="text-[9px] font-mono text-[var(--ops-text-muted)] group-hover:text-white uppercase tracking-widest transition-colors mt-4">Unmapped</span>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Operational Narrative */}
        <div className="space-y-16">
          
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">
                Operational Event Stream
              </h2>
            </div>
            <div className="relative pl-6 space-y-10 before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--ops-border-subtle)]">
              {[
                { time: "10:14:22", event: "Allocation Contention", desc: "Reserved pool for Size L exceeded threshold → System flagging for manual review.", type: "system", user: "System" },
                { time: "10:04:05", event: "Fulfillment Lock Initiated", desc: "Batch 04 transmission active → 12 units locked for dispatch.", type: "fulfillment", user: "System" },
                { time: "09:42:18", event: "Manual Allocation Shift", desc: "12 units shifted from Active Pool → Reserved Pool due to priority sequence.", type: "inventory", user: "Operator JD" },
                { time: "08:15:00", event: "Editorial Authority Sync", desc: "Sanity CMS linkage confirmed → Lookbook 04 media mapping established.", type: "editorial", user: "System" },
              ].map((log, i) => (
                <div key={i} className="relative group">
                  <div className={`absolute -left-[27px] top-1.5 w-[7px] h-[7px] rounded-full border border-[var(--ops-bg-base)] ${
                    log.type === 'system' ? 'bg-[var(--sp-error)]/80' : 
                    log.type === 'inventory' ? 'bg-[var(--sp-accent)]' : 'bg-[var(--ops-text-muted)]'
                  }`} />
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono text-[var(--ops-text-muted)]">{log.time}</span>
                    <span className="text-[8px] font-mono text-[var(--ops-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest border border-[var(--ops-border-subtle)] px-2 py-0.5 rounded-sm">
                      {log.user}
                    </span>
                  </div>
                  <div className={`text-[11px] font-mono uppercase tracking-wider ${
                     log.type === 'system' ? 'text-[var(--sp-error)]/80' : 'text-white'
                  }`}>{log.event}</div>
                  <p className="text-[10px] text-[var(--ops-text-secondary)] mt-1.5 leading-relaxed font-mono">
                    {log.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Ecosystem Linkage */}
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">
                Operational Ecosystem
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Drop Container (Central Orchestration) */}
              <div className="p-6 border border-[var(--sp-accent)]/20 bg-[var(--sp-accent)]/5 group">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[8px] font-mono text-[var(--sp-accent)] uppercase tracking-widest mb-1 block">Release Container / Active</span>
                      <div className="text-xl font-display text-white group-hover:text-[var(--sp-accent)] transition-colors cursor-pointer">SP-D1-GENESIS</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Timing Engine</div>
                      <div className="text-sm font-mono text-white">02:14:55</div>
                    </div>
                 </div>
                 <div className="flex gap-6 mt-4 pt-4 border-t border-[var(--sp-accent)]/10">
                   <div className="text-[9px] font-mono"><span className="text-[var(--ops-text-muted)]">Pressure:</span> <span className="text-[var(--ops-text-secondary)]">High Contention</span></div>
                   <div className="text-[9px] font-mono"><span className="text-[var(--ops-text-muted)]">Allocation Logic:</span> <span className="text-[var(--ops-text-secondary)]">Strict Reservation</span></div>
                 </div>
              </div>

              {/* Campaign / Collection Linkage */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20 group cursor-pointer hover:border-white/20 transition-colors">
                  <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2 block">Editorial Grouping (Sanity)</span>
                  <div className="text-sm font-body text-[var(--ops-text-secondary)] group-hover:text-white transition-colors">Archive Sequence 01</div>
                </div>
                <div className="p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20 group cursor-pointer hover:border-white/20 transition-colors">
                  <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2 block">Campaign Linkage</span>
                  <div className="text-sm font-body text-[var(--ops-text-secondary)] group-hover:text-white transition-colors">Genesis v1 Initial Lookbook</div>
                </div>
              </div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}

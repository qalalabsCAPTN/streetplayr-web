import React from "react";
import Link from "next/link";

const MOCK_PRODUCTS = [
  { id: "p1", name: "Genesis Archive Hoodie", state: "Active Drop", inventory: "88%", price: "$220", campaign: "Genesis v1" },
  { id: "p2", name: "PlayR Utility Cargo", state: "Scheduled", inventory: "100%", price: "$350", campaign: "Lookbook 04" },
  { id: "p3", name: "Noir Technical Shell", state: "Editorial Review", inventory: "0%", price: "$550", campaign: "Stealth Tech" },
  { id: "p4", name: "Vanguard Cap", state: "Archived", inventory: "0%", price: "$85", campaign: "Launch 2025" },
];

const STATUS_COLORS: Record<string, string> = {
  "Active Drop": "text-[var(--sp-accent)]",
  "Scheduled": "text-blue-400",
  "Editorial Review": "text-yellow-400",
  "Archived": "text-[var(--ops-text-muted)]",
};

export default function ProductsPage() {
  return (
    <div className="space-y-12">
      <section className="flex items-end justify-between border-b border-[var(--ops-border-subtle)] pb-8">
        <div>
          <h1 className="font-display text-6xl uppercase tracking-tight text-white">
            Product Authority
          </h1>
          <p className="mt-4 text-[10px] font-mono text-[var(--ops-text-secondary)] uppercase tracking-[0.2em]">
            Release Orchestration Layer / 24 Managed Objects
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-mono text-white">88.2%</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Global Pressure</div>
          </div>
          <button className="px-6 py-2 bg-white text-black font-mono text-[10px] uppercase tracking-widest hover:bg-[var(--sp-cta-hover-bg)] transition-colors">
            Initiate Release
          </button>
        </div>
      </section>

      {/* Narrative List - Not a Spreadsheet */}
      <div className="space-y-4">
        {MOCK_PRODUCTS.map((product) => (
          <Link
            key={product.id}
            href={`/ops/products/${product.id}`}
            className="group block p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20 hover:bg-[var(--ops-bg-surface)]/40 transition-all duration-500"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
              <div className="md:col-span-2">
                <span className={`text-[9px] font-mono uppercase tracking-[0.2em] mb-2 block ${STATUS_COLORS[product.state]}`}>
                  {product.state}
                </span>
                <h3 className="text-3xl font-display uppercase tracking-tight text-white group-hover:pl-4 transition-all duration-700">
                  {product.name}
                </h3>
              </div>
              
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Campaign</div>
                <div className="text-sm font-body text-[var(--ops-text-secondary)]">{product.campaign}</div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-12">
                <div className="text-right">
                  <div className="text-xl font-mono text-white">{product.inventory}</div>
                  <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Allocation</div>
                </div>
                <div className="w-12 h-12 rounded-full border border-[var(--ops-border-subtle)] flex items-center justify-center group-hover:border-white transition-colors duration-500">
                  <div className="w-1.5 h-1.5 bg-white rounded-full group-hover:scale-150 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* System Intel */}
      <section className="pt-12 border-t border-[var(--ops-border-subtle)] flex gap-24">
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Sync Authority</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Supabase / Sanity CMS</div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Last Orchestration</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">10:04:32 AM</div>
        </div>
      </section>
    </div>
  );
}

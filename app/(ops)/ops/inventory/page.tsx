import React from "react";

const PRODUCTS = [
  {
    id: "p1",
    name: "Genesis Archive Hoodie",
    sku: "SP-GNS-001",
    variants: [
      { size: "S", stock: 12, reserved: 4, pressure: "60%", status: "Stable" as const },
      { size: "M", stock: 0, reserved: 2, pressure: "100%", status: "Depleted" as const },
      { size: "L", stock: 45, reserved: 42, pressure: "94%", status: "Contention" as const },
      { size: "XL", stock: 18, reserved: 8, pressure: "45%", status: "Stable" as const },
    ],
  },
  {
    id: "p2",
    name: "PlayR Utility Cargo",
    sku: "SP-PLR-002",
    variants: [
      { size: "S", stock: 30, reserved: 2, pressure: "10%", status: "Stable" as const },
      { size: "M", stock: 45, reserved: 5, pressure: "12%", status: "Stable" as const },
      { size: "L", stock: 38, reserved: 3, pressure: "8%", status: "Stable" as const },
      { size: "XL", stock: 22, reserved: 18, pressure: "82%", status: "Contention" as const },
    ],
  },
  {
    id: "p3",
    name: "Noir Technical Shell",
    sku: "SP-NTR-003",
    variants: [
      { size: "S", stock: 0, reserved: 0, pressure: "0%", status: "Depleted" as const },
      { size: "M", stock: 0, reserved: 0, pressure: "0%", status: "Depleted" as const },
      { size: "L", stock: 0, reserved: 0, pressure: "0%", status: "Depleted" as const },
      { size: "XL", stock: 0, reserved: 0, pressure: "0%", status: "Depleted" as const },
    ],
  },
  {
    id: "p4",
    name: "Vanguard Cap",
    sku: "SP-VNG-004",
    variants: [
      { size: "One", stock: 88, reserved: 12, pressure: "14%", status: "Stable" as const },
    ],
  },
];

const STATUS_VARIANTS: Record<string, string> = {
  Stable: "text-[var(--ops-text-muted)]",
  Contention: "text-orange-400",
  Depleted: "text-[var(--sp-error)]",
};

export default function InventoryPage() {
  const totalStock = PRODUCTS.reduce((s, p) => s + p.variants.reduce((v, vv) => v + vv.stock, 0), 0);
  const totalReserved = PRODUCTS.reduce((s, p) => s + p.variants.reduce((v, vv) => v + vv.reserved, 0), 0);
  const contentionCount = PRODUCTS.reduce((s, p) => s + p.variants.filter((v) => v.status === "Contention").length, 0);

  return (
    <div className="space-y-12">
      <section className="flex items-end justify-between border-b border-[var(--ops-border-subtle)] pb-8">
        <div>
          <h1 className="font-display text-6xl uppercase tracking-tight text-white">
            Inventory Authority
          </h1>
          <p className="mt-4 text-[10px] font-mono text-[var(--ops-text-secondary)] uppercase tracking-[0.2em]">
            Allocation Oversight / {PRODUCTS.length} Managed SKUs
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-xl font-mono text-white">{totalStock.toLocaleString()}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Total Pool</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono text-[var(--sp-accent)]">{totalReserved.toLocaleString()}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Reserved</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono text-orange-400">{contentionCount}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Contention Flags</div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {PRODUCTS.map((product) => (
          <div
            key={product.id}
            className="p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20 hover:bg-[var(--ops-bg-surface)]/40 transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-display uppercase tracking-tight text-white">
                  {product.name}
                </h3>
                <span className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                  SKU: {product.sku}
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono text-white">{product.variants.reduce((s, v) => s + v.stock, 0)}</div>
                <div className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Total Units</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {product.variants.map((variant) => (
                <div
                  key={variant.size}
                  className="p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-base)]/50 relative overflow-hidden group"
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-[var(--sp-accent)]/5 transition-all duration-1000"
                    style={{ width: variant.pressure }}
                  />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <span className="font-display text-3xl text-white tracking-tighter">{variant.size}</span>
                      <span className={`text-[8px] font-mono uppercase tracking-widest ${STATUS_VARIANTS[variant.status]}`}>
                        {variant.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Pool</div>
                        <div className="text-xl font-mono text-white">{variant.stock}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Reserved</div>
                        <div className="text-xl font-mono text-[var(--ops-text-secondary)]">{variant.reserved}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--ops-border-subtle)] opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[7px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                        Pressure: {variant.pressure}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <section className="pt-12 border-t border-[var(--ops-border-subtle)] flex gap-24">
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Inventory Engine</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Supabase / Reservation RPC</div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Last Reconciliation</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">10:04 AM — All pools verified</div>
        </div>
      </section>
    </div>
  );
}

import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";

interface VariantInfo {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
  reserved: number;
  status: "Stable" | "Contention" | "Depleted";
  pressure: string;
}

interface ProductStock {
  id: string;
  name: string;
  variants: VariantInfo[];
}

const STATUS_VARIANTS: Record<string, string> = {
  Stable: "text-[var(--ops-text-muted)]",
  Contention: "text-orange-400",
  Depleted: "text-[var(--sp-error)]",
};

async function getInventorySnapshot(): Promise<ProductStock[]> {
  try {
    const admin = createAdminClient();
    const { data: products } = await admin
      .from("products")
      .select(`
        id, name,
        variants:product_variants(
          id, size, color, stock_quantity
        )
      `)
      .order("name");

    const { data: reservations } = await admin
      .from("inventory_reservations")
      .select("variant_id, reserved_quantity")
      .in("reservation_state", ["pending", "held"]);

    const reservedMap: Record<string, number> = {};
    for (const r of reservations ?? []) {
      reservedMap[r.variant_id] = (reservedMap[r.variant_id] ?? 0) + (r.reserved_quantity ?? 0);
    }

    return (products ?? []).map((p: any): ProductStock => {
      const variants: VariantInfo[] = (p.variants ?? []).map((v: any) => {
        const stock = v.stock_quantity ?? 0;
        const reserved = reservedMap[v.id] ?? 0;
        const available = stock - reserved;
        let status: VariantInfo["status"];
        if (stock === 0) status = "Depleted";
        else if (available <= 0 || (reserved / stock) >= 0.8) status = "Contention";
        else status = "Stable";
        const pressure = stock > 0 ? Math.round((reserved / stock) * 100) + "%" : "0%";
        return { id: v.id, size: v.size, color: v.color, stock, reserved, status, pressure };
      });
      return { id: p.id, name: p.name, variants };
    });
  } catch {
    return [];
  }
}

export default async function InventoryPage() {
  const products = await getInventorySnapshot();
  const totalStock = products.reduce((s, p) => s + p.variants.reduce((v, vv) => v + vv.stock, 0), 0);
  const totalReserved = products.reduce((s, p) => s + p.variants.reduce((v, vv) => v + vv.reserved, 0), 0);
  const contentionCount = products.reduce((s, p) => s + p.variants.filter((v) => v.status === "Contention").length, 0);

  return (
    <div className="space-y-12">
      <section className="flex items-end justify-between border-b border-[var(--ops-border-subtle)] pb-8">
        <div>
          <h1 className="font-display text-6xl uppercase tracking-tight text-white">
            Inventory Authority
          </h1>
          <p className="mt-4 text-[10px] font-mono text-[var(--ops-text-secondary)] uppercase tracking-[0.2em]">
            Allocation Oversight / {products.length} Managed SKUs
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

      {products.length > 0 ? (
        <div className="space-y-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20 hover:bg-[var(--ops-bg-surface)]/40 transition-all duration-500"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-display uppercase tracking-tight text-white">
                    {product.name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono text-white">{product.variants.reduce((s, v) => s + v.stock, 0)}</div>
                  <div className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Total Units</div>
                </div>
              </div>

              {product.variants.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {product.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-base)]/50 relative overflow-hidden group"
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-[var(--sp-accent)]/5 transition-all duration-1000"
                        style={{ width: variant.pressure }}
                      />
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <span className="font-display text-3xl text-white tracking-tighter">
                            {variant.size || variant.color || "—"}
                          </span>
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
              ) : (
                <div className="flex h-[12vh] items-center justify-center border border-dashed border-[var(--ops-border-subtle)]">
                  <p className="text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                    No variants configured
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[40vh] items-center justify-center border border-dashed border-[var(--ops-border-subtle)]">
          <div className="text-center">
            <p className="font-mono text-[11px] text-[var(--ops-text-muted)] uppercase tracking-[0.2em]">
              No inventory data
            </p>
            <p className="mt-2 font-mono text-[10px] text-[var(--ops-text-muted)]">
              Products with variants will appear here.
            </p>
          </div>
        </div>
      )}

      <section className="pt-12 border-t border-[var(--ops-border-subtle)] flex gap-24">
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Inventory Engine</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Supabase / Reservation RPC</div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Last Reconciliation</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Real-time via Realtime subscriptions</div>
        </div>
      </section>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUS_COLORS: Record<string, string> = {
  "active": "text-[var(--sp-accent)]",
  "draft": "text-yellow-400",
  "archived": "text-[var(--ops-text-muted)]",
  "scheduled": "text-blue-400",
};

async function getProducts() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("products")
      .select("id, name, status, price, slug")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-12">
      <section className="flex items-end justify-between border-b border-[var(--ops-border-subtle)] pb-8">
        <div>
          <h1 className="font-display text-6xl uppercase tracking-tight text-white">
            Product Authority
          </h1>
          <p className="mt-4 text-[10px] font-mono text-[var(--ops-text-secondary)] uppercase tracking-[0.2em]">
            Release Orchestration Layer / {products.length} Objects
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="px-6 py-2 bg-white text-black font-mono text-[10px] uppercase tracking-widest hover:bg-[var(--sp-cta-hover-bg)] transition-colors">
            Initiate Release
          </button>
        </div>
      </section>

      {products.length > 0 ? (
        <div className="space-y-4">
          {products.map((product: any) => (
            <Link
              key={product.id}
              href={`/ops/products/${product.id}`}
              className="group block p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20 hover:bg-[var(--ops-bg-surface)]/40 transition-all duration-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className={`text-[9px] font-mono uppercase tracking-[0.2em] mb-2 block ${STATUS_COLORS[product.status] || "text-white/40"}`}>
                    {product.status || "unknown"}
                  </span>
                  <h3 className="text-3xl font-display uppercase tracking-tight text-white group-hover:pl-4 transition-all duration-700">
                    {product.name}
                  </h3>
                  {product.slug && (
                    <p className="mt-2 text-[10px] font-mono text-[var(--ops-text-muted)]">
                      /{product.slug}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-end gap-12">
                  <div className="text-right">
                    <div className="text-xl font-mono text-white">₹{product.price?.toLocaleString('en-IN') || '—'}</div>
                    <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Price</div>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-[var(--ops-border-subtle)] flex items-center justify-center group-hover:border-white transition-colors duration-500">
                    <div className="w-1.5 h-1.5 bg-white rounded-full group-hover:scale-150 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex h-[40vh] items-center justify-center border border-dashed border-[var(--ops-border-subtle)]">
          <div className="text-center">
            <p className="font-mono text-[11px] text-[var(--ops-text-muted)] uppercase tracking-[0.2em]">
              No products yet
            </p>
            <p className="mt-2 font-mono text-[10px] text-[var(--ops-text-muted)]">
              Products created in the CRM will appear here.
            </p>
          </div>
        </div>
      )}

      <section className="pt-12 border-t border-[var(--ops-border-subtle)] flex gap-24">
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Sync Authority</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Supabase</div>
        </div>
      </section>
    </div>
  );
}

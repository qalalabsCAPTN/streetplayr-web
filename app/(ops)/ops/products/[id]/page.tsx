import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { getProductEventsAction } from "@/app/actions/ops/products";
import { ProductActions } from "./ProductActions";

const STATUS_TRANSITIONS = ["draft", "editorial_review", "scheduled", "reserved", "active", "cooling", "archived"];

const STATUS_COLORS: Record<string, string> = {
  draft: "text-yellow-400",
  editorial_review: "text-blue-400",
  scheduled: "text-[var(--sp-accent)]/80",
  reserved: "text-orange-400",
  active: "text-[var(--sp-accent)]",
  cooling: "text-[var(--ops-text-muted)]",
  archived: "text-[var(--ops-text-muted)]/50",
};

async function getProduct(id: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("products")
      .select("id, name, slug, price, description, status, is_active, image_url, category:categories(name), variants:product_variants(id, color, size, stock_quantity, price_override)")
      .eq("id", id)
      .single();
    return data;
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const product = await getProduct(id);
  const events = await getProductEventsAction(id);

  if (!product) notFound();

  const status = product.status || "draft";
  const totalStock = (product.variants ?? []).reduce((s: number, v: any) => s + (v.stock_quantity ?? 0), 0);
  const variantCount = (product.variants ?? []).length;
  const activeVariants = (product.variants ?? []).filter((v: any) => (v.stock_quantity ?? 0) > 0);

  return (
    <div className="space-y-16">
      <section className="flex flex-col xl:flex-row gap-12 items-start justify-between border-b border-[var(--ops-border-subtle)] pb-12">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className={`px-3 py-1 bg-[var(--sp-accent)]/10 border border-[var(--sp-accent)]/20 text-[9px] font-mono uppercase tracking-[0.2em] ${STATUS_COLORS[status] || "text-white/40"}`}>
              {status}
            </span>
            <span className="text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
              ID: {id.slice(0, 8)}
              {product.slug && <> / {product.slug}</>}
            </span>
            {product.is_active !== null && (
              <span className={`text-[9px] font-mono uppercase tracking-widest ${product.is_active ? "text-green-400" : "text-red-400/60"}`}>
                {product.is_active ? "Published" : "Unpublished"}
              </span>
            )}
          </div>
          <h1 className="font-display text-7xl sm:text-8xl uppercase tracking-tighter text-white leading-[0.85]">
            {product.name || "Untitled"}
          </h1>
          {product.description && (
            <p className="max-w-xl text-[var(--ops-text-secondary)] text-sm leading-relaxed">
              {product.description}
            </p>
          )}
          <div className="flex gap-8 pt-4">
            <div className="space-y-1">
              <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Price</div>
              <div className="text-2xl font-mono text-white">₹{product.price?.toLocaleString('en-IN') || '—'}</div>
            </div>
            {product.category && (
              <div className="space-y-1">
                <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Category</div>
                <div className="text-2xl font-mono text-white">{(product.category as any)?.name || '—'}</div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full xl:w-auto flex flex-wrap gap-12">
          <div className="space-y-1">
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Total Stock</div>
            <div className="text-5xl font-display text-white">{totalStock}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Variants</div>
            <div className="text-5xl font-display text-white">{variantCount}</div>
            <p className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
              {activeVariants.length} active
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16">
        <div className="space-y-16">
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">
                Variant Intelligence
              </h2>
            </div>

            {variantCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(product.variants ?? []).map((variant: any) => (
                  <div key={variant.id} className="p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20 relative overflow-hidden group">
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <span className="font-display text-4xl text-white tracking-tighter">{variant.size || variant.color || '—'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-1">Stock</div>
                          <div className="text-2xl font-mono text-white leading-none">{variant.stock_quantity ?? 0}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-1">Color</div>
                          <div className="text-sm font-mono text-[var(--ops-text-secondary)] leading-none">{variant.color || '—'}</div>
                        </div>
                      </div>
                      <div className="mt-8 pt-6 border-t border-[var(--ops-border-subtle)] opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                          {variant.price_override ? `Price: ₹${variant.price_override}` : 'Default pricing'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[20vh] items-center justify-center border border-dashed border-[var(--ops-border-subtle)]">
                <p className="text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                  No variants configured
                </p>
              </div>
            )}
          </section>

          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">
                Event Timeline
              </h2>
              <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">{events.length} events</span>
            </div>
            {events.length > 0 ? (
              <div className="relative pl-5 space-y-4 before:absolute before:left-[2px] before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-[var(--ops-border-subtle)]">
                {events.slice(0, 20).map((e: any, i: number) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[19px] top-1.5 w-[5px] h-[5px] rounded-full border border-[var(--ops-bg-base)] ${
                      e.severity === 'error' ? 'bg-red-400/80' :
                      e.severity === 'warning' ? 'bg-orange-400/80' : 'bg-[var(--ops-text-muted)]'
                    }`} />
                    <span className="text-[8px] font-mono text-[var(--ops-text-muted)] block">
                      {new Date(e.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <p className="text-[10px] font-mono text-[var(--ops-text-secondary)] leading-relaxed">{e.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[10vh] items-center justify-center border border-dashed border-[var(--ops-border-subtle)]">
                <p className="text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">No events recorded</p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-16">
          <ProductActions productId={id} currentStatus={status} isActive={product.is_active ?? false} />

          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">
                Product Metadata
              </h2>
            </div>

            <div className="space-y-2 text-[10px] font-mono text-[var(--ops-text-secondary)]">
              <p>ID: {id}</p>
              {product.slug && <p>Slug: {product.slug}</p>}
              <p>Created: —</p>
              <p>Updated: —</p>
            </div>
          </section>

          <section className="pt-8 border-t border-[var(--ops-border-subtle)]">
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2">
              Data Authority
            </div>
            <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">
              Supabase Commerce Authority
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

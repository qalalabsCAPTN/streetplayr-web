"use client";

/**
 * ProductStageBestSellers
 *
 * EXPERIMENTAL section wrapper — isolated behind USE_PREMIUM_CAROUSEL flag.
 *
 * This component is a drop-in wrapper used ONLY by the homepage's
 * BestSellersGate (see below). The original BestSellers.tsx is
 * completely untouched.
 *
 * Accepts the same `products` shape used by the original BestSellers
 * section so zero data changes are needed at the call-site.
 */

import Link from "next/link";
import PremiumCoverflowCarousel from "@/components/ui/PremiumCoverflowCarousel";
import type { PremiumCarouselProduct } from "@/components/ui/PremiumCoverflowCard";

// ─── Props — intentionally compatible with BestSellers' product shape ─────────
//
// We use `PremiumCarouselProduct` which is a superset; any field that
// the original `Product` interface has is also present here so the
// parent page can pass the same data array without modification.

interface ProductStageBestSellersProps {
  products: PremiumCarouselProduct[];
}

export default function ProductStageBestSellers({
  products,
}: ProductStageBestSellersProps) {
  if (!products.length) return null;

  return (
    <section className="py-12 md:py-20 w-full max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6">
      {/* ── Section header ── */}
      <div className="flex justify-between items-end mb-8 md:mb-12">
        <div>
          <span
            className="font-mono text-[10px] tracking-[0.28em] uppercase block mb-2"
            style={{ color: "rgba(234,223,237,0.42)" }}
          >
            Most Wanted
          </span>
          <h2
            className="font-display uppercase leading-[0.9]"
            style={{
              fontSize: "clamp(36px, 7vw, 72px)",
              color: "#eadfed",
              letterSpacing: "0.015em",
            }}
          >
            Best Sellers
          </h2>
        </div>

        <Link
          href="/collections"
          className="font-mono text-[10px] tracking-[0.24em] uppercase hidden md:block"
          style={{ color: "rgba(234,223,237,0.48)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "#eadfed";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color =
              "rgba(234,223,237,0.48)";
          }}
        >
          View All →
        </Link>
      </div>

      {/* ── Premium 3-D coverflow ── */}
      <PremiumCoverflowCarousel products={products} />

      {/* ── Mobile View All ── */}
      <div className="mt-8 flex justify-center md:hidden">
        <Link
          href="/collections"
          className="font-mono text-[10px] tracking-[0.24em] uppercase"
          style={{
            color: "rgba(234,223,237,0.48)",
            border: "1px solid rgba(255,255,255,0.10)",
            padding: "10px 20px",
            borderRadius: 8,
            display: "inline-block",
          }}
        >
          View All →
        </Link>
      </div>
    </section>
  );
}

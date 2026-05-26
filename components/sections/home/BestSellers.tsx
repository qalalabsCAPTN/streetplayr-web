"use client";

import Link from "next/link";
import CoverflowCarousel, {
  CarouselProduct,
} from "@/components/ui/CoverflowCarousel";

interface BestSellersProps {
  products: CarouselProduct[];
}

export default function BestSellers({ products }: BestSellersProps) {
  if (!products.length) return null;

  return (
    <section className="py-12 md:py-20 w-full max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6">
      {/* ── Section Header ── */}
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
          className="font-mono text-[10px] tracking-[0.24em] uppercase transition-colors hidden md:block"
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

      {/* ── Coverflow Carousel (all breakpoints) ── */}
      <CoverflowCarousel products={products} />

      {/* ── Mobile "View All" CTA ── */}
      <div className="mt-8 flex justify-center md:hidden">
        <Link
          href="/collections"
          className="font-mono text-[10px] tracking-[0.24em] uppercase"
          style={{
            color: "rgba(234,223,237,0.48)",
            border: "1px solid rgba(255,255,255,0.1)",
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

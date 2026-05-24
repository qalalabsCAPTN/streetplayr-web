"use client";

import Link from "next/link";
import { LOCAL_PRODUCTS } from "@/lib/products/data";

export default function RecommendedProducts({ currentSlug }: { currentSlug: string }) {
  const related = LOCAL_PRODUCTS.filter((p) => p.slug !== currentSlug).slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="w-full max-w-[min(98vw,2560px)] mx-auto px-4 md:px-8 lg:px-12 py-20 border-t border-white/[0.06]">
      <div className="mb-10">
        <h2 className="font-display text-[28px] md:text-[42px] uppercase leading-[0.92] text-[#eadfed]">
          You May Also Like
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[rgba(234,223,237,0.62)] font-medium mt-2">
          
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {related.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="group relative border border-white/[0.10] bg-[#1f1a23] transition-all duration-300 hover:border-white/[0.20] rounded-xl overflow-hidden"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-[#211c26]">
              <img
                src={product.metadata.gallery_images[0]}
                alt={product.name}
                className="w-full h-full object-cover saturate-[0.92] transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </div>
            <div className="p-5 border-t border-white/[0.08]">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 mr-4">
                  <p className="font-mono text-[10px] tracking-[0.22em] text-[rgba(234,223,237,0.65)] font-medium uppercase truncate">
                    {product.category.name}
                  </p>
                  <h3 className="font-display text-xl uppercase mt-1.5 leading-tight text-[#eadfed]">
                    {product.name}
                  </h3>
                </div>
                <span className="font-mono text-[11px] tracking-[0.16em] text-[rgba(234,223,237,0.78)] font-medium whitespace-nowrap flex-shrink-0">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-end">
                <span className="font-mono text-[9px] tracking-[0.22em] uppercase font-medium text-[rgba(234,223,237,0.52)] group-hover:text-[rgba(234,223,237,0.82)] transition-colors duration-300">
                  View Product →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

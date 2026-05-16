"use client";

import Link from "next/link";

interface Product {
  id: string | number;
  name: string;
  price: string | number;
  image: string;
  slug?: string;
}

interface BestSellersProps {
  products: Product[];
}

export default function BestSellers({ products }: BestSellersProps) {
  const best = products.slice(0, 3);

  return (
    <section className="py-24 px-4 md:px-16 max-w-[1440px] mx-auto">
      <div className="flex justify-between items-end mb-12 border-l-4 border-[var(--sp-accent)] pl-6">
        <div>
          <span className="font-hud text-[var(--sp-accent)] block mb-2">TOP_RATED_V1.0</span>
          <h2 className="font-display text-[42px] md:text-[64px] uppercase leading-none" style={{ fontFamily: "'Anton', sans-serif" }}>
            Best Sellers
          </h2>
        </div>
        <Link href="/collections" className="font-hud text-[var(--sp-text-secondary)] hover:text-[var(--sp-accent)] transition-colors hidden md:block">
          [ VIEW_ALL ]
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {best.map((product, i) => (
          <Link
            key={product.id}
            href={product.slug ? `/product/${product.slug}` : "/collections"}
            className="group relative aspect-[4/5] bg-[var(--sp-bg-elevated)] overflow-hidden border border-[var(--sp-border-subtle)]"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent p-8 flex flex-col justify-end">
              <span className="font-hud text-[var(--sp-accent-2)] mb-2">
                BEST_SELLER_0{i + 1}
              </span>
              <h3 className="font-display text-[28px] text-white uppercase" style={{ fontFamily: "'Anton', sans-serif" }}>
                {product.name}
              </h3>
              <div className="flex justify-between items-center mt-3">
                <span className="font-hud text-[var(--sp-accent)]">
                  {typeof product.price === "number" ? `Rs. ${product.price}` : product.price}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

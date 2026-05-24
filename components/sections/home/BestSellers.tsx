"use client";

import { useState } from "react";
import Link from "next/link";
import ProductCarousel from "@/components/ui/ProductCarousel";

interface Product {
  id: string | number;
  name: string;
  price: string | number;
  image: string;
  image2?: string;
  slug?: string;
  category?: string;
}

interface BestSellersProps {
  products: Product[];
}

function BestSellerCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={product.slug ? `/product/${product.slug}` : "/collections"}
      className="group relative aspect-[3/4] bg-[#231e27] overflow-hidden border border-white/[0.10] shadow-[0_22px_70px_rgba(12,6,18,0.30)] rounded-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={product.image}
        alt={product.name}
        className="absolute inset-0 w-full h-full object-cover saturate-[0.92] transition-all duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          opacity: isHovered && product.image2 ? 0 : 1,
          transform: isHovered ? "scale(1.025)" : "scale(1)",
        }}
      />

      {product.image2 && (
        <div
          className="absolute inset-0 transition-opacity duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          <img
            src={product.image2}
            alt={`${product.name} Alternate View`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-[#16111b]/90 via-[#16111b]/15 to-transparent p-5 flex flex-col justify-end">
        <h3 className="font-display text-[24px] md:text-[28px] text-[#eadfed] uppercase leading-none">
          {product.name}
        </h3>
        <div className="flex justify-between items-center mt-2">
          <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[rgba(234,223,237,0.64)]">
            {typeof product.price === "number" ? `Rs. ${product.price}` : product.price}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BestSellers({ products }: BestSellersProps) {
  const topProducts = products.slice(0, 4);

  return (
    <section className="py-10 md:py-14 px-4 md:px-8 lg:px-12 w-full max-w-none">
      <div className="flex justify-between items-end mb-5 md:mb-6">
        <h2 className="font-display text-[38px] md:text-[56px] uppercase leading-[0.92] text-[#eadfed]">
          Best Sellers
        </h2>
        <Link href="/collections" className="font-mono text-[10px] tracking-[0.24em] uppercase text-[rgba(234,223,237,0.52)] hover:text-[#eadfed] transition-colors hidden md:block">
          View All
        </Link>
      </div>

      <div className="md:hidden">
        <ProductCarousel products={products} />
      </div>

      <div className="hidden md:grid md:grid-cols-4 gap-4 lg:gap-5">
        {topProducts.map((product) => (
          <BestSellerCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

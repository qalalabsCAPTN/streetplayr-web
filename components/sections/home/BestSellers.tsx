"use client";

import Link from "next/link";
import ProductCarousel from "@/components/ui/ProductCarousel";

interface Product {
  id: string | number;
  name: string;
  price: string | number;
  image: string;
  slug?: string;
  category?: string;
}

interface BestSellersProps {
  products: Product[];
}

export default function BestSellers({ products }: BestSellersProps) {

  return (
    <section className="py-28 px-4 md:px-16 max-w-[1440px] mx-auto">
      <div className="flex justify-between items-end mb-10 md:mb-14">
        <div>
          <h2 className="font-display text-[42px] md:text-[64px] uppercase leading-[0.92] text-[#eadfed]">
            Best Sellers
          </h2>
        </div>
        <Link href="/collections" className="font-mono text-[10px] tracking-[0.24em] uppercase text-[rgba(234,223,237,0.52)] hover:text-[#eadfed] transition-colors hidden md:block">
          View All
        </Link>
      </div>

      {/* Mobile carousel */}
      <div className="md:hidden">
        <ProductCarousel products={products} />
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-8">
        {products.map((product) => (
          <Link
            key={product.id}
            href={product.slug ? `/product/${product.slug}` : "/collections"}
            className="group relative aspect-[4/5] bg-[#231e27] overflow-hidden border border-white/[0.10] shadow-[0_22px_70px_rgba(12,6,18,0.30)]"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover saturate-[0.92] transition-transform duration-700 group-hover:scale-[1.025] group-hover:saturate-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#16111b]/90 via-[#16111b]/15 to-transparent p-8 flex flex-col justify-end">
              <h3 className="font-display text-[28px] text-[#eadfed] uppercase leading-none">
                {product.name}
              </h3>
              <div className="flex justify-between items-center mt-3">
                <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[rgba(234,223,237,0.64)]">
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

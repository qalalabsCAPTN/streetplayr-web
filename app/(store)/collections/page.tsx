"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryFilter from "@/components/sections/collections/CategoryFilter";
import { LOCAL_PRODUCTS } from "@/lib/products/data";

function CollectionsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get("category")?.toUpperCase() || "ALL";
  const validCategories = ["ALL", "TEES", "TANKS", "PANTS", "HOODIES", "OUTERWEAR"];
  const [activeFilter, setActiveFilter] = useState(
    validCategories.includes(initialCategory) ? initialCategory : "ALL"
  );

  const [tappedId, setTappedId] = useState<string | null>(null);

  const products = LOCAL_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category.name,
    price: `Rs. ${p.price.toLocaleString("en-IN")}`,
    image: p.metadata.gallery_images[0],
    altImage: p.metadata.gallery_images[1],
    badge: p.price >= 3000 ? "Premium" : "New",
    slug: p.slug,
  }));

  const filteredProducts =
    activeFilter === "ALL"
      ? products
      : products.filter((p) => p.category === activeFilter);

  const handleFilterChange = (category: string) => {
    setActiveFilter(category);
    const params = new URLSearchParams(searchParams.toString());
    if (category === "ALL") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    const qs = params.toString();
    router.replace(qs ? `/collections?${qs}` : "/collections", { scroll: false });
  };

  return (
    <div className="min-h-screen bg-transparent text-[#eadfed] selection:bg-[#ddb7ff] selection:text-[#16111b] relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.25)_0%,transparent_10%,transparent_90%,rgba(0,0,0,0.25)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(221,183,255,0.05)_0%,transparent_55%)]" />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,87,26,0.03)_0%,transparent_60%)]" />
      <div className="fixed left-0 top-0 bottom-0 w-px bg-white/[0.04] z-20 pointer-events-none" />
      <div className="fixed left-0 top-0 bottom-0 w-px bg-white/[0.02] translate-x-[7px] z-20 pointer-events-none" />
      <style>{`
        @media (hover: hover) {
          .product-card:hover .alt-face {
            opacity: 1;
          }
        }
      `}</style>

      <Navbar />

      <section className="relative z-[1] w-full h-[460px] overflow-hidden border-b border-white/[0.10] mt-20">
        <img
          alt="Collection visual"
          src={products[0]?.image || "/assets/hero-tees.png"}
          className="absolute inset-0 w-full h-full object-cover opacity-60 saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#16111b] via-[#16111b]/25 to-[#16111b]/55" />
        <div className="absolute inset-0 bg-[radial-gradient(700px_360px_at_18%_10%,rgba(221,183,255,0.13),transparent_62%),radial-gradient(560px_340px_at_86%_82%,rgba(255,87,26,0.10),transparent_64%)]" />
        <div className="absolute inset-0 flex items-end justify-start px-4 md:px-8 lg:px-12 pb-14">
          <div className="max-w-[760px]">

            <h1 className="font-display text-[clamp(56px,8vw,128px)] uppercase leading-[0.88] text-[#eadfed]">
              Current Release
            </h1>
          </div>
        </div>
      </section>

      <main className="relative z-[1] pb-20 w-full max-w-[min(98vw,2560px)] mx-auto px-4 md:px-8 lg:px-12 pt-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/[0.06] pb-8">
          <h2 className="font-display text-[42px] md:text-[64px] uppercase leading-[0.92] tracking-tight text-[#eadfed]">
            The Archive
          </h2>
          <div className="flex-shrink-0">
            <CategoryFilter activeCategory={activeFilter} onSelect={handleFilterChange} />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/25">
              No products in this category
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={product.slug ? `/product/${product.slug}` : "/collections"}
                className="group product-card relative border border-white/[0.10] bg-[#1f1a23] rounded-xl overflow-hidden transition-all duration-300 hover:border-white/[0.20]"
              >
                {product.badge && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1.5 font-mono text-[9px] tracking-[0.22em] uppercase bg-[#16111b]/70 text-[rgba(234,223,237,0.7)] border border-white/[0.08]">
                      {product.badge}
                    </span>
                  </div>
                )}

                <div
                  className="relative aspect-[4/5] overflow-hidden bg-[#211c26]"
                  onClick={(e) => {
                    if (window.innerWidth >= 768) return;
                    if (tappedId !== product.id && product.altImage) {
                      e.stopPropagation();
                      setTappedId(product.id);
                    }
                  }}
                >
                  <img
                    alt={product.name}
                    src={product.image}
                    className={`w-full h-full object-cover saturate-[0.92] transition-all duration-700 ${
                      tappedId === product.id && product.altImage ? 'opacity-0' : ''
                    } md:group-hover:opacity-0`}
                  />

                  {product.altImage && (
                    <div className={`alt-face absolute inset-0 transition-opacity duration-500 ${
                      tappedId === product.id ? 'opacity-100' : 'opacity-0'
                    } md:opacity-0 md:group-hover:opacity-100`}
                    >
                      <img
                        alt={`${product.name} detail`}
                        src={product.altImage}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="p-5 border-t border-white/[0.08]">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 mr-4">
                      <p className="font-mono text-[10px] tracking-[0.22em] text-[rgba(234,223,237,0.45)] uppercase truncate">
                        {product.category}
                      </p>
                      <h3 className="font-display text-xl uppercase mt-1.5 leading-tight text-[#eadfed]">
                        {product.name}
                      </h3>
                    </div>
                    <span className="font-mono text-[11px] tracking-[0.16em] text-[rgba(234,223,237,0.6)] whitespace-nowrap flex-shrink-0">
                      {product.price}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-[rgba(234,223,237,0.3)] group-hover:text-[rgba(234,223,237,0.6)] transition-colors duration-300">
                      View Product →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense>
      <CollectionsInner />
    </Suspense>
  );
}

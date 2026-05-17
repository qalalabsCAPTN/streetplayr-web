"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ProtoCoreCollection() {
  const [activeFilter, setActiveFilter] = useState("all");

  const products = [
    {
      id: 1,
      name: "Triple Tee Set",
      model: "Essential",
      price: "Rs. 1,499",
      image: "/assets/hero-tees.png",
      altImage: "/assets/polo-editorial.png",
      badge: "New",
      altIsImage: true,
      filter: "tops",
      slug: "triple-tee-set",
    },
    {
      id: 2,
      name: "Court Polo Pack",
      model: "Outerwear",
      price: "Rs. 1,799",
      image: "/assets/polo-editorial.png",
      altImage: "/assets/hero-tees.png",
      badge: null,
      altIsImage: true,
      filter: "outer",
      slug: "court-polo-pack",
    },
    {
      id: 3,
      name: "Run Short",
      model: "Bottoms",
      price: "Rs. 999",
      image: "/assets/run-shorts.jpeg",
      altImage: "/assets/srh-jersey.jpg",
      badge: "Drop",
      altIsImage: true,
      filter: "bottoms",
      slug: "run-short",
    },
    {
      id: 4,
      name: "Waffle Tee",
      model: "Essential",
      price: "Rs. 1,299",
      image: "/assets/hero-tees.png",
      altImage: "/assets/run-shorts.jpeg",
      badge: null,
      altIsImage: true,
      filter: "tops",
      slug: "waffle-tee",
    },
    {
      id: 5,
      name: "Tech Jersey",
      model: "Performance",
      price: "Rs. 1,999",
      image: "/assets/srh-jersey.jpg",
      altImage: "/assets/polo-editorial.png",
      badge: "Limited",
      altIsImage: true,
      filter: "outer",
      slug: "tech-jersey",
    },
    {
      id: 6,
      name: "Miles Short",
      model: "Bottoms",
      price: "Rs. 999",
      image: "/assets/run-shorts.jpeg",
      altImage: "/assets/hero-tees.png",
      badge: null,
      altIsImage: true,
      filter: "bottoms",
      slug: "miles-short",
    },
  ];

  const filteredProducts =
    activeFilter === "all"
      ? products
      : products.filter((p) => p.filter === activeFilter);

  return (
    <div className="min-h-screen bg-[#16111b] text-[#eadfed] selection:bg-[#ddb7ff] selection:text-[#16111b] relative overflow-hidden">
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
        .product-card:hover .alt-face {
          opacity: 1;
        }
      `}</style>

      <Navbar />

      <section className="relative z-[1] w-full h-[460px] overflow-hidden border-b border-white/[0.10] mt-20">
        <img
          alt="Collection visual"
          src="/assets/hero-tees.png"
          className="absolute inset-0 w-full h-full object-cover opacity-60 saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#16111b] via-[#16111b]/25 to-[#16111b]/55" />
        <div className="absolute inset-0 bg-[radial-gradient(700px_360px_at_18%_10%,rgba(221,183,255,0.13),transparent_62%),radial-gradient(560px_340px_at_86%_82%,rgba(255,87,26,0.10),transparent_64%)]" />
        <div className="absolute inset-0 flex items-end justify-start px-4 md:px-16 pb-14">
          <div className="max-w-[760px]">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ff3b30] animate-pulse shadow-[0_0_6px_rgba(255,59,48,0.5)]" />
                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[rgba(234,223,237,0.3)]">LIVE</span>
              </span>
              <span className="w-px h-3 bg-white/[0.08]" />
              <span className="font-mono text-[10px] tracking-[0.28em] text-[rgba(234,223,237,0.52)] uppercase">Drop 001</span>
            </div>
            <h1 className="font-display text-[clamp(56px,8vw,128px)] uppercase leading-[0.88] text-[#eadfed]">
              Current Release
            </h1>
          </div>
        </div>
      </section>

      <main className="relative z-[1] pb-24 w-full max-w-[1440px] mx-auto px-4 md:px-16 pt-14">
        <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h2 className="font-display text-[42px] md:text-[64px] uppercase leading-[0.92] tracking-tight text-[#eadfed]">
              The Archive
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["all", "tops", "outer", "bottoms"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 font-mono text-[10px] tracking-[0.22em] uppercase transition-colors duration-200 border rounded-none ${
                  activeFilter === filter
                    ? "bg-[#eadfed] border-[#eadfed] text-[#16111b]"
                    : "border-white/[0.10] text-[rgba(234,223,237,0.52)] hover:border-white/[0.24] hover:text-[#eadfed] hover:bg-white/[0.06]"
                }`}
              >
                {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={product.slug ? `/product/${product.slug}` : "/collections"}
              className="group product-card relative border border-white/[0.10] bg-[#1f1a23] transition-all duration-300 hover:border-white/[0.20]"
            >
              {product.badge && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1.5 font-mono text-[9px] tracking-[0.22em] uppercase bg-[#16111b]/70 text-[rgba(234,223,237,0.7)] border border-white/[0.08]">
                    {product.badge}
                  </span>
                </div>
              )}

              <div className="relative aspect-[4/5] overflow-hidden bg-[#211c26]">
                <img
                  alt={product.name}
                  src={product.image}
                  className="w-full h-full object-cover saturate-[0.92] transition-all duration-700 group-hover:opacity-0"
                />

                {/* Alt Face — image crossfade on hover */}
                {product.altImage && (
                  <div className="alt-face absolute inset-0 opacity-0 transition-opacity duration-500">
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
                      {product.model}
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

        <div className="mt-20 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 border border-white/[0.10] flex items-center justify-center hover:bg-white/[0.06] group transition-colors rounded-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40 group-hover:text-white/70 transition-colors">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="font-mono text-[10px] tracking-[0.22em] flex items-center gap-3 text-white/45">
              <span className="font-mono text-[10px] tracking-[0.25em] text-white/25">[</span>
              <span className="text-white/70">01</span>
              <span className="opacity-30">/</span>
              <span className="hover:text-white/70 transition-colors cursor-pointer">02</span>
              <span className="opacity-30">/</span>
              <span className="hover:text-white/70 transition-colors cursor-pointer">03</span>
              <span className="font-mono text-[10px] tracking-[0.25em] text-white/25">]</span>
            </div>
            <button className="w-10 h-10 border border-white/[0.10] flex items-center justify-center hover:bg-white/[0.06] group transition-colors rounded-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40 group-hover:text-white/70 transition-colors">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

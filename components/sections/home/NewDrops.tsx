"use client";

import Image from "next/image";
import Link from "next/link";

interface Product {
  id: string | number;
  name: string;
  price: string | number;
  image: string;
  category: string;
  slug?: string;
}

interface NewDropsProps {
  products: Product[];
}

export default function NewDrops({ products }: NewDropsProps) {
  const drops = products.slice(0, 5);

  return (
    <section className="py-24 px-4 md:px-16 max-w-[1440px] mx-auto">
      <div className="flex justify-between items-end mb-12 border-l-4 border-[var(--sp-accent)] pl-6">
        <div>
          <span className="font-hud text-[var(--sp-accent)] block mb-2">COLLECTION_V2.04</span>
          <h2 className="font-display text-[42px] md:text-[64px] uppercase leading-none" style={{ fontFamily: "'Anton', sans-serif" }}>Featured Drops</h2>
        </div>
        <Link href="/collections" className="font-hud text-[var(--sp-text-secondary)] hover:text-[var(--sp-accent)] transition-colors hidden md:block">
          [ VIEW_ALL_ARCHIVE ]
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Large Card — first product */}
        {drops[0] && (
          <Link href={drops[0].slug ? `/product/${drops[0].slug}` : "/collections"} className="md:col-span-8 group relative aspect-video bg-[var(--sp-bg-elevated)] overflow-hidden border border-[var(--sp-border-subtle)]">
            <Image
              src={drops[0].image}
              alt={drops[0].name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105 group-hover:opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent p-8 flex flex-col justify-end">
              <span className="font-hud text-[var(--sp-accent-2)] mb-2">DROP_01 // {drops[0].category.toUpperCase()}</span>
              <h3 className="font-display text-[42px] text-white uppercase" style={{ fontFamily: "'Anton', sans-serif" }}>{drops[0].name}</h3>
              <div className="flex justify-between items-center mt-4">
                <span className="font-hud text-[var(--sp-accent)]">Rs. {drops[0].price}</span>
                <span className="bg-white text-black px-6 py-2 font-bold text-[14px] tracking-[0.05em] uppercase hover:bg-[var(--sp-accent-2)] transition-colors">
                  Pre-Order
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Vertical Card — second product */}
        {drops[1] && (
          <Link href={drops[1].slug ? `/product/${drops[1].slug}` : "/collections"} className="md:col-span-4 group relative aspect-[4/5] bg-[var(--sp-bg-elevated)] overflow-hidden border border-[var(--sp-border-subtle)]">
            <Image
              src={drops[1].image}
              alt={drops[1].name}
              fill
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              <div className="flex justify-end">
                <span className="font-hud border border-[var(--sp-accent-2)] text-[var(--sp-accent-2)] px-2">LIMITED</span>
              </div>
              <div>
                <span className="font-hud text-[var(--sp-accent-2)] mb-2 block">DROP_02 // {drops[1].category.toUpperCase()}</span>
                <h3 className="font-display text-[32px] text-white uppercase" style={{ fontFamily: "'Anton', sans-serif" }}>{drops[1].name}</h3>
                <p className="font-hud text-[var(--sp-text-muted)] text-[10px] mt-2">CALIBRATED_FOR_THE_STREETS</p>
              </div>
            </div>
          </Link>
        )}

        {/* Small Cards Row — remaining products */}
        {drops.slice(2).map((product, i) => (
          <Link
            key={product.id}
            href={product.slug ? `/product/${product.slug}` : "/collections"}
            className={`md:col-span-4 group relative aspect-square bg-[var(--sp-bg-elevated)] overflow-hidden border border-[var(--sp-border-subtle)]`}
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            />
            <div className="absolute bottom-6 left-6">
              <span className="font-hud text-[var(--sp-accent)]">DROP_0{i + 3} // {product.category.toUpperCase()}</span>
              <h3 className="font-display text-[24px] text-white uppercase" style={{ fontFamily: "'Anton', sans-serif" }}>{product.name}</h3>
            </div>
          </Link>
        ))}

        {/* Unlock card */}
        <div className="md:col-span-4 flex flex-col justify-center items-center border border-dashed border-[var(--sp-border-subtle)] p-8 text-center bg-[var(--sp-bg-surface)] hover:bg-[var(--sp-bg-elevated)] transition-colors group cursor-pointer aspect-square">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--sp-accent)] mb-4">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <h3 className="font-display text-[24px] text-white uppercase" style={{ fontFamily: "'Anton', sans-serif" }}>Unlock Next Drop</h3>
          <p className="font-hud text-[var(--sp-text-muted)] text-[10px] mt-2">STAKE_500_POINTS_TO_PREVIEW</p>
          <div className="mt-6 w-full h-1 bg-[var(--sp-border-subtle)] relative overflow-hidden rounded-full">
            <div className="absolute left-0 top-0 h-full bg-[var(--sp-accent)] w-2/3 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

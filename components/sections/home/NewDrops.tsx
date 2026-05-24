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
    <section className="py-24 px-4 md:px-8 lg:px-12 w-full max-w-[min(98vw,2560px)] mx-auto">
      <div className="flex justify-between items-end mb-14">
        <div>
          <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-[rgba(234,223,237,0.52)] block mb-3">Current Release</span>
          <h2 className="font-display text-[42px] md:text-[64px] uppercase leading-[0.92] text-[#eadfed]">Featured Drops</h2>
        </div>
        <Link href="/collections" className="font-mono text-[10px] tracking-[0.24em] uppercase text-[rgba(234,223,237,0.52)] hover:text-[#eadfed] transition-colors hidden md:block">
          View Archive
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Large Card — first product */}
        {drops[0] && (
          <Link href={drops[0].slug ? `/product/${drops[0].slug}` : "/collections"} className="md:col-span-8 group relative aspect-video bg-[#231e27] overflow-hidden border border-white/[0.10] shadow-[0_22px_70px_rgba(12,6,18,0.30)] rounded-xl">
            <Image
              src={drops[0].image}
              alt={drops[0].name}
              fill
              className="object-cover saturate-[0.92] transition-transform duration-700 group-hover:scale-[1.025] group-hover:saturate-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#16111b]/90 via-[#16111b]/15 to-transparent p-8 flex flex-col justify-end">
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[rgba(234,223,237,0.54)] mb-2">Drop 01 / {drops[0].category}</span>
              <h3 className="font-display text-[42px] text-[#eadfed] uppercase leading-none">{drops[0].name}</h3>
              <div className="flex justify-between items-center mt-4">
                <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-white/62">Rs. {drops[0].price}</span>
                <span className="bg-[#eadfed] text-[#16111b] px-6 py-2 font-mono font-bold text-[10px] tracking-[0.22em] uppercase hover:bg-[#ddb7ff] transition-colors">
                  Shop Now
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Vertical Card — second product */}
        {drops[1] && (
          <Link href={drops[1].slug ? `/product/${drops[1].slug}` : "/collections"} className="md:col-span-4 group relative aspect-[4/5] bg-[#231e27] overflow-hidden border border-white/[0.10] shadow-[0_22px_70px_rgba(12,6,18,0.30)] rounded-xl">
            <Image
              src={drops[1].image}
              alt={drops[1].name}
              fill
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              <div className="flex justify-end">
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase border border-white/[0.14] text-white/62 px-2 py-1 rounded">Limited</span>
              </div>
              <div>
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/48 mb-2 block">Drop 02 / {drops[1].category}</span>
                <h3 className="font-display text-[32px] text-white uppercase leading-none">{drops[1].name}</h3>
                <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/38 mt-3">Built for daily wear</p>
              </div>
            </div>
          </Link>
        )}

        {/* Small Cards Row — remaining products */}
        {drops.slice(2).map((product, i) => (
          <Link
            key={product.id}
            href={product.slug ? `/product/${product.slug}` : "/collections"}
            className="md:col-span-4 group relative aspect-square bg-[#231e27] overflow-hidden border border-white/[0.10] shadow-[0_22px_70px_rgba(12,6,18,0.26)] rounded-xl"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            />
            <div className="absolute bottom-6 left-6">
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/48">Drop 0{i + 3} / {product.category}</span>
              <h3 className="font-display text-[24px] text-white uppercase leading-none mt-2">{product.name}</h3>
            </div>
          </Link>
        ))}

        <div className="md:col-span-4 flex flex-col justify-center items-center border border-dashed border-white/[0.10] p-8 text-center bg-[#231e27]/72 hover:bg-[#2b2430] transition-colors group cursor-pointer aspect-square shadow-[0_22px_70px_rgba(12,6,18,0.20)] rounded-xl">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/48 mb-4">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <h3 className="font-display text-[24px] text-white uppercase leading-none">Next Release</h3>
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/38 mt-3">Preview opens soon</p>
          <div className="mt-6 w-full h-px bg-white/[0.10] relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-[#ddb7ff] w-2/3" />
          </div>
        </div>
      </div>
    </section>
  );
}

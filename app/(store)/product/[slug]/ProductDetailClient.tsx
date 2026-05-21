"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { RealtimeSubscriptions } from "@/lib/realtime/subscriptions";
import ProductInfo from "@/components/product/ProductInfo";
import RecommendedProducts from "@/components/product/RecommendedProducts";

type Color = { id: string; name: string; hex: string };

type VariantInfo = {
  id: string;
  size: string;
  color: string;
  stockQuantity: number;
};

type ProductDetailClientProps = {
  productId: string;
  title: string;
  price: string;
  description: string;
  points: string;
  image: string;
  images: string[];
  colors: Color[];
  sizes: string[];
  variants: VariantInfo[];
  slug: string;
};

export default function ProductDetailClient(props: ProductDetailClientProps) {
  const [selectedColor, setSelectedColor] = useState(props.colors[0]?.id);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [heroHovered, setHeroHovered] = useState(false);
  const [liveStock, setLiveStock] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    for (const v of props.variants) {
      try {
        const unsub = RealtimeSubscriptions.subscribeToStock(v.id, (stock: number) => {
          setLiveStock(prev => ({ ...prev, [v.id]: stock }));
        });
        unsubs.push(unsub);
      } catch {}
    }
    return () => unsubs.forEach(fn => fn());
  }, [props.variants]);

  const liveVariants = props.variants.map(v => ({
    ...v,
    stockQuantity: liveStock[v.id] ?? v.stockQuantity,
  }));

  const allImages = props.images.length > 1 ? props.images : [props.image, props.image];

  return (
    <main className="pt-24">
      {/* ===== DESKTOP: 3-column grid ===== */}
      <section className="hidden lg:grid lg:grid-cols-[minmax(420px,1fr)_minmax(420px,1fr)_minmax(0,420px)] lg:gap-6 lg:items-start lg:mx-auto lg:max-w-[1800px] lg:px-6">

        {/* LEFT — Static Hero Image (sticky) */}
        <div className="lg:sticky lg:top-24">
          <div className="mb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--sp-accent)] flex items-center gap-2">
              <span className="w-2 h-2 bg-[var(--sp-accent)] animate-pulse rounded-full" />
              LIVE_DROP // SESSION_774
            </span>
            <h1 className="font-display text-5xl uppercase text-white leading-none mt-2">
              {props.title}
            </h1>
          </div>
          <div
            className="relative aspect-[3/4] bg-[#050505] overflow-hidden border border-white/5 group"
            onMouseEnter={() => setHeroHovered(true)}
            onMouseLeave={() => setHeroHovered(false)}
          >
            <Image
              src={props.image}
              alt="Hero view of product"
              fill
              sizes="(min-width: 1024px) 30vw, 100vw"
              className={`object-cover transition-all duration-700 ${
                heroHovered ? "grayscale-0 scale-105" : "grayscale brightness-75"
              }`}
              priority
            />
            <div className="absolute top-4 left-4 font-mono text-[10px] text-white bg-black/60 p-1 border border-white/20 backdrop-blur-sm">
              FRAME_01 // MAIN_VIEW
            </div>
            <div className="absolute inset-0 border-[20px] border-transparent pointer-events-none">
              <div className="w-full h-full border border-white/10 flex items-center justify-center">
                <div className="w-12 h-12 border-t-2 border-l-2 border-white/40 absolute top-0 left-0" />
                <div className="w-12 h-12 border-t-2 border-r-2 border-white/40 absolute top-0 right-0" />
                <div className="w-12 h-12 border-b-2 border-l-2 border-white/40 absolute bottom-0 left-0" />
                <div className="w-12 h-12 border-b-2 border-r-2 border-white/40 absolute bottom-0 right-0" />
              </div>
            </div>
          </div>
        </div>

        {/* CENTER — Scrolling Gallery (natural document flow) */}
        <div className="flex flex-col gap-6 pt-[88px]">
          {allImages.slice(1).map((src, i) => (
            <div key={i} className="relative aspect-[4/5] bg-[#050505] overflow-hidden border border-white/5">
              <Image
                src={src}
                alt={`Detail view ${i + 1}`}
                fill
                sizes="(min-width: 1024px) 30vw, 100vw"
                className="object-cover opacity-80 hover:opacity-100 transition-opacity"
              />
              <div className="absolute top-4 left-4 font-mono text-[10px] text-white bg-black/60 p-1 border border-white/20 backdrop-blur-sm">
                FRAME_{String(i + 2).padStart(2, "0")} / SYSTEM_DETAIL
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — Product Info (sticky) */}
        <aside className="lg:sticky lg:top-24">
          <ProductInfo
            productId={props.productId}
            title={props.title}
            price={props.price}
            description={props.description}
            points={props.points}
            colors={props.colors}
            sizes={props.sizes}
            variants={liveVariants}
            image={props.image}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            quantity={quantity}
            onColorSelect={setSelectedColor}
            onSizeSelect={setSelectedSize}
            onQuantityChange={setQuantity}
          />
        </aside>
      </section>

      {/* ===== MOBILE: simple vertical flow ===== */}
      <section className="lg:hidden flex flex-col">
        {/* Hero */}
        <div className="px-4 pt-8 pb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--sp-accent)] flex items-center gap-2">
            <span className="w-2 h-2 bg-[var(--sp-accent)] animate-pulse rounded-full" />
            LIVE_DROP // SESSION_774
          </span>
          <h1 className="font-display text-4xl uppercase text-white leading-none mt-2">
            {props.title}
          </h1>
        </div>
        <div className="relative aspect-[4/5] bg-[#050505] mx-4 overflow-hidden border border-white/5">
          <Image
            src={props.image}
            alt="Hero view of product"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
        {/* Gallery images */}
        <div className="flex flex-col gap-4 px-4 py-6">
          {allImages.slice(1).map((src, i) => (
            <div key={i} className="relative aspect-[4/5] bg-[#050505] overflow-hidden border border-white/5">
              <Image
                src={src}
                alt={`Detail view ${i + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {/* Product info */}
        <div className="px-4 pb-24">
          <ProductInfo
            productId={props.productId}
            title={props.title}
            price={props.price}
            description={props.description}
            points={props.points}
            colors={props.colors}
            sizes={props.sizes}
            variants={liveVariants}
            image={props.image}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            quantity={quantity}
            onColorSelect={setSelectedColor}
            onSizeSelect={setSelectedSize}
            onQuantityChange={setQuantity}
          />
        </div>
      </section>

      <RecommendedProducts currentSlug={props.slug} />
    </main>
  );
}

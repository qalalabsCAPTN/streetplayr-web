"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
  const [show3DViewer, setShow3DViewer] = useState(false);
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
            <h1 className="font-display text-5xl uppercase text-white leading-none">
              {props.title}
            </h1>
          </div>
          <div className="relative aspect-[3/4] bg-[#050505] overflow-hidden border border-white/5">
            <Image
              src={props.image}
              alt="Hero view of product"
              fill
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 border-[20px] border-transparent pointer-events-none">
              <div className="w-full h-full border border-white/10 flex items-center justify-center">
                <div className="w-12 h-12 border-t-2 border-l-2 border-white/40 absolute top-0 left-0" />
                <div className="w-12 h-12 border-t-2 border-r-2 border-white/40 absolute top-0 right-0" />
                <div className="w-12 h-12 border-b-2 border-l-2 border-white/40 absolute bottom-0 left-0" />
                <div className="w-12 h-12 border-b-2 border-r-2 border-white/40 absolute bottom-0 right-0" />
              </div>
            </div>
          </div>
          <button
            onClick={() => setShow3DViewer(true)}
            className="w-full mt-3 flex items-center justify-between border border-white/[0.12] px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 hover:text-white hover:border-white/30 transition-all duration-300"
          >
            <span>View in 3D</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </button>
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
          <h1 className="font-display text-4xl uppercase text-white leading-none">
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
        <div className="mx-4 mt-3">
          <button
            onClick={() => setShow3DViewer(true)}
            className="w-full flex items-center justify-between border border-white/[0.12] px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 hover:text-white hover:border-white/30 transition-all duration-300"
          >
            <span>View in 3D</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </button>
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

      <AnimatePresence>
        {show3DViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setShow3DViewer(false)}
          >
            <button
              onClick={() => setShow3DViewer(false)}
              className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center border border-white/[0.12] text-white/50 hover:text-white hover:border-white/30 transition-all"
              aria-label="Close 3D viewer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-5xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-[4/5] md:aspect-[3/4] bg-[#050505] border border-white/[0.06] relative overflow-hidden">
                <Image
                  src={props.image}
                  alt={props.title}
                  fill
                  className="object-cover opacity-60"
                  sizes="(min-width: 1024px) 60vw, 100vw"
                />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#ddb7ff]/40 mb-4">
                    Product Visualization
                  </span>
                  <h2 className="font-display text-3xl md:text-5xl uppercase text-[#eadfed] mb-3">
                    3D Preview
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">
                    Available Soon
                  </p>
                  <div className="w-12 h-px bg-white/[0.08] my-5" />
                  <p className="font-body text-[12px] leading-relaxed text-white/30 max-w-sm">
                    StreetPlayR is preparing an immersive product visualization experience.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RecommendedProducts currentSlug={props.slug} />
    </main>
  );
}

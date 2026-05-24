"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { RealtimeSubscriptions } from "@/lib/realtime/subscriptions";
import ProductInfo from "@/components/product/ProductInfo";
import RecommendedProducts from "@/components/product/RecommendedProducts";

/* ── Lazy-load the 3D viewer — no SSR, only loads when modal opens ── */
const ProductViewer3D = dynamic(
  () => import("@/components/product/ProductViewer3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#050505]">
        {/* Animated cube spinner */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#ddb7ff]/40 animate-spin"
          style={{ animationDuration: "2s" }}
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/20">
          Loading 3D model…
        </span>
      </div>
    ),
  }
);

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
  /** Path to GLB in /public/models/ — when present, shows "View in 3D" */
  model3d?: string;
};

/* ── 3D button (reused in desktop + mobile) ── */
function ViewIn3DButton({
  onClick,
  onMouseEnter,
}: {
  onClick: () => void;
  onMouseEnter?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className="w-full flex items-center justify-between border border-white/[0.12] px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/60 hover:text-white hover:border-[#ddb7ff]/40 transition-all duration-300 group"
    >
      <span>View in 3D</span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-60 group-hover:opacity-100 transition-opacity"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    </button>
  );
}

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
          setLiveStock((prev) => ({ ...prev, [v.id]: stock }));
        });
        unsubs.push(unsub);
      } catch {}
    }
    return () => unsubs.forEach((fn) => fn());
  }, [props.variants]);

  const liveVariants = props.variants.map((v) => ({
    ...v,
    stockQuantity: liveStock[v.id] ?? v.stockQuantity,
  }));

  const allImages = props.images.length > 1 ? props.images : [props.image, props.image];

  /* Preload GLB on button hover so modal opens faster */
  const handleButtonHover = useCallback(() => {
    if (props.model3d) {
      import("@/components/product/ProductViewer3D").then(({ preload3DModel }) => {
        preload3DModel(props.model3d!);
      });
    }
  }, [props.model3d]);

  return (
    <main className="pt-24">
      {/* ===== DESKTOP: 3-column editorial layout ===== */}
      <section className="hidden lg:grid lg:grid-cols-[minmax(380px,1fr)_minmax(380px,1fr)_minmax(0,460px)] lg:gap-8 lg:items-start lg:mx-auto lg:max-w-[1800px] lg:px-6">

        {/* LEFT — Hero image (sticky) */}
        <div className="lg:sticky lg:top-24 flex flex-col gap-3">
          <div className="mb-3">
            <h1 className="font-display text-5xl uppercase text-white leading-none">
              {props.title}
            </h1>
          </div>
          <div className="relative aspect-[3/4] bg-[#050505] overflow-hidden border border-white/[0.08]">
            <Image
              src={props.image}
              alt={props.title}
              fill
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="object-cover"
              priority
            />
            <div className="absolute bottom-4 right-4 z-10">
              <span className="font-mono text-[9px] tracking-[0.2em] text-white/55 bg-black/40 backdrop-blur-sm px-2.5 py-1 border border-white/[0.10]">
                01 / {String(allImages.length).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* View in 3D — only if model exists */}
          {props.model3d && (
            <ViewIn3DButton
              onClick={() => setShow3DViewer(true)}
              onMouseEnter={handleButtonHover}
            />
          )}
        </div>

        {/* CENTER — Editorial scrolling gallery */}
        <div className="flex flex-col gap-4 pt-[88px]">
          {allImages.slice(1).map((src, i) => (
            <div
              key={i}
              className="relative aspect-[3/4] bg-[#050505] overflow-hidden border border-white/[0.08]"
            >
              <Image
                src={src}
                alt={`${props.title} — view ${i + 2}`}
                fill
                sizes="(min-width: 1024px) 30vw, 100vw"
                className="object-cover hover:scale-[1.02] transition-transform duration-700 ease-out"
              />
              <div className="absolute bottom-4 right-4 z-10">
                <span className="font-mono text-[9px] tracking-[0.2em] text-white/55 bg-black/40 backdrop-blur-sm px-2.5 py-1 border border-white/[0.10]">
                  {String(i + 2).padStart(2, "0")} / {String(allImages.length).padStart(2, "0")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — Product info (sticky) */}
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
        <div className="px-4 pt-8 pb-4">
          <h1 className="font-display text-4xl uppercase text-white leading-none">
            {props.title}
          </h1>
        </div>

        {/* All images stacked */}
        <div className="flex flex-col gap-3 px-4">
          {allImages.map((src, i) => (
            <div
              key={i}
              className="relative aspect-[4/5] bg-[#050505] overflow-hidden border border-white/[0.08]"
            >
              <Image
                src={src}
                alt={`${props.title} view ${i + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
              />
              <div className="absolute bottom-3 right-3 z-10">
                <span className="font-mono text-[10px] tracking-[0.18em] text-white/50 bg-black/40 backdrop-blur-sm px-2 py-0.5 border border-white/[0.08]">
                  {String(i + 1).padStart(2, "0")} / {String(allImages.length).padStart(2, "0")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* View in 3D mobile — only if model exists */}
        {props.model3d && (
          <div className="mx-4 mt-3">
            <ViewIn3DButton
              onClick={() => setShow3DViewer(true)}
              onMouseEnter={handleButtonHover}
            />
          </div>
        )}

        <div className="px-4 pt-6 pb-24">
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

      {/* ===== 3D Viewer Modal ===== */}
      <AnimatePresence>
        {show3DViewer && props.model3d && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md"
            onClick={() => setShow3DViewer(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setShow3DViewer(false)}
              className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center border border-white/[0.12] text-white/50 hover:text-white hover:border-white/30 transition-all bg-black/40 backdrop-blur-sm"
              aria-label="Close 3D viewer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Header labels */}
            <div className="absolute top-5 left-5 z-10 flex items-center gap-3">
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#ddb7ff]/50">
                3D View
              </span>
              <span className="h-px w-4 bg-white/10 block" />
              <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/20">
                {props.title}
              </span>
            </div>

            {/* Interaction hint */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 pointer-events-none">
              <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/20">
                Drag to rotate · Scroll to zoom
              </span>
            </div>

            {/* Viewer panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full max-w-5xl max-h-[80vh] mx-4 md:mx-8 border border-white/[0.07] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <ProductViewer3D modelPath={props.model3d} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RecommendedProducts currentSlug={props.slug} />
    </main>
  );
}

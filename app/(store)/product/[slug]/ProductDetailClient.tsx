"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { RealtimeSubscriptions } from "@/lib/realtime/subscriptions";
import { useCartStore } from "@/store/cartStore";
import ProductInfo from "@/components/product/ProductInfo";
import RecommendedProducts from "@/components/product/RecommendedProducts";

/* ── Lazy-load AI Try-On — no SSR ── */
const AITryOn = dynamic(
  () => import("@/components/product/AITryOn"),
  { ssr: false }
);

/* ── Lazy-load the 3D viewer — no SSR, only loads when modal opens ── */
const ProductViewer3D = dynamic(
  () => import("@/components/product/ProductViewer3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#050505]">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#ddb7ff]/80 animate-spin"
          style={{ animationDuration: "2s" }}
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-white/60">
          Loading 3D model…
        </span>
      </div>
    ),
  }
);

type Color = { id: string; name: string; hex: string; images?: string[] };

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

/* ── 3D button ── */
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
      className="w-full flex items-center justify-between border border-white/[0.12] px-5 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 hover:text-white hover:border-[#ddb7ff]/40 transition-all duration-300 group"
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

/* ── Mobile accordion item ── */
function MobileAccordion({ label, content }: { label: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex justify-between items-center py-4 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-white/80 hover:text-white transition-colors"
      >
        <span>{label}</span>
        <span className="font-mono text-xs">{open ? "[-]" : "[+]"}</span>
      </button>
      {open && (
        <div className="pb-5 text-white/80 text-sm leading-relaxed pr-4">
          {content}
        </div>
      )}
    </div>
  );
}

export default function ProductDetailClient(props: ProductDetailClientProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [selectedColor, setSelectedColor] = useState(props.colors[0]?.id);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [liveStock, setLiveStock] = useState<Record<string, number>>({});

  /* Mobile gallery state */
  const [activeSlide, setActiveSlide] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: false,
    skipSnaps: false,
    dragFree: false,
    loop: true,
  });
  const galleryRef = useRef<HTMLDivElement>(null);

  /* Mobile purchase feedback */
  const [isAdded, setIsAdded] = useState(false);

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

  /* Gallery follows the selected colour swatch. Falls back to the
     product's default images if a colour has no dedicated set. */
  const activeColor = props.colors.find((c) => c.id === selectedColor);
  const colorImages = activeColor?.images?.length ? activeColor.images : props.images;
  const heroImage = colorImages[0] ?? props.image;
  const allImages = colorImages.length > 1 ? colorImages : [heroImage, heroImage];

  /* Reset gallery position when the colour changes */
  useEffect(() => {
    setActiveSlide(0);
    if (emblaApi) emblaApi.reInit();
  }, [selectedColor, emblaApi]);

  const handleGalleryScroll = useCallback(() => {
    const el = galleryRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveSlide(Math.min(index, allImages.length - 1));
  }, [allImages.length]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setActiveSlide(emblaApi.selectedScrollSnap());
    };

    onSelect();
    emblaApi.on("select", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  /* Preload GLB on button hover */
  const handleButtonHover = useCallback(() => {
    if (props.model3d) {
      import("@/components/product/ProductViewer3D").then(({ preload3DModel }) => {
        preload3DModel(props.model3d!);
      });
    }
  }, [props.model3d]);

  /* Mobile: add to cart */
  const handleMobileAddToCart = useCallback(async () => {
    if (!selectedSize) {
      alert("Please select a size.");
      return;
    }
    const colorName = props.colors.find((c) => c.id === selectedColor)?.name ?? "Standard";
    const matchingVariant = liveVariants.find((v) => v.size === selectedSize);
    if (!matchingVariant) {
      alert("Selected size not available.");
      return;
    }
    if (matchingVariant.stockQuantity < quantity) {
      alert(`Only ${matchingVariant.stockQuantity} units available.`);
      return;
    }
    try {
      const { getVariantStockAction } = await import("@/app/actions/stock");
      const res = await getVariantStockAction(matchingVariant.id);
      if (res.success && res.data && res.data.available < quantity) {
        alert(`Only ${res.data.available} units available.`);
        return;
      }
    } catch {}
    addItem({
      id: matchingVariant.id,
      productId: props.productId,
      name: props.title,
      price: parseFloat(props.price.replace(/[^0-9.-]+/g, "")),
      quantity,
      color: colorName,
      size: selectedSize,
      image: heroImage,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  }, [selectedSize, selectedColor, quantity, props, liveVariants, addItem]);

  /* Mobile: buy now = add to cart then go to checkout */
  const handleBuyNow = useCallback(async () => {
    await handleMobileAddToCart();
    router.push("/checkout");
  }, [handleMobileAddToCart, router]);

  return (
    <main className="pt-24">
      {/* ===== DESKTOP: 3-column editorial layout (UNCHANGED) ===== */}
      <section className="hidden lg:grid lg:grid-cols-[minmax(380px,1fr)_minmax(380px,1fr)_minmax(0,460px)] lg:gap-8 lg:items-start lg:mx-auto lg:max-w-[min(98vw,2560px)] lg:px-12">

        {/* LEFT — Hero image (sticky) */}
        <div className="lg:sticky lg:top-24 flex flex-col gap-3">
          <div className="mb-3">
            <h1 className="font-display text-5xl uppercase text-white leading-none">
              {props.title}
            </h1>
          </div>
          <div className="relative aspect-[3/4] bg-[#050505] overflow-hidden border border-white/[0.08]">
            <Image
              src={heroImage}
              alt={props.title}
              fill
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="object-cover"
              priority
            />
            <div className="absolute bottom-4 right-4 z-10">
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-white/80 bg-black/40 backdrop-blur-sm px-2.5 py-1 border border-white/[0.10]">
                01 / {String(allImages.length).padStart(2, "0")}
              </span>
            </div>
          </div>
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
                <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-white/80 bg-black/40 backdrop-blur-sm px-2.5 py-1 border border-white/[0.10]">
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
            image={heroImage}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            quantity={quantity}
            onColorSelect={setSelectedColor}
            onSizeSelect={setSelectedSize}
            onQuantityChange={setQuantity}
          />
        </aside>
      </section>

      {/* ===== MOBILE: swipe gallery + immediate purchase block ===== */}
      <section className="lg:hidden flex flex-col pb-24">

        {/* ── 1. Title ── */}
        <div className="px-4 pt-6 pb-4">
          <h1 className="font-display text-[36px] uppercase text-white leading-none">
            {props.title}
          </h1>
        </div>

        {/* ── 2. Swipe gallery ── */}
        <div className="relative">
          <div className="overflow-hidden md:hidden" ref={emblaRef}>
            <div className="flex" style={{ marginLeft: "-10px" }}>
              {allImages.map((src, i) => {
                const isActive = i === activeSlide;
                return (
                  <div
                    key={i}
                    style={{
                      flex: "0 0 65%",
                      minWidth: 0,
                      paddingLeft: "10px",
                      transition: "transform 0.4s ease, opacity 0.4s ease",
                      transform: isActive ? "scale(1)" : "scale(0.88)",
                      opacity: isActive ? 1 : 0.55,
                      willChange: "transform, opacity",
                      borderRadius: 16,
                      overflow: "hidden",
                    }}
                  >
                    <div className="relative aspect-[4/5] bg-[#050505] overflow-hidden rounded-xl">
                      <Image
                        src={src}
                        alt={`${props.title} view ${i + 1}`}
                        fill
                        sizes="100vw"
                        className="object-cover saturate-[0.92]"
                        priority={i === 0}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            ref={galleryRef}
            onScroll={handleGalleryScroll}
            className="hidden md:flex lg:hidden overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
            {allImages.map((src, i) => (
              <div
                key={i}
                className="relative aspect-[4/5] flex-shrink-0 w-full snap-center bg-[#050505] overflow-hidden border-b border-white/[0.06]"
              >
                <Image
                  src={src}
                  alt={`${props.title} view ${i + 1}`}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>

          <div className="md:hidden absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-[#16111b] to-transparent pointer-events-none z-[1]" />
          <div className="md:hidden absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-[#16111b] to-transparent pointer-events-none z-[1]" />

          {/* Counter — top right */}
          <div className="absolute top-3 right-3 z-10">
            <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-white/80 bg-black/50 backdrop-blur-sm px-2 py-1 border border-white/[0.08]">
              {String(activeSlide + 1).padStart(2, "0")} / {String(allImages.length).padStart(2, "0")}
            </span>
          </div>

          {/* Dot indicators — bottom center */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {allImages.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeSlide
                      ? "w-3.5 h-1.5 bg-white"
                      : "w-1.5 h-1.5 bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── 3. Price ── */}
        <div className="px-4 pt-5 pb-1">
          <p className="font-display text-[44px] text-white tracking-tight leading-none">
            {props.price}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/50 mt-1">
            Limited Release
          </p>
        </div>

        {/* ── 4. Colorway ── */}
        {props.colors.length > 0 && (
          <div className="px-4 pt-5">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60 mb-3 block">
              Colorway
            </label>
            <div className="flex flex-wrap gap-3">
              {props.colors.map((color) => {
                const isSelected = (selectedColor ?? props.colors[0]?.id) === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    aria-label={`Color: ${color.name}`}
                    className="relative flex h-11 w-11 items-center justify-center transition-colors duration-300"
                    style={{
                      border: isSelected
                        ? "1px solid rgba(255,255,255,0.9)"
                        : "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    <span
                      className="h-[80%] w-[80%]"
                      style={{ backgroundColor: color.hex }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 5. Size selector ── */}
        <div className="px-4 pt-5">
          <div className="flex justify-between mb-3">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
              Select Size
            </label>
            <button className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/45 underline underline-offset-4">
              Size Guide
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {props.sizes.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3.5 font-mono text-xs transition-all ${
                    isSelected
                      ? "border border-white/80 bg-white/5 text-white"
                      : "border border-white/[0.14] hover:border-white/35 text-white/60"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 6. Add to Cart + Buy Now ── */}
        <div className="px-4 pt-5 flex flex-col gap-3">
          <button
            onClick={handleMobileAddToCart}
            className={`w-full py-4 font-mono text-[11px] uppercase tracking-[0.22em] transition-all duration-300 ${
              isAdded
                ? "bg-white/10 text-white/60 border border-white/[0.12]"
                : "bg-white text-[#16111b] hover:bg-[#ddb7ff]"
            }`}
          >
            {isAdded ? "Added to Cart ✓" : "Add to Cart"}
          </button>
          <button
            onClick={handleBuyNow}
            className="w-full py-4 font-mono text-[11px] uppercase tracking-[0.22em] border border-white/[0.14] text-white/70 hover:text-white hover:border-white/30 transition-all duration-300"
          >
            Buy Now
          </button>
        </div>

        {/* ── 7. 3D View ── */}
        {props.model3d && (
          <div className="px-4 pt-3">
            <ViewIn3DButton
              onClick={() => setShow3DViewer(true)}
              onMouseEnter={handleButtonHover}
            />
          </div>
        )}

        {/* ── 8. AI Try-On ── */}
        <div className="mx-4 mt-5">
          <AITryOn
            productImageUrl={heroImage}
            productTitle={props.title}
          />
        </div>

        {/* ── 9. Accordion ── */}
        <div className="px-4 pt-5 border-t border-white/[0.06] mt-5">
          <MobileAccordion
            label="Product Details"
            content={props.description || "Tri-layer GORE-TEX membrane with liquid-chrome finish. Reinforced 500D Cordura panels."}
          />
          <MobileAccordion
            label="Delivery & Returns"
            content="Standard delivery: 5-7 business days. Express: 2-3 business days. International shipping available."
          />
          <MobileAccordion
            label="Care Instructions"
            content="Machine wash cold, gentle cycle. Hang to dry. Do not bleach, iron, or dry clean."
          />
        </div>
      </section>

      {/* ===== 3D Viewer Modal (shared desktop + mobile) ===== */}
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
            <button
              onClick={() => setShow3DViewer(false)}
              className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center border border-white/[0.12] text-white/50 hover:text-white hover:border-white/30 transition-all bg-black/40 backdrop-blur-sm"
              aria-label="Close 3D viewer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="absolute top-5 left-5 z-10 flex items-center gap-3">
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#ddb7ff]/50">3D View</span>
              <span className="h-px w-4 bg-white/10 block" />
              <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/20">{props.title}</span>
            </div>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/20">
                Drag to rotate · Scroll to zoom
              </span>
            </div>

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

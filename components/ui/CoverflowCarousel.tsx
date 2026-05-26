"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  KeyboardEvent,
} from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CarouselProduct {
  id: string | number;
  name: string;
  price: string | number;
  image: string;
  image2?: string;
  slug?: string;
  category?: string;
}

interface CoverflowCarouselProps {
  products: CarouselProduct[];
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SPRING_CONFIG = { stiffness: 240, damping: 26, mass: 1 };
const SWIPE_VELOCITY_THRESHOLD = 300;
const SWIPE_DISTANCE_THRESHOLD = 50;

// ─── Transform Calculator ─────────────────────────────────────────────────────

interface CardTransform {
  translateX: string;
  translateZ: number;
  rotateY: number;
  scale: number;
  opacity: number;
  zIndex: number;
}

function getCardTransform(
  offset: number,
  isMobile: boolean
): CardTransform {
  const abs = Math.abs(offset);
  const sign = Math.sign(offset);
  const clamped = Math.min(abs, 4);

  if (isMobile) {
    // Mobile: strong coverflow, card fills ~80% viewport
    return {
      translateX: `${offset * 73}%`,
      translateZ: -clamped * 70,
      rotateY: abs === 0 ? 0 : sign * Math.min(clamped * 12, 32),
      scale: abs === 0 ? 1 : Math.max(0.78 - clamped * 0.055, 0.56),
      opacity: abs === 0 ? 1 : Math.max(0.72 - clamped * 0.17, 0.16),
      zIndex: Math.max(20 - abs * 5, 0),
    };
  }

  // Desktop/Tablet: cinematic wide layout
  return {
    translateX: `${offset * 58}%`,
    translateZ: -clamped * 110,
    rotateY: abs === 0 ? 0 : sign * Math.min(clamped * 17, 42),
    scale: abs === 0 ? 1 : Math.max(0.75 - clamped * 0.065, 0.52),
    opacity: abs === 0 ? 1 : Math.max(0.65 - clamped * 0.15, 0.12),
    zIndex: Math.max(20 - abs * 5, 0),
  };
}

// ─── Individual Coverflow Card ────────────────────────────────────────────────

interface CoverflowCardProps {
  product: CarouselProduct;
  offset: number;
  isMobile: boolean;
  isActive: boolean;
  isReduced: boolean;
  onClick: () => void;
  totalIndex: number;
  totalCount: number;
}

function CoverflowCard({
  product,
  offset,
  isMobile,
  isActive,
  isReduced,
  onClick,
  totalIndex,
  totalCount,
}: CoverflowCardProps) {
  const t = getCardTransform(offset, isMobile);
  const abs = Math.abs(offset);

  const transition = isReduced
    ? { duration: 0.01 }
    : { type: "spring" as const, ...SPRING_CONFIG };

  const href = product.slug ? `/product/${product.slug}` : "/collections";

  return (
    <motion.div
      role="group"
      aria-label={`Slide ${totalIndex + 1} of ${totalCount}: ${product.name}`}
      aria-hidden={!isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={!isActive ? onClick : undefined}
      animate={{
        x: t.translateX,
        z: t.translateZ,
        rotateY: t.rotateY,
        scale: t.scale,
        opacity: t.opacity,
        zIndex: t.zIndex,
      }}
      transition={transition}
      style={{
        position: "absolute",
        left: "50%",
        top: 0,
        marginLeft: isMobile ? "-40%" : "-22%",
        width: isMobile ? "80%" : "44%",
        height: "100%",
        willChange: "transform, opacity",
        transformStyle: "preserve-3d",
        cursor: isActive ? "default" : "pointer",
        transformOrigin: "center center",
      }}
      whileFocus={
        isActive
          ? { outline: "2px solid rgba(221,183,255,0.6)", outlineOffset: 4 }
          : {}
      }
    >
      {/* ── Card Shell ── */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius: isMobile ? 20 : 24,
          background: "#1c1622",
          border: isActive
            ? "1px solid rgba(221,183,255,0.24)"
            : "1px solid rgba(255,255,255,0.08)",
          boxShadow: isActive
            ? "0 40px 100px rgba(12,6,18,0.64), 0 0 0 1px rgba(221,183,255,0.12), inset 0 1px 0 rgba(255,255,255,0.08)"
            : "0 24px 64px rgba(12,6,18,0.40)",
          transition: "border-color 0.4s, box-shadow 0.4s",
        }}
      >
        {/* ── Product Image ── */}
        <img
          src={product.image}
          alt={product.name}
          loading={isActive ? "eager" : "lazy"}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: isActive
              ? "saturate(1.05) brightness(1)"
              : `saturate(0.7) brightness(${0.6 + (1 - abs * 0.12)})`,
            transition: "filter 0.5s",
          }}
          draggable={false}
        />

        {/* ── Gradient Overlay ── */}
        <div
          className="absolute inset-0"
          style={{
            background: isActive
              ? "linear-gradient(to top, rgba(16,11,21,0.95) 0%, rgba(16,11,21,0.3) 40%, transparent 70%)"
              : "linear-gradient(to top, rgba(16,11,21,0.85) 0%, rgba(16,11,21,0.5) 60%, rgba(16,11,21,0.15) 100%)",
            transition: "background 0.5s",
          }}
        />

        {/* ── Accent rim light on active ── */}
        {isActive && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(221,183,255,0.06) 0%, transparent 50%)",
              borderRadius: "inherit",
            }}
          />
        )}

        {/* ── Category chip (always visible on active) ── */}
        <AnimatePresence>
          {isActive && product.category && (
            <motion.div
              key="chip"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, delay: 0.06 }}
              className="absolute top-5 left-5"
            >
              <span
                className="font-mono text-[9px] tracking-[0.24em] uppercase"
                style={{
                  background: "rgba(221,183,255,0.14)",
                  border: "1px solid rgba(221,183,255,0.22)",
                  color: "#ddb7ff",
                  padding: "5px 10px",
                  borderRadius: 6,
                  backdropFilter: "blur(8px)",
                }}
              >
                {product.category}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Card Content ── */}
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
          {/* Product name — always visible */}
          <h3
            className="font-display uppercase leading-none"
            style={{
              fontSize: isActive
                ? isMobile
                  ? "clamp(22px, 5.5vw, 30px)"
                  : "clamp(26px, 2.4vw, 36px)"
                : isMobile
                ? "clamp(16px, 4vw, 22px)"
                : "clamp(18px, 1.6vw, 26px)",
              color: "#eadfed",
              transition: "font-size 0.3s",
              textShadow: "0 2px 16px rgba(0,0,0,0.5)",
            }}
          >
            {product.name}
          </h3>

          {/* Price + CTA — only on active */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                key="active-info"
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                transition={{ duration: 0.32, delay: 0.08 }}
                className="mt-3 flex items-center justify-between"
              >
                <span
                  className="font-mono text-[11px] tracking-[0.18em] uppercase"
                  style={{ color: "rgba(234,223,237,0.62)" }}
                >
                  {typeof product.price === "number"
                    ? `Rs. ${product.price.toLocaleString()}`
                    : product.price}
                </span>

                <Link
                  href={href}
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-[10px] tracking-[0.22em] uppercase font-semibold"
                  style={{
                    background: "#eadfed",
                    color: "#16111b",
                    padding: "8px 16px",
                    borderRadius: 8,
                    transition: "background 0.2s",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "#ddb7ff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "#eadfed";
                  }}
                >
                  Shop Now
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Minimal price on inactive (subtle) */}
          <AnimatePresence>
            {!isActive && abs === 1 && (
              <motion.p
                key="inactive-price"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="font-mono text-[9px] tracking-[0.16em] uppercase mt-2"
                style={{ color: "rgba(234,223,237,0.38)" }}
              >
                {typeof product.price === "number"
                  ? `Rs. ${product.price.toLocaleString()}`
                  : product.price}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Dot Indicator ────────────────────────────────────────────────────────────

function DotIndicator({
  count,
  active,
  onSelect,
}: {
  count: number;
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 justify-center"
      role="tablist"
      aria-label="Carousel position"
    >
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          role="tab"
          aria-selected={i === active}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => onSelect(i)}
          style={{
            width: i === active ? 24 : 6,
            height: 6,
            borderRadius: 99,
            background:
              i === active
                ? "#ddb7ff"
                : "rgba(234,223,237,0.22)",
            border: "none",
            cursor: "pointer",
            padding: 0,
            transition: "width 0.35s cubic-bezier(0.16,1,0.3,1), background 0.25s",
            outline: "none",
            flexShrink: 0,
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 0 2px rgba(221,183,255,0.5)";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Carousel ────────────────────────────────────────────────────────────

export default function CoverflowCarousel({
  products,
  className = "",
}: CoverflowCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const isReduced = useReducedMotion() ?? false;

  const containerRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);
  const wheelDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Responsive breakpoint detector ──
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(!e.matches);
    };
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const count = products.length;

  const advance = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((prev) => {
        const next = prev + direction;
        if (next < 0) return count - 1;
        if (next >= count) return 0;
        return next;
      });
    },
    [count]
  );

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // ── Keyboard navigation ──
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        advance(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        advance(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(count - 1);
      }
    },
    [advance, goTo, count]
  );

  // ── Mouse wheel navigation ──
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (wheelDebounceRef.current) return;
      advance(e.deltaY > 0 ? 1 : -1);
      wheelDebounceRef.current = setTimeout(() => {
        wheelDebounceRef.current = null;
      }, 350);
    },
    [advance]
  );

  // ── Drag end handler ──
  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      setIsDragging(false);
      const { offset, velocity } = info;
      const swipeByVelocity = Math.abs(velocity.x) > SWIPE_VELOCITY_THRESHOLD;
      const swipeByDistance = Math.abs(offset.x) > SWIPE_DISTANCE_THRESHOLD;

      if (swipeByVelocity || swipeByDistance) {
        advance(offset.x < 0 ? 1 : -1);
      }
      dragX.set(0);
    },
    [advance, dragX]
  );

  if (!products.length) return null;

  // Aspect ratio: mobile = 4/5, desktop = 3/4
  const aspectRatio = isMobile ? "80%" : "133.33%"; // = height / width

  return (
    <section
      className={`relative w-full select-none ${className}`}
      aria-label="Best Sellers carousel"
      aria-roledescription="carousel"
      onKeyDown={handleKeyDown}
    >
      {/* ── Perspective Container ── */}
      <div
        ref={containerRef}
        role="region"
        aria-live="polite"
        onWheel={handleWheel}
        style={{
          position: "relative",
          width: "100%",
          // Height = card width × aspect ratio
          height: isMobile ? "calc(80vw * 1.25)" : "calc(44% * 1.333)",
          // Clamp height on desktop
          maxHeight: isMobile ? 600 : 640,
          minHeight: isMobile ? 320 : 380,
          perspective: isMobile ? "1400px" : "1800px",
          perspectiveOrigin: "50% 50%",
          overflow: "visible",
          touchAction: "none",
        }}
      >
        {/* ── Drag capture layer ── */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          style={{
            x: dragX,
            position: "absolute",
            inset: 0,
            zIndex: 30,
            cursor: isDragging ? "grabbing" : "grab",
          }}
        />

        {/* ── Cards ── */}
        {products.map((product, index) => {
          const offset = index - activeIndex;
          // Wrap offset for looping feel
          const wrappedOffset = (() => {
            const half = count / 2;
            let o = offset;
            while (o > half) o -= count;
            while (o < -half) o += count;
            return o;
          })();

          return (
            <CoverflowCard
              key={product.id}
              product={product}
              offset={wrappedOffset}
              isMobile={isMobile}
              isActive={index === activeIndex}
              isReduced={isReduced}
              onClick={() => goTo(index)}
              totalIndex={index}
              totalCount={count}
            />
          );
        })}
      </div>

      {/* ── Dot indicators ── */}
      <div className="mt-6 md:mt-8">
        <DotIndicator count={count} active={activeIndex} onSelect={goTo} />
      </div>

      {/* ── Arrow nav (desktop) ── */}
      {!isMobile && (
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none flex justify-between px-4 z-40">
          {[{ dir: -1, label: "Previous" }, { dir: 1, label: "Next" }].map(
            ({ dir, label }) => (
              <button
                key={dir}
                aria-label={`${label} product`}
                onClick={() => advance(dir as 1 | -1)}
                className="pointer-events-auto font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(22,17,27,0.72)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(234,223,237,0.72)",
                  backdropFilter: "blur(12px)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "border-color 0.2s, color 0.2s, background 0.2s",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = "rgba(221,183,255,0.4)";
                  el.style.color = "#ddb7ff";
                  el.style.background = "rgba(22,17,27,0.9)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = "rgba(255,255,255,0.12)";
                  el.style.color = "rgba(234,223,237,0.72)";
                  el.style.background = "rgba(22,17,27,0.72)";
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 0 2px rgba(221,183,255,0.5)";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "none";
                }}
              >
                {dir === -1 ? (
                  <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                    <path
                      d="M10 3L5 8l5 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                    <path
                      d="M6 3l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            )
          )}
        </div>
      )}

      {/* ── Active product title for screen readers ── */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        Now showing: {products[activeIndex]?.name}
      </div>
    </section>
  );
}

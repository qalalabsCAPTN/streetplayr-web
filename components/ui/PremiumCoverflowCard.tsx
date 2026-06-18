"use client";

/**
 * PremiumCoverflowCard
 *
 * EXPERIMENTAL — isolated behind USE_PREMIUM_CAROUSEL flag.
 * Does NOT replace or modify any existing component.
 *
 * Individual animated card for the PremiumCoverflowCarousel.
 * Handles its own 3-D transform, spring animation, content
 * reveal, and ARIA semantics.
 */

import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";

// ─── Types (self-contained — no coupling to existing types) ───────────────────

export interface PremiumCarouselProduct {
  id: string | number;
  name: string;
  price: string | number;
  image: string;
  image2?: string;
  slug?: string;
  category?: string;
}

export interface PremiumCardTransform {
  translateXPct: number;   // percent of card width  (e.g. 73 = 73%)
  translateZpx: number;    // px depth recession      (negative = back)
  rotateYdeg: number;      // degrees Y-axis rotation
  scale: number;           // 0–1
  opacity: number;         // 0–1
  zIndex: number;          // stacking order
}

interface PremiumCoverflowCardProps {
  product: PremiumCarouselProduct;
  /** visual position relative to active card: 0=center, ±1=adjacent, etc. */
  offset: number;
  transform: PremiumCardTransform;
  isMobile: boolean;
  isActive: boolean;
  isReduced: boolean;
  onClick: () => void;
  slideIndex: number;   // 0-based position in full product array
  totalSlides: number;
  dragX: any;
  onDragStart: () => void;
  onDragEnd: (event: any, info: any) => void;
}

// ─── Spring config ────────────────────────────────────────────────────────────

// Desktop: rich 3-D spring. Mobile: snappier 2-D spring (no perspective cost).
const SPRING_DESKTOP = { type: "spring" as const, stiffness: 260, damping: 28, mass: 1 };
const SPRING_MOBILE  = { type: "spring" as const, stiffness: 400, damping: 36, mass: 1 };
const INSTANT = { duration: 0.01 };

// ─── Component ────────────────────────────────────────────────────────────────

export default function PremiumCoverflowCard({
  product,
  offset,
  transform,
  isMobile,
  isActive,
  isReduced,
  onClick,
  slideIndex,
  totalSlides,
  dragX,
  onDragStart,
  onDragEnd,
}: PremiumCoverflowCardProps) {
  const abs = Math.abs(offset);
  const transition = isReduced ? INSTANT : (isMobile ? SPRING_MOBILE : SPRING_DESKTOP);
  const href = product.slug ? `/product/${product.slug}` : "/collections";

  const borderRadius = isMobile ? 20 : 24;

  // 1:1 Dynamic swipe tracking:
  // We animate a motion value baseXPct to the target percentage, and combine
  // it with dragX (in pixels) for instant physical response during swipe.
  const baseXPct = useMotionValue(transform.translateXPct);

  useEffect(() => {
    if (isReduced) {
      baseXPct.set(transform.translateXPct);
    } else {
      const prev = baseXPct.get();
      // If the difference is huge (e.g. wrapping from one edge to the other),
      // we snap the value instantly to prevent sliding across the active area.
      if (Math.abs(transform.translateXPct - prev) > 100) {
        baseXPct.set(transform.translateXPct);
      } else {
        animate(baseXPct, transform.translateXPct, transition);
      }
    }
  }, [transform.translateXPct, isReduced, transition, baseXPct]);

  const cardX = useTransform([baseXPct, dragX], ([bx, dx]) => {
    return `calc(${bx}% + ${dx}px)`;
  });

  return (
    <motion.div
      // ── ARIA ──────────────────────────────────────────────────────────────
      role="group"
      aria-roledescription="slide"
      aria-label={`${slideIndex + 1} of ${totalSlides}: ${product.name}`}
      aria-hidden={!isActive}
      tabIndex={isActive ? 0 : -1}

      // ── Interaction ───────────────────────────────────────────────────────
      onClick={!isActive ? onClick : undefined}

      // ── Draggable ─────────────────────────────────────────────────────────
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.10}
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}

      // ── 3-D position (desktop) / 2-D position (mobile) ───────────────────
      // Mobile deliberately omits rotateY + translateZ — perspective transforms
      // are expensive on mobile GPUs and cause the "laggy" feel.
      animate={
        isMobile
          ? {
              scale: transform.scale,
              opacity: transform.opacity,
              zIndex: transform.zIndex,
            }
          : {
              z: transform.translateZpx,
              rotateY: transform.rotateYdeg,
              scale: transform.scale,
              opacity: transform.opacity,
              zIndex: transform.zIndex,
            }
      }
      transition={transition}

      style={{
        position: "absolute",
        left: "50%",
        top: 0,
        x: cardX,
        touchAction: "pan-y",
        width: isMobile ? "80%" : "min(44%, 533px)",
        marginLeft: isMobile ? "-40%" : "calc(min(44%, 533px) / -2)",
        height: "100%",
        willChange: "transform, opacity",
        // Only set preserve-3d on desktop — it creates a new stacking context
        // and forces GPU rasterisation on every card, causing mobile jank.
        transformStyle: isMobile ? "flat" : "preserve-3d",
        cursor: isActive ? "default" : "pointer",
        transformOrigin: "center center",
      }}
    >
      {/* ── Card Shell ────────────────────────────────────────────────────── */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius,
          background: "#1c1622",
          border: isActive
            ? "1px solid rgba(221,183,255,0.22)"
            : "1px solid rgba(255,255,255,0.07)",
          boxShadow: isActive
            ? [
                "0 40px 100px rgba(12,6,18,0.68)",
                "0 0 0 1px rgba(221,183,255,0.10)",
                "inset 0 1px 0 rgba(255,255,255,0.07)",
              ].join(", ")
            : "0 20px 60px rgba(12,6,18,0.38)",
          transition: "border-color 0.4s, box-shadow 0.4s",
        }}
      >
        {/* ── Product image ─────────────────────────────────────────────── */}
        <img
          src={product.image}
          alt={product.name}
          loading={abs <= 1 ? "eager" : "lazy"}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            // object-position: top ensures the full outfit / face is visible
            // instead of the centre crop cutting off the head.
            objectPosition: "top center",
            filter: isActive
              ? "saturate(1.06) brightness(1)"
              : `saturate(0.65) brightness(${Math.max(0.55, 0.9 - abs * 0.12)})`,
            transition: "filter 0.5s ease",
          }}
        />

        {/* ── Depth gradient ────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isActive
              ? "linear-gradient(to top, rgba(16,11,21,0.95) 0%, rgba(16,11,21,0.25) 42%, transparent 70%)"
              : "linear-gradient(to top, rgba(16,11,21,0.90) 0%, rgba(16,11,21,0.55) 65%, rgba(16,11,21,0.18) 100%)",
            transition: "background 0.5s ease",
          }}
        />

        {/* ── Active rim light ──────────────────────────────────────────── */}
        {isActive && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(221,183,255,0.07) 0%, transparent 52%)",
              borderRadius: "inherit",
            }}
          />
        )}

        {/* ── Category chip (active only) ───────────────────────────────── */}
        <AnimatePresence>
          {isActive && product.category && (
            <motion.div
              key="premium-chip"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, delay: 0.06 }}
              className="absolute top-5 left-5 pointer-events-none"
            >
              <span
                className="font-mono text-[9px] tracking-[0.24em] uppercase"
                style={{
                  background: "rgba(221,183,255,0.13)",
                  border: "1px solid rgba(221,183,255,0.22)",
                  color: "#ddb7ff",
                  padding: "5px 10px",
                  borderRadius: 6,
                  backdropFilter: "blur(8px)",
                  display: "inline-block",
                }}
              >
                {product.category}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Card footer content ───────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
          {/* Product name — always present, scales with state */}
          <h3
            className="font-display uppercase leading-none"
            style={{
              fontSize: isActive
                ? isMobile
                  ? "clamp(22px, 5.5vw, 30px)"
                  : "clamp(26px, 2.2vw, 36px)"
                : isMobile
                ? "clamp(16px, 4vw, 21px)"
                : "clamp(18px, 1.5vw, 25px)",
              color: "#eadfed",
              textShadow: "0 2px 20px rgba(0,0,0,0.6)",
              transition: "font-size 0.3s",
            }}
          >
            {product.name}
          </h3>

          {/* Active card: price + CTA (animated reveal) */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                key="premium-active-footer"
                initial={{ opacity: 0, y: 14, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                transition={{ duration: 0.3, delay: 0.08 }}
                className="mt-3 flex items-center justify-between gap-3"
              >
                <span
                  className="font-mono text-[11px] tracking-[0.18em] uppercase"
                  style={{ color: "rgba(234,223,237,0.60)" }}
                >
                  {typeof product.price === "number"
                    ? `Rs. ${product.price.toLocaleString()}`
                    : product.price}
                </span>

                <Link
                  href={href}
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-[10px] tracking-[0.22em] uppercase font-semibold shrink-0"
                  style={{
                    background: "#eadfed",
                    color: "#16111b",
                    padding: "8px 16px",
                    borderRadius: 8,
                    display: "inline-block",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "#ddb7ff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "#eadfed";
                  }}
                >
                  Shop Now
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ±1 cards: subtle price hint */}
          <AnimatePresence>
            {!isActive && abs === 1 && (
              <motion.p
                key="premium-adjacent-price"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="font-mono text-[9px] tracking-[0.15em] uppercase mt-2"
                style={{ color: "rgba(234,223,237,0.35)" }}
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

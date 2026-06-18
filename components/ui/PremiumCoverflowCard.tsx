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

import { AnimatePresence, motion, useTransform, MotionValue } from "framer-motion";
import Link from "next/link";

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
  index: number;
  count: number;
  progress: MotionValue<number>;
  isMobile: boolean;
  isActive: boolean;
  activeIndex: number;
  onClick: () => void;
  slideIndex: number;   // 0-based position in full product array
  totalSlides: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PremiumCoverflowCard({
  product,
  index,
  count,
  progress,
  isMobile,
  isActive,
  activeIndex,
  onClick,
  slideIndex,
  totalSlides,
}: PremiumCoverflowCardProps) {
  const href = product.slug ? `/product/${product.slug}` : "/collections";
  const borderRadius = isMobile ? 20 : 24;

  const rawDist = Math.abs(index - activeIndex);
  const isAdjacent = rawDist === 1 || rawDist === count - 1;

  // Derive wrapped offset relative to progress continuously
  const cardOffset = useTransform(progress, (latestProgress) => {
    let diff = index - latestProgress;
    const half = count / 2;
    diff = ((diff + half) % count);
    if (diff < 0) diff += count;
    diff -= half;
    return diff;
  });

  // Continuous translation X
  const x = useTransform(cardOffset, (offset) => {
    const spacing = isMobile ? 73 : 58;
    return `${offset * spacing}%`;
  });

  // Continuous translation Z
  const z = useTransform(cardOffset, (offset) => {
    if (isMobile) return 0;
    const abs = Math.min(Math.abs(offset), 4);
    return -abs * 110;
  });

  // Continuous Y rotation
  const rotateY = useTransform(cardOffset, (offset) => {
    if (isMobile) return 0;
    const abs = Math.min(Math.abs(offset), 4);
    const sign = Math.sign(offset);
    return sign * Math.min(abs * 17, 42);
  });

  // Continuous scale
  const scale = useTransform(cardOffset, (offset) => {
    const abs = Math.min(Math.abs(offset), 4);
    if (isMobile) {
      return abs <= 1 
        ? 1 - abs * 0.22 
        : Math.max(0.78 - (abs - 1) * 0.055, 0.56);
    } else {
      return abs <= 1 
        ? 1 - abs * 0.25 
        : Math.max(0.75 - (abs - 1) * 0.065, 0.52);
    }
  });

  // Continuous opacity
  const opacity = useTransform(cardOffset, (offset) => {
    const abs = Math.min(Math.abs(offset), 4);
    if (isMobile) {
      return abs <= 1
        ? 1 - abs * 0.28
        : Math.max(0.72 - (abs - 1) * 0.17, 0.16);
    } else {
      return abs <= 1
        ? 1 - abs * 0.35
        : Math.max(0.65 - (abs - 1) * 0.15, 0.12);
    }
  });

  // Continuous zIndex
  const zIndex = useTransform(cardOffset, (offset) => {
    const abs = Math.min(Math.abs(offset), 4);
    return Math.round(Math.max(20 - abs * 5, 0));
  });

  // Continuous image filter
  const filter = useTransform(cardOffset, (offset) => {
    const abs = Math.min(Math.abs(offset), 4);
    const saturateVal = abs <= 1 ? 1.06 - abs * 0.41 : 0.65;
    const brightnessVal = abs <= 1 ? 1 - abs * 0.22 : Math.max(0.55, 0.9 - abs * 0.12);
    return `saturate(${saturateVal}) brightness(${brightnessVal})`;
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

      style={{
        position: "absolute",
        left: "50%",
        top: 0,
        x,
        z: isMobile ? undefined : z,
        rotateY: isMobile ? undefined : rotateY,
        scale,
        opacity,
        zIndex,
        touchAction: "pan-y",
        width: isMobile ? "80%" : "min(44%, 533px)",
        marginLeft: isMobile ? "-40%" : "calc(min(44%, 533px) / -2)",
        height: "100%",
        willChange: "transform, opacity",
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
        <motion.img
          src={product.image}
          alt={product.name}
          loading={slideIndex <= 1 ? "eager" : "lazy"}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            // object-position: top ensures the full outfit / face is visible
            // instead of the centre crop cutting off the head.
            objectPosition: "top center",
            filter,
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
            {!isActive && isAdjacent && (
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

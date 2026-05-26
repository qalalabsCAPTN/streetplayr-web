"use client";

/**
 * PremiumCoverflowCarousel
 *
 * EXPERIMENTAL — isolated behind USE_PREMIUM_CAROUSEL flag.
 * Does NOT replace or modify any existing component.
 *
 * A premium Apple-style 3-D coverflow carousel built with
 * Framer Motion spring physics. Features:
 *   • Real perspective depth  (perspective: 1400–1800px)
 *   • translateX + translateZ + rotateY per card
 *   • Spring physics  stiffness:240 damping:26
 *   • Drag / swipe / wheel / keyboard / dot navigation
 *   • Active card reveals price + CTA; adjacent shows price hint
 *   • Full ARIA carousel pattern
 *   • Respects prefers-reduced-motion
 *   • GPU-only transforms (no layout reflows)
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
} from "react";
import { motion, useMotionValue, useReducedMotion } from "framer-motion";

import PremiumCoverflowCard, {
  PremiumCarouselProduct,
  PremiumCardTransform,
} from "@/components/ui/PremiumCoverflowCard";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PremiumCoverflowCarouselProps {
  products: PremiumCarouselProduct[];
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SWIPE_VELOCITY_THRESHOLD = 280; // px/s
const SWIPE_DISTANCE_THRESHOLD = 48;  // px
const WHEEL_DEBOUNCE_MS = 360;        // ms between wheel-triggered advances

// ─── Transform calculator ─────────────────────────────────────────────────────
//
// Exact formulas, documented here for auditability.
//
// For a card at wrapped offset `o` (signed integer, 0 = active):
//
//   MOBILE:
//     translateX  = o × 73 %                   (% of card width)
//     translateZ  = -|o| × 70 px               (depth recession)
//     rotateY     = sign(o) × min(|o|×12, 32)° (perspective tilt)
//     scale       = 1  if |o|=0  else  max(0.78 - |o|×0.055, 0.56)
//     opacity     = 1  if |o|=0  else  max(0.72 - |o|×0.17, 0.16)
//     zIndex      = max(20 - |o|×5, 0)
//
//   DESKTOP:
//     translateX  = o × 58 %
//     translateZ  = -|o| × 110 px
//     rotateY     = sign(o) × min(|o|×17, 42)°
//     scale       = 1  if |o|=0  else  max(0.75 - |o|×0.065, 0.52)
//     opacity     = 1  if |o|=0  else  max(0.65 - |o|×0.15, 0.12)
//     zIndex      = max(20 - |o|×5, 0)

function calcTransform(offset: number, isMobile: boolean): PremiumCardTransform {
  const abs = Math.min(Math.abs(offset), 4); // clamp beyond 4 cards out
  const sign = Math.sign(offset);

  if (isMobile) {
    return {
      translateXPct: offset * 73,
      translateZpx: -abs * 70,
      rotateYdeg: abs === 0 ? 0 : sign * Math.min(abs * 12, 32),
      scale:   abs === 0 ? 1 : Math.max(0.78 - abs * 0.055, 0.56),
      opacity: abs === 0 ? 1 : Math.max(0.72 - abs * 0.17,  0.16),
      zIndex:  Math.max(20 - abs * 5, 0),
    };
  }

  return {
    translateXPct: offset * 58,
    translateZpx: -abs * 110,
    rotateYdeg: abs === 0 ? 0 : sign * Math.min(abs * 17, 42),
    scale:   abs === 0 ? 1 : Math.max(0.75 - abs * 0.065, 0.52),
    opacity: abs === 0 ? 1 : Math.max(0.65 - abs * 0.15,  0.12),
    zIndex:  Math.max(20 - abs * 5, 0),
  };
}

// ─── Dot indicator ────────────────────────────────────────────────────────────

function PremiumDotIndicator({
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
      aria-label="Carousel slide position"
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
            background: i === active ? "#ddb7ff" : "rgba(234,223,237,0.20)",
            border: "none",
            padding: 0,
            cursor: "pointer",
            flexShrink: 0,
            transition:
              "width 0.35s cubic-bezier(0.16,1,0.3,1), background 0.25s",
            outline: "none",
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

// ─── Arrow button ─────────────────────────────────────────────────────────────

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      aria-label={direction === "prev" ? "Previous product" : "Next product"}
      onClick={onClick}
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "rgba(22,17,27,0.72)",
        border: "1px solid rgba(255,255,255,0.11)",
        color: "rgba(234,223,237,0.70)",
        backdropFilter: "blur(12px)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "border-color 0.2s, color 0.2s, background 0.2s",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = "rgba(221,183,255,0.38)";
        el.style.color = "#ddb7ff";
        el.style.background = "rgba(22,17,27,0.92)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = "rgba(255,255,255,0.11)";
        el.style.color = "rgba(234,223,237,0.70)";
        el.style.background = "rgba(22,17,27,0.72)";
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 0 0 2px rgba(221,183,255,0.5)";
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      {direction === "prev" ? (
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
  );
}

// ─── Main carousel ────────────────────────────────────────────────────────────

export default function PremiumCoverflowCarousel({
  products,
  className = "",
}: PremiumCoverflowCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const isReduced = useReducedMotion() ?? false;
  const dragX = useMotionValue(0);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = products.length;

  // ── Responsive breakpoint ───────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handle = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(!e.matches);
    handle(mq);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const advance = useCallback(
    (dir: 1 | -1) =>
      setActiveIndex((prev) => {
        const next = prev + dir;
        if (next < 0) return count - 1;
        if (next >= count) return 0;
        return next;
      }),
    [count]
  );

  const goTo = useCallback((i: number) => setActiveIndex(i), []);

  // ── Keyboard ────────────────────────────────────────────────────────────────
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

  // ── Mouse wheel ─────────────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (wheelTimerRef.current) return; // debounce
      advance(e.deltaY > 0 ? 1 : -1);
      wheelTimerRef.current = setTimeout(() => {
        wheelTimerRef.current = null;
      }, WHEEL_DEBOUNCE_MS);
    },
    [advance]
  );

  // ── Drag end ────────────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    (
      _: unknown,
      info: { offset: { x: number }; velocity: { x: number } }
    ) => {
      setIsDragging(false);
      const { offset, velocity } = info;
      const byVelocity = Math.abs(velocity.x) > SWIPE_VELOCITY_THRESHOLD;
      const byDistance = Math.abs(offset.x) > SWIPE_DISTANCE_THRESHOLD;
      if (byVelocity || byDistance) {
        advance(offset.x < 0 ? 1 : -1);
      }
      dragX.set(0);
    },
    [advance, dragX]
  );

  if (!count) return null;

  // Desktop height: cards are min(44%, 533px) of container width, portrait 2:3 ≈ ×1.50 taller.
  // So container height = calc(44vw * 1.5) capped at 800px.
  // Mobile: 80vw card × 1.25 (4:5 aspect).
  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: isMobile ? "calc(80vw * 1.25)" : "min(calc(44vw * 1.50), 800px)",
    maxHeight: isMobile ? "600px" : "800px",
    minHeight: isMobile ? "300px" : "420px",
    perspective: isMobile ? "none" : "1800px",
    perspectiveOrigin: "50% 50%",
    overflow: "visible",
    touchAction: "pan-y",
  };

  return (
    <section
      className={`relative w-full select-none ${className}`}
      aria-roledescription="carousel"
      aria-label="Best Sellers"
      onKeyDown={handleKeyDown}
    >
      {/* ── Perspective container ── */}
      <div style={containerStyle} role="region" aria-live="polite">

        {/* ── Render all cards ── */}
        {products.map((product, index) => {
          // Compute shortest wrapped offset for seamless looping feel
          const raw = index - activeIndex;
          const half = count / 2;
          let wrappedOffset = raw;
          while (wrappedOffset > half)  wrappedOffset -= count;
          while (wrappedOffset < -half) wrappedOffset += count;

          return (
            <PremiumCoverflowCard
              key={product.id}
              product={product}
              offset={wrappedOffset}
              transform={calcTransform(wrappedOffset, isMobile)}
              isMobile={isMobile}
              isActive={index === activeIndex}
              isReduced={isReduced}
              onClick={() => goTo(index)}
              slideIndex={index}
              totalSlides={count}
              dragX={dragX}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </div>

      {/* ── Dot indicators ── */}
      <div className="mt-6 md:mt-8">
        <PremiumDotIndicator count={count} active={activeIndex} onSelect={goTo} />
      </div>

      {/* ── Arrow buttons (desktop only) ── */}
      {!isMobile && (
        <div
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 left-0 right-0 z-40 flex justify-between px-3"
          style={{ marginTop: "-24px" }} // nudge above dots
        >
          <ArrowButton
            direction="prev"
            onClick={() => advance(-1)}
          />
          <ArrowButton
            direction="next"
            onClick={() => advance(1)}
          />
        </div>
      )}

      {/* ── Live region for screen readers ── */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        Showing product {activeIndex + 1} of {count}:{" "}
        {products[activeIndex]?.name}
      </div>
    </section>
  );
}

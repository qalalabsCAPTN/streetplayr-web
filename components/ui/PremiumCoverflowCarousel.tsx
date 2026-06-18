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
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
} from "react";
import { motion, useMotionValue, useReducedMotion, animate } from "framer-motion";

import PremiumCoverflowCard, {
  PremiumCarouselProduct,
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
        pointerEvents: "auto",
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
  const progress = useMotionValue(0);
  const dragStartProgress = useRef(0);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const count = products.length;

  const SPRING_DESKTOP = useMemo(() => ({ type: "spring" as const, stiffness: 260, damping: 28, mass: 1 }), []);
  const SPRING_MOBILE  = useMemo(() => ({ type: "spring" as const, stiffness: 400, damping: 36, mass: 1 }), []);
  const transition = useMemo(() => isReduced ? { type: "tween" as const, duration: 0 } : (isMobile ? SPRING_MOBILE : SPRING_DESKTOP), [isReduced, isMobile, SPRING_MOBILE, SPRING_DESKTOP]);

  // Measure container width for responsive drag calculations
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Responsive breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handle = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(!e.matches);
    handle(mq);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  // Sync activeIndex with progress's nearest integer index
  useEffect(() => {
    const unsubscribe = progress.on("change", (latest) => {
      const nearest = Math.round(latest);
      const wrapped = (nearest % count + count) % count;
      setActiveIndex((prev) => (prev !== wrapped ? wrapped : prev));
    });
    return unsubscribe;
  }, [progress, count]);

  // Navigation helpers
  const advance = useCallback(
    (dir: 1 | -1) => {
      if (isDragging) return;
      const currentVal = progress.get();
      const target = currentVal + dir;
      animate(progress, target, {
        ...transition,
        onComplete: () => {
          const wrapped = (target % count + count) % count;
          progress.set(wrapped);
          setActiveIndex(wrapped);
        }
      });
    },
    [progress, count, transition, isDragging]
  );

  const goTo = useCallback(
    (i: number) => {
      if (isDragging) return;
      const currentVal = progress.get();
      
      let diff = i - currentVal;
      const half = count / 2;
      diff = ((diff + half) % count);
      if (diff < 0) diff += count;
      diff -= half;

      const target = currentVal + diff;
      animate(progress, target, {
        ...transition,
        onComplete: () => {
          const wrapped = (target % count + count) % count;
          progress.set(wrapped);
          setActiveIndex(wrapped);
        }
      });
    },
    [progress, count, transition, isDragging]
  );

  // Keyboard
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

  // Mouse wheel
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

  if (!count) return null;

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
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <section
      className={`relative w-full select-none ${className}`}
      aria-roledescription="carousel"
      aria-label="Best Sellers"
      onKeyDown={handleKeyDown}
    >
      {/* ── Perspective drag container ── */}
      <motion.div
        ref={containerRef}
        style={containerStyle}
        role="region"
        aria-live="polite"
        onWheel={handleWheel}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragStart={() => {
          setIsDragging(true);
          dragStartProgress.current = progress.get();
        }}
        onDrag={(event, info) => {
          const cardWidth = isMobile ? containerWidth * 0.8 : Math.min(containerWidth * 0.44, 533);
          const spacingFactor = isMobile ? 0.73 : 0.58;
          const delta = -info.offset.x / (cardWidth * spacingFactor);
          progress.set(dragStartProgress.current + delta);
        }}
        onDragEnd={(event, info) => {
          setIsDragging(false);


          
          const currentVal = progress.get();
          const byVelocity = Math.abs(info.velocity.x) > SWIPE_VELOCITY_THRESHOLD;
          const byDistance = Math.abs(info.offset.x) > SWIPE_DISTANCE_THRESHOLD;
          
          let targetIndex = Math.round(currentVal);
          
          if (byVelocity || byDistance) {
            const direction = info.offset.x < 0 ? 1 : -1;
            targetIndex = direction === 1 ? Math.ceil(currentVal) : Math.floor(currentVal);
          }

          animate(progress, targetIndex, {
            ...transition,
            onComplete: () => {
              const wrapped = (targetIndex % count + count) % count;
              progress.set(wrapped);
              setActiveIndex(wrapped);
            }
          });
        }}
      >
        {/* ── Render all cards ── */}
        {products.map((product, index) => (
          <PremiumCoverflowCard
            key={product.id}
            product={product}
            index={index}
            count={count}
            progress={progress}
            isMobile={isMobile}
            isActive={index === activeIndex}
            activeIndex={activeIndex}
            onClick={() => goTo(index)}
            slideIndex={index}
            totalSlides={count}
          />
        ))}
      </motion.div>

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

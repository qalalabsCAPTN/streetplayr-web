"use client";

/**
 * PremiumCoverflowGallery
 *
 * EXPERIMENTAL — isolated behind USE_PREMIUM_CAROUSEL flag.
 * Does NOT replace or modify any existing component.
 *
 * A premium, highly optimized 2-D CoverFlow image gallery specifically designed 
 * for mobile PDP screens. Features:
 *   • Direct 1:1 real-time finger tracking via Framer Motion drag
 *   • Pan-Y touch-action so vertical page scrolling is buttery smooth
 *   • GPU-only transforms with 0 layout reflows
 *   • Snappy, high-performance spring dynamics
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";

interface PremiumCoverflowGalleryProps {
  images: string[];
  title: string;
  className?: string;
}

// Snappy spring config for mobile touch
const SPRING_GALLERY = { type: "spring" as const, stiffness: 400, damping: 36, mass: 1 };
const INSTANT = { duration: 0.01 };

// Calculate 2D position transforms for mobile gallery images
function calcGalleryTransform(offset: number) {
  const abs = Math.min(Math.abs(offset), 3);
  const sign = Math.sign(offset);

  return {
    translateXPct: offset * 76, // spacing between stacked slides
    scale: abs === 0 ? 1 : Math.max(0.82 - abs * 0.06, 0.64),
    opacity: abs === 0 ? 1 : Math.max(0.72 - abs * 0.20, 0.24),
    zIndex: Math.max(20 - abs * 5, 0),
  };
}

export default function PremiumCoverflowGallery({
  images,
  title,
  className = "",
}: PremiumCoverflowGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const count = images.length;
  const isReduced = useReducedMotion() ?? false;

  const dragX = useMotionValue(0);

  const advance = useCallback(
    (dir: 1 | -1) => {
      setActiveIndex((prev) => {
        const next = prev + dir;
        if (next < 0) return count - 1;
        if (next >= count) return 0;
        return next;
      });
    },
    [count]
  );

  const goTo = useCallback((i: number) => setActiveIndex(i), []);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      setIsDragging(false);
      const { offset, velocity } = info;
      const byVelocity = Math.abs(velocity.x) > 280;
      const byDistance = Math.abs(offset.x) > 48;
      if (byVelocity || byDistance) {
        advance(offset.x < 0 ? 1 : -1);
      }
      dragX.set(0);
    },
    [advance, dragX]
  );

  if (!count) return null;

  return (
    <div className={`w-full ${className}`}>
      {/* ── Perspective Container ── */}
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={`${title} image gallery`}
        style={{
          position: "relative",
          width: "100%",
          // Height = 85vw width * 1.25 (4:5 aspect)
          height: "calc(85vw * 1.25)",
          maxHeight: "560px",
          minHeight: "280px",
          overflow: "visible",
          touchAction: "pan-y",
        }}
      >
        {images.map((src, index) => {
          // Compute wrapped offset for endless loop feel
          const raw = index - activeIndex;
          const half = count / 2;
          let wrappedOffset = raw;
          while (wrappedOffset > half) wrappedOffset -= count;
          while (wrappedOffset < -half) wrappedOffset += count;

          const transform = calcGalleryTransform(wrappedOffset);
          const transition = isReduced ? INSTANT : SPRING_GALLERY;

          return (
            <GalleryCard
              key={index}
              src={src}
              alt={`${title} detail view ${index + 1}`}
              index={index}
              count={count}
              transform={transform}
              transition={transition}
              dragX={dragX}
              isActive={index === activeIndex}
              isReduced={isReduced}
              onClick={() => goTo(index)}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </div>

      {/* ── Dot Indicators ── */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            aria-selected={i === activeIndex}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            style={{
              width: i === activeIndex ? 20 : 6,
              height: 6,
              borderRadius: 99,
              background: i === activeIndex ? "#ddb7ff" : "rgba(255,255,255,0.20)",
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition: "width 0.35s cubic-bezier(0.16,1,0.3,1), background 0.25s",
              outline: "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Individual Gallery Card ───

interface GalleryCardProps {
  src: string;
  alt: string;
  index: number;
  count: number;
  transform: ReturnType<typeof calcGalleryTransform>;
  transition: any;
  dragX: any;
  isActive: boolean;
  isReduced: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: (event: any, info: any) => void;
}

function GalleryCard({
  src,
  alt,
  index,
  count,
  transform,
  transition,
  dragX,
  isActive,
  isReduced,
  onClick,
  onDragStart,
  onDragEnd,
}: GalleryCardProps) {
  const baseXPct = useMotionValue(transform.translateXPct);

  useEffect(() => {
    if (isReduced) {
      baseXPct.set(transform.translateXPct);
    } else {
      animate(baseXPct, transform.translateXPct, transition);
    }
  }, [transform.translateXPct, isReduced, transition, baseXPct]);

  const cardX = useTransform([baseXPct, dragX], ([bx, dx]) => {
    return `calc(${bx}% + ${dx}px)`;
  });

  return (
    <motion.div
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${count}: ${alt}`}
      aria-hidden={!isActive}
      onClick={!isActive ? onClick : undefined}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.10}
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      animate={{
        scale: transform.scale,
        opacity: transform.opacity,
        zIndex: transform.zIndex,
      }}
      transition={transition}
      style={{
        position: "absolute",
        left: "50%",
        top: 0,
        x: cardX,
        touchAction: "pan-y",
        width: "85%", // standard premium wider view for gallery
        marginLeft: "-42.5%",
        height: "100%",
        willChange: "transform, opacity",
        cursor: isActive ? "default" : "pointer",
        borderRadius: 16,
        overflow: "hidden",
        border: isActive ? "1px solid rgba(221,183,255,0.20)" : "1px solid rgba(255,255,255,0.06)",
        background: "#1c1622",
        boxShadow: isActive ? "0 25px 60px rgba(12,6,18,0.50)" : "0 10px 30px rgba(12,6,18,0.20)",
        transition: "border-color 0.4s, box-shadow 0.4s",
      }}
    >
      <img
        src={src}
        alt={alt}
        loading={index === 0 ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          objectPosition: "top center",
          filter: isActive ? "saturate(1) brightness(1)" : "saturate(0.70) brightness(0.60)",
          transition: "filter 0.5s ease",
          willChange: "filter, transform",
        }}
      />
    </motion.div>
  );
}

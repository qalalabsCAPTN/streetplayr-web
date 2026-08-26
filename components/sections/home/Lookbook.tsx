"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { animationController } from "@/lib/AnimationController";
import { LOOKBOOK_SYNC } from "@/lib/lookbook/lookbook-sync";
import LazyVideo from "@/components/ui/LazyVideo";

const AUTOPLAY_DELAY_MS = 3500;
const PAGE_ANIM_DURATION_MS = 750;

/** Uniform card frame — same width + portrait aspect for every slide. */
const LOOKBOOK_CARD_WIDTH = "w-[26vw] min-w-[200px] max-w-[360px]";
const LOOKBOOK_FRAME_ASPECT = "aspect-[3/4]";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-8% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface LookbookItem {
  id: string;
  type: "video" | "youtube" | "placeholder" | "image";
  src: string;
  label: string;
  href?: string;
  widthClass?: string;
}

interface LookbookProps {
  title?: string;
  description?: string;
  items?: LookbookItem[];
}

const defaultLookbookItems: LookbookItem[] = LOOKBOOK_SYNC.map((entry) => ({
  id: `lb-${entry.imageIndex}`,
  type: "image" as const,
  src: `/lookbook/synced/${entry.imageFile.split("/").pop()}`,
  label: entry.name,
  href: entry.url || undefined,
}));

export default function Lookbook({
  title = "Lookbook",
  items,
}: LookbookProps = {}) {
  const activeItems = items && items.length > 0 ? items : defaultLookbookItems;

  const [needsNavigation, setNeedsNavigation] = useState(false);
  const [onScreen, setOnScreen] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const modeRef = useRef<"autoplay" | "animating" | "drag">("autoplay");

  const xRef = useRef(0);
  const targetXRef = useRef(0);
  const loopWidthRef = useRef(0);
  const pageWidthRef = useRef(0);
  const nextAutoplayAtRef = useRef(0);
  const animStartXRef = useRef(0);
  const animTargetXRef = useRef(0);
  const animStartTimeRef = useRef(0);

  const lastTimeRef = useRef(0);

  // Pointer drag state
  const pointerStartXRef = useRef(0);
  const pointerStartYRef = useRef(0);
  const isScrollIntentRef = useRef(false);
  const dragStartTranslationRef = useRef<number | null>(null);
  const dragHistoryRef = useRef<{ x: number; t: number }[]>([]);
  const dragDistanceRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "150px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Define calculateWidths first, before debouncedCalculateWidths
  const calculateWidths = useCallback(() => {
    const el = scrollRef.current; // Viewport container
    const track = trackRef.current;
    if (!el || !track) return;

    const N = activeItems.length;
    if (track.children.length < N * 3) return;

    const item0 = track.children[0] as HTMLElement;
    const itemN = track.children[N] as HTMLElement;
    if (!item0 || !itemN) return;

    const W = itemN.offsetLeft - item0.offsetLeft;
    if (W <= 0) return;

    const oldW = loopWidthRef.current;
    if (oldW > 0 && oldW !== W) {
      // Scale positions proportionally on resize to prevent jumps
      const ratio = xRef.current / oldW;
      xRef.current = ratio * W;
      targetXRef.current = ratio * W;
    }

    loopWidthRef.current = W;

    const viewportWidth = el.clientWidth;
    pageWidthRef.current = viewportWidth;
    setNeedsNavigation(W > viewportWidth);
  }, [activeItems.length]);

  // Debounce calculateWidths to avoid firing on every image load or resize
  const widthCalcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedCalculateWidths = useCallback(() => {
    if (widthCalcTimerRef.current) clearTimeout(widthCalcTimerRef.current);
    widthCalcTimerRef.current = setTimeout(() => {
      calculateWidths();
      widthCalcTimerRef.current = null;
    }, 50);
  }, [calculateWidths]);

  // Snaps translation target to the closest full-page boundary, keeping it in [-2W, -W]
  const findClosestSnapX = useCallback((currentX: number) => {
    const W = loopWidthRef.current;
    const pageW = pageWidthRef.current;
    if (W <= 0 || pageW <= 0) return currentX;

    let norm = currentX;
    while (norm < -2 * W) norm += W;
    while (norm > -W) norm -= W;

    const pagesFromStart = Math.round((-norm - W) / pageW);
    let snapX = -W - pagesFromStart * pageW;
    while (snapX < -2 * W) snapX += W;
    while (snapX > -W) snapX -= W;

    return snapX;
  }, []);

  // Kicks off an eased animation toward a target translation
  const startAnimationTo = useCallback((targetX: number) => {
    animStartXRef.current = xRef.current;
    animTargetXRef.current = targetX;
    animStartTimeRef.current = performance.now();
    targetXRef.current = targetX;
    modeRef.current = "animating";
  }, []);

  // Moves exactly one full carousel "page" (one viewport width)
  const scroll = useCallback((direction: "prev" | "next") => {
    const W = loopWidthRef.current;
    const pageW = pageWidthRef.current;
    if (W <= 0 || pageW <= 0) return;

    // Normalize current position
    let curX = xRef.current;
    while (curX < -2 * W) curX += W;
    while (curX > -W) curX -= W;
    xRef.current = curX;

    const targetX = direction === "next" ? curX - pageW : curX + pageW;
    startAnimationTo(targetX);
  }, [startAnimationTo]);

  // Set up frame animation loop using unified animation coordinator
  useEffect(() => {
    if (!onScreen) {
      animationController.unregister("lookbook-carousel");
      return;
    }

    // Initial width calculation
    calculateWidths();
    nextAutoplayAtRef.current = performance.now() + AUTOPLAY_DELAY_MS;

    // Set starting position to -W
    const W = loopWidthRef.current;
    if (W > 0) {
      xRef.current = -W;
      targetXRef.current = -W;
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${-W}px, 0, 0)`;
      }
    }

    const carouselTick = (deltaTime: number, timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;

      const track = trackRef.current;
      const loopW = loopWidthRef.current;
      const pageW = pageWidthRef.current;

      if (track && loopW > 0 && pageW > 0) {
        if (modeRef.current === "animating") {
          // Eased page movement (cubic ease-out over a fixed duration)
          const elapsed = Math.min(timestamp - animStartTimeRef.current, PAGE_ANIM_DURATION_MS);
          const progress = elapsed / PAGE_ANIM_DURATION_MS;
          const eased = 1 - Math.pow(1 - progress, 3);
          xRef.current = animStartXRef.current + (animTargetXRef.current - animStartXRef.current) * eased;

          if (progress >= 1) {
            xRef.current = animTargetXRef.current;
            modeRef.current = "autoplay";
            nextAutoplayAtRef.current = timestamp + AUTOPLAY_DELAY_MS;
          }
        } else if (modeRef.current === "autoplay") {
          // Normalize back into the [-2W, -W] window (visual no-op, identical copies)
          let norm = xRef.current;
          while (norm < -2 * loopW) norm += loopW;
          while (norm > -loopW) norm -= loopW;
          if (norm !== xRef.current) {
            xRef.current = norm;
            targetXRef.current = norm;
            if (dragStartTranslationRef.current !== null) {
              dragStartTranslationRef.current = norm;
            }
          }

          // Advance one full page after the pause interval
          if (!isHoveredRef.current && loopW > pageW && timestamp >= nextAutoplayAtRef.current) {
            animStartXRef.current = norm;
            animTargetXRef.current = norm - pageW;
            animStartTimeRef.current = timestamp;
            targetXRef.current = animTargetXRef.current;
            modeRef.current = "animating";
          }
        }

        // Apply hardware-accelerated transform
        track.style.transform = `translate3d(${xRef.current}px, 0, 0)`;
      }
    };

    // Register carousel animation with unified controller
    animationController.register("lookbook-carousel", carouselTick);

    return () => {
      animationController.unregister("lookbook-carousel");
      lastTimeRef.current = 0;
    };
  }, [calculateWidths, onScreen]);

  // Recalculate dimensions on window resize (debounced to avoid cascading recalculations)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      debouncedCalculateWidths();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      if (widthCalcTimerRef.current) clearTimeout(widthCalcTimerRef.current);
    };
  }, [debouncedCalculateWidths]);

  // Recalculate dimensions on image or font loads (debounced to batch multiple loads)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const images = Array.from(track.querySelectorAll("img"));
    const handleImageLoad = () => {
      debouncedCalculateWidths();
    };

    images.forEach((img) => {
      if (img.complete) {
        handleImageLoad();
      } else {
        img.addEventListener("load", handleImageLoad);
      }
    });

    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(handleImageLoad);
    }

    return () => {
      images.forEach((img) => {
        img.removeEventListener("load", handleImageLoad);
      });
      if (widthCalcTimerRef.current) clearTimeout(widthCalcTimerRef.current);
    };
  }, [debouncedCalculateWidths, activeItems]);

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return; // Left click only
    isDraggingRef.current = true;
    isScrollIntentRef.current = false;
    modeRef.current = "drag";
    pointerStartXRef.current = e.clientX;
    pointerStartYRef.current = e.clientY;
    dragStartTranslationRef.current = xRef.current;
    dragHistoryRef.current = [{ x: e.clientX, t: performance.now() }];
    dragDistanceRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || dragStartTranslationRef.current === null) return;
    
    const deltaX = e.clientX - pointerStartXRef.current;
    const deltaY = e.clientY - pointerStartYRef.current;

    // Detect scroll intent vs drag intent early
    if (!isScrollIntentRef.current && dragDistanceRef.current === 0) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5) {
        // User is scrolling vertically. Release control to browser.
        isScrollIntentRef.current = true;
        isDraggingRef.current = false;
        modeRef.current = "autoplay";
        return;
      }
      
      // If user clearly started horizontal drag, capture pointer to prevent interference
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
         e.currentTarget.setPointerCapture(e.pointerId);
      }
    }

    if (isScrollIntentRef.current) return;

    if (Math.abs(deltaX) > 5) {
      dragDistanceRef.current = Math.abs(deltaX);
    }
    
    xRef.current = dragStartTranslationRef.current + deltaX;

    const now = performance.now();
    dragHistoryRef.current.push({ x: e.clientX, t: now });
    if (dragHistoryRef.current.length > 5) {
      dragHistoryRef.current.shift();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const history = dragHistoryRef.current;
    let velocity = 0;
    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const dt = last.t - first.t;
      const dx = last.x - first.x;
      velocity = dt > 0 ? dx / dt : 0;
    }

    const target = Math.abs(velocity) > 0.15
      ? findClosestSnapX(xRef.current + velocity * 220)
      : findClosestSnapX(xRef.current);
    startAnimationTo(target);
    dragStartTranslationRef.current = null;
  };

  const handleCaptureClick = (e: React.MouseEvent) => {
    if (dragDistanceRef.current > 6) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <section className="lookbook-section relative py-14 md:py-18 overflow-hidden border-t border-black/[0.06]">
      <div className="px-4 md:px-6 w-full max-w-[min(95vw,2400px)] mx-auto mb-6">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-6 bg-current/20 block opacity-40" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-40">Lookbook</span>
          </div>
          <h2 className="font-display text-[clamp(32px,4.5vw,64px)] uppercase leading-[0.92]">
            {title}
          </h2>
        </FadeIn>
      </div>

      <div className="relative max-w-[min(95vw,2400px)] mx-auto">
        <button
          onClick={() => scroll("prev")}
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => { isHoveredRef.current = false; nextAutoplayAtRef.current = performance.now() + AUTOPLAY_DELAY_MS; }}
          className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/[0.18] text-white/80 hover:text-white hover:bg-black/80 hover:scale-110 active:scale-95 shadow-lg transition-all duration-200 after:content-[''] after:absolute after:-inset-4 ${needsNavigation ? "flex" : "hidden"}`}
          aria-label="Previous lookbook item"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => { isHoveredRef.current = false; nextAutoplayAtRef.current = performance.now() + AUTOPLAY_DELAY_MS; }}
          onTouchStart={() => { isHoveredRef.current = true; }}
          onTouchEnd={() => { isHoveredRef.current = false; nextAutoplayAtRef.current = performance.now() + AUTOPLAY_DELAY_MS; }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClickCapture={handleCaptureClick}
          className="relative w-full overflow-hidden pb-6 cursor-grab active:cursor-grabbing select-none touch-pan-y px-4 md:px-6 max-w-[min(95vw,2400px)] mx-auto"
        >
          <div
            ref={trackRef}
            className="flex items-stretch gap-3 w-max will-change-transform"
          >
            {[...activeItems, ...activeItems, ...activeItems].map((item, index) => {
              const i = index % activeItems.length;
              const widthClass = LOOKBOOK_CARD_WIDTH;
              return (
                <FadeIn key={`${item.id}-${index}`} delay={0.1 * i} className={`${widthClass} shrink-0`}>
                {(() => {
                  const cardClassName = "lookbook-card group flex flex-col h-full transition-colors overflow-hidden rounded-xl";
                  const cardBody = (
                    <>
                  <div className={`lookbook-card__media relative w-full overflow-hidden ${LOOKBOOK_FRAME_ASPECT}`}>
                    <div
                      className="absolute inset-0 lookbook-card__media-wash"
                      aria-hidden
                    />

                    {item.type === "video" && (
                      <LazyVideo
                        className="absolute inset-0 w-full h-full object-cover object-center"
                        src={item.src}
                      />
                    )}
                    {item.type === "youtube" && (
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={item.src}
                        allow="accelerometer; gyroscope"
                        allowFullScreen
                      />
                    )}
                    {item.type === "placeholder" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black/20">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                    {item.type === "image" && (
                      <Image
                        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        src={item.src}
                        alt={item.label}
                        fill
                        sizes="(max-width: 768px) 36vw, (max-width: 1024px) 28vw, 26vw"
                        loading="lazy"
                        style={{ objectFit: "cover", objectPosition: "center center" }}
                      />
                    )}

                    {/* Hover CTA overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-30 flex items-center justify-center">
                      <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <span className="font-mono text-xs tracking-[0.24em] uppercase text-white flex items-center gap-2">
                          Explore
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="lookbook-card__label p-4 shrink-0 min-h-[3.25rem] flex items-center">
                    <span className="lookbook-card__label-text font-mono text-[11px] font-bold uppercase tracking-[0.16em] line-clamp-2">
                      {item.label}
                    </span>
                  </div>
                    </>
                  );
                  return item.href ? (
                    <Link href={item.href} data-card className={cardClassName}>
                      {cardBody}
                    </Link>
                  ) : (
                    <div data-card className={`${cardClassName} cursor-default`}>
                      {cardBody}
                    </div>
                  );
                })()}
              </FadeIn>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => scroll("next")}
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => { isHoveredRef.current = false; nextAutoplayAtRef.current = performance.now() + AUTOPLAY_DELAY_MS; }}
          className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/[0.18] text-white/80 hover:text-white hover:bg-black/80 hover:scale-110 active:scale-95 shadow-lg transition-all duration-200 after:content-[''] after:absolute after:-inset-4 ${needsNavigation ? "flex" : "hidden"}`}
          aria-label="Next lookbook item"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}

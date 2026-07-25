"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { animationController } from "@/lib/AnimationController";

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
  href: string;
  widthClass?: string;
}

interface LookbookProps {
  title?: string;
  description?: string;
  items?: LookbookItem[];
}

const defaultLookbookItems: LookbookItem[] = [
  { id: "lb-1", type: "image" as const, src: "/lookbook/artboard-1.webp", label: "SS25 / STICK NO BILLS", href: "/product/stick-no-bills" },
  { id: "lb-2", type: "image" as const, src: "/lookbook/artboard-2.webp", label: "SS25 / INSPIRED TEE", href: "/product/inspired" },
  { id: "lb-3", type: "image" as const, src: "/lookbook/artboard-3.webp", label: "SS25 / CTT WAFFLE HOODIE", href: "/product/ctt-waffle" },
  { id: "lb-4", type: "image" as const, src: "/lookbook/artboard-4.webp", label: "SS25 / BROWN WARRIOR", href: "/product/brown-warrior" },
  { id: "lb-5", type: "image" as const, src: "/lookbook/artboard-5.webp", label: "SS25 / BLACK WARRIOR", href: "/product/black-warrior" },
  { id: "lb-6", type: "image" as const, src: "/lookbook/artboard-6.webp", label: "SS25 / STICK NO BILLS", href: "/product/stick-no-bills" },
  { id: "lb-7", type: "image" as const, src: "/lookbook/artboard-7.webp", label: "SS25 / INSPIRED TEE", href: "/product/inspired" },
  { id: "lb-8", type: "image" as const, src: "/lookbook/artboard-8.webp", label: "SS25 / CTT WAFFLE HOODIE", href: "/product/ctt-waffle" },
  { id: "lb-9", type: "image" as const, src: "/lookbook/artboard-9.webp", label: "SS25 / BROWN WARRIOR", href: "/product/brown-warrior" },
  { id: "lb-10", type: "image" as const, src: "/lookbook/artboard-10.webp", label: "SS25 / BLACK WARRIOR", href: "/product/black-warrior" }
];

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

  const lastTimeRef = useRef(0);

  // Pointer drag state
  const pointerStartXRef = useRef(0);
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

  // Snaps translation target to closest card offset, keeping it in [-2W, -W]
  const findClosestSnapX = useCallback((currentX: number) => {
    const track = trackRef.current;
    if (!track) return currentX;
    const children = Array.from(track.children) as HTMLElement[];
    if (children.length === 0) return currentX;

    const W = loopWidthRef.current;
    if (W <= 0) return currentX;

    let closestX = currentX;
    let minDiff = Infinity;

    children.forEach((child) => {
      const snapX = -child.offsetLeft;
      let targetSnap = snapX;
      // Normalize targetSnap into the [-2W, -W] range
      while (targetSnap < -2 * W) targetSnap += W;
      while (targetSnap > -W) targetSnap -= W;

      const diff = Math.abs(currentX - targetSnap);
      if (diff < minDiff) {
        minDiff = diff;
        closestX = targetSnap;
      }
    });

    return closestX;
  }, []);

  const scroll = useCallback((direction: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;
    const children = Array.from(track.children) as HTMLElement[];
    if (children.length === 0) return;

    const W = loopWidthRef.current;
    if (W <= 0) return;

    // Normalize current position
    let curX = xRef.current;
    while (curX < -2 * W) curX += W;
    while (curX > -W) curX -= W;

    let nextIndex = 0;
    const N = activeItems.length;

    // Find the current active item index based on closest offset
    let minDiff = Infinity;
    children.forEach((child, idx) => {
      const offset = -child.offsetLeft;
      let targetOffset = offset;
      while (targetOffset < -2 * W) targetOffset += W;
      while (targetOffset > -W) targetOffset -= W;

      const diff = Math.abs(curX - targetOffset);
      if (diff < minDiff) {
        minDiff = diff;
        nextIndex = idx;
      }
    });

    if (direction === "next") {
      nextIndex = (nextIndex + 1) % (N * 3);
    } else {
      nextIndex = (nextIndex - 1 + N * 3) % (N * 3);
    }

    const targetSnap = -children[nextIndex].offsetLeft;
    targetXRef.current = targetSnap;
    modeRef.current = "animating";
  }, [activeItems.length]);

  // Set up frame animation loop using unified animation coordinator
  useEffect(() => {
    if (!onScreen) {
      animationController.unregister("lookbook-carousel");
      return;
    }

    // Initial width calculation
    calculateWidths();

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
      const dt = Math.min(deltaTime, 100);

      const track = trackRef.current;
      const loopW = loopWidthRef.current;

      if (track && loopW > 0) {
        if (modeRef.current === "autoplay") {
          if (!isHoveredRef.current) {
            // Constant autoplay speed (~48px per second at 60Hz)
            const speed = 0.8;
            xRef.current -= speed * (dt / 16.666);
            targetXRef.current = xRef.current;
          }
        } else if (modeRef.current === "animating") {
          // Frame-rate independent lerp
          const damping = 0.12;
          const t = 1 - Math.pow(1 - damping, dt / 16.666);
          xRef.current += (targetXRef.current - xRef.current) * t;

          if (Math.abs(targetXRef.current - xRef.current) < 0.1) {
            xRef.current = targetXRef.current;
            modeRef.current = "autoplay";
          }
        }

        // Boundary wrapping
        if (xRef.current < -2 * loopW) {
          xRef.current += loopW;
          targetXRef.current += loopW;
          if (dragStartTranslationRef.current !== null) {
            dragStartTranslationRef.current += loopW;
          }
        } else if (xRef.current > -loopW) {
          xRef.current -= loopW;
          targetXRef.current -= loopW;
          if (dragStartTranslationRef.current !== null) {
            dragStartTranslationRef.current -= loopW;
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
    if (e.button !== 0) return; // Left click only
    isDraggingRef.current = true;
    modeRef.current = "drag";
    pointerStartXRef.current = e.clientX;
    dragStartTranslationRef.current = xRef.current;
    dragHistoryRef.current = [{ x: e.clientX, t: performance.now() }];
    dragDistanceRef.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || dragStartTranslationRef.current === null) return;
    const deltaX = e.clientX - pointerStartXRef.current;
    dragDistanceRef.current = Math.abs(deltaX);
    xRef.current = dragStartTranslationRef.current + deltaX;

    const now = performance.now();
    dragHistoryRef.current.push({ x: e.clientX, t: now });
    if (dragHistoryRef.current.length > 5) {
      dragHistoryRef.current.shift();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    const history = dragHistoryRef.current;
    let velocity = 0;
    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const dt = last.t - first.t;
      const dx = last.x - first.x;
      velocity = dt > 0 ? dx / dt : 0;
    }

    modeRef.current = "animating";

    if (Math.abs(velocity) > 0.15) {
      const inertiaFactor = 220;
      const target = xRef.current + velocity * inertiaFactor;
      targetXRef.current = findClosestSnapX(target);
    } else {
      targetXRef.current = findClosestSnapX(xRef.current);
    }
    dragStartTranslationRef.current = null;
  };

  const handleCaptureClick = (e: React.MouseEvent) => {
    if (dragDistanceRef.current > 6) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <section className="relative py-14 md:py-18 overflow-hidden border-t border-white/[0.04]">
      <div className="px-4 md:px-6 w-full max-w-[min(95vw,2400px)] mx-auto mb-6">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-6 bg-white/20 block" />
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
          onMouseLeave={() => { isHoveredRef.current = false; }}
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
          onMouseLeave={() => { isHoveredRef.current = false; }}
          onTouchStart={() => { isHoveredRef.current = true; }}
          onTouchEnd={() => { isHoveredRef.current = false; }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClickCapture={handleCaptureClick}
          className="relative w-full overflow-hidden pb-6 cursor-grab active:cursor-grabbing select-none touch-pan-y px-4 md:px-6 max-w-[min(95vw,2400px)] mx-auto h-[52vw] min-h-[320px] max-h-[580px]"
        >
          <div
            ref={trackRef}
            className="flex items-stretch gap-3 w-max h-full will-change-transform"
          >
            {[...activeItems, ...activeItems, ...activeItems].map((item, index) => {
              const i = index % activeItems.length;
              const widthClass = item.widthClass || ['w-[36vw] min-w-[220px] max-w-[560px]', 'w-[22vw] min-w-[160px] max-w-[340px]', 'w-[28vw] min-w-[180px] max-w-[440px]', 'w-[32vw] min-w-[200px] max-w-[500px]'][i % 4];
              return (
                <FadeIn key={`${item.id}-${index}`} delay={0.1 * i} className={`${widthClass} shrink-0 h-full`}>
                <Link
                  href={item.href}
                  data-card
                  className="group flex flex-col h-full bg-[#1f1a23] border border-white/[0.06] hover:border-[#ddb7ff]/20 transition-colors overflow-hidden rounded-xl"
                >
                  <div className="flex-1 relative overflow-hidden bg-[#0a0a0a]">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `
                          radial-gradient(ellipse 70% 60% at 30% 40%, rgba(221,183,255,0.04) 0%, transparent 65%),
                          radial-gradient(ellipse 50% 70% at 70% 30%, rgba(255,255,255,0.03) 0%, transparent 60%),
                          linear-gradient(150deg, #0a0a0a 0%, #060606 50%, #040404 100%)
                        `,
                      }}
                    />
                    <div
                      className="absolute inset-0 opacity-[0.04]"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                      }}
                    />
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        opacity: 0.06,
                        mixBlendMode: "overlay",
                      }}
                    />
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
                      }}
                    />
                    <div className="absolute inset-0 pointer-events-none border border-white/[0.04]" />
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]" />

                    {item.type === "video" && (
                      <video
                        className="absolute inset-0 w-full h-full object-cover"
                        src={item.src}
                        muted
                        loop
                        playsInline
                        preload="none"
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
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/15">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                    {item.type === "image" && (
                      <Image
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        src={item.src}
                        alt={item.label}
                        fill
                        sizes="(max-width: 768px) 36vw, (max-width: 1024px) 28vw, 22vw"
                        loading="lazy"
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
                  <div className="p-4 border-t border-white/[0.05]">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ddb7ff]/70">
                      {item.label}
                    </span>
                  </div>
                </Link>
              </FadeIn>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => scroll("next")}
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => { isHoveredRef.current = false; }}
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

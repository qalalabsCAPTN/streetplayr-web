"use client";

import { useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useScrollNavigation } from "@/components/ui/useScrollNavigation";

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
  { id: "lb-1", type: "image" as const, src: "/assets/lookbook/artboard-1.jpg", label: "SS25 / STICK NO BILLS", href: "/product/stick-no-bills" },
  { id: "lb-2", type: "image" as const, src: "/assets/lookbook/artboard-2.jpg", label: "SS25 / INSPIRED TEE", href: "/product/inspired" },
  { id: "lb-3", type: "image" as const, src: "/assets/lookbook/artboard-3.jpg", label: "SS25 / CTT WAFFLE HOODIE", href: "/product/ctt-waffle" },
  { id: "lb-4", type: "image" as const, src: "/assets/lookbook/artboard-4.jpg", label: "SS25 / BROWN WARRIOR", href: "/product/brown-warrior" },
  { id: "lb-5", type: "image" as const, src: "/assets/lookbook/artboard-5.jpg", label: "SS25 / BLACK WARRIOR", href: "/product/black-warrior" },
  { id: "lb-6", type: "image" as const, src: "/assets/lookbook/artboard-6.jpg", label: "SS25 / STICK NO BILLS", href: "/product/stick-no-bills" },
  { id: "lb-7", type: "image" as const, src: "/assets/lookbook/artboard-7.jpg", label: "SS25 / INSPIRED TEE", href: "/product/inspired" },
  { id: "lb-8", type: "image" as const, src: "/assets/lookbook/artboard-8.jpg", label: "SS25 / CTT WAFFLE HOODIE", href: "/product/ctt-waffle" },
  { id: "lb-9", type: "image" as const, src: "/assets/lookbook/artboard-9.jpg", label: "SS25 / BROWN WARRIOR", href: "/product/brown-warrior" },
  { id: "lb-10", type: "image" as const, src: "/assets/lookbook/artboard-10.jpg", label: "SS25 / BLACK WARRIOR", href: "/product/black-warrior" }
];

export default function Lookbook({
  title = "Lookbook",
  description = "Lookbook",
  items,
}: LookbookProps = {}) {
  const activeItems = items && items.length > 0 ? items : defaultLookbookItems;

  const scrollRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);
  const setWidthRef = useRef(0);
  const { needsNavigation } = useScrollNavigation(scrollRef);

  const scroll = useCallback((direction: "prev" | "next") => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const scrollAmount = card?.offsetWidth ?? 400;

    if (direction === "next") {
      el.scrollBy({ left: scrollAmount, behavior: "smooth" });
    } else {
      el.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  }, []);

  // Autoplay interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (!scrollRef.current || isHovered.current) return;
      const el = scrollRef.current;
      const card = el.querySelector<HTMLElement>("[data-card]");
      const scrollAmount = card?.offsetWidth ?? 400;
      el.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Initialize scroll to middle set and handle seamless wrapping
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const N = activeItems.length;

    const calculateWidth = () => {
      if (el.children.length < N * 3) return 0;
      const item0 = el.children[0] as HTMLElement;
      const itemN = el.children[N] as HTMLElement;
      if (!item0 || !itemN) return 0;
      const width = itemN.offsetLeft - item0.offsetLeft;
      setWidthRef.current = width;
      return width;
    };

    const adjustScroll = () => {
      let setWidth = setWidthRef.current;
      if (setWidth <= 0) {
        setWidth = calculateWidth();
      }
      if (setWidth <= 0) return;

      const scrollLeft = el.scrollLeft;
      const clientWidth = el.clientWidth;

      if (scrollLeft < setWidth - clientWidth) {
        el.scrollLeft += setWidth;
      } else if (scrollLeft > setWidth * 2 - clientWidth) {
        el.scrollLeft -= setWidth;
      }
    };

    const initScroll = () => {
      const setWidth = calculateWidth();
      if (setWidth > 0) {
        el.scrollLeft = setWidth;
      }
    };

    const timer = setTimeout(initScroll, 100);

    el.addEventListener("scroll", adjustScroll, { passive: true });
    const ro = new ResizeObserver(() => {
      calculateWidth();
      adjustScroll();
    });
    ro.observe(el);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", adjustScroll);
      ro.disconnect();
    };
  }, [activeItems.length]);

  return (
    <section className="relative py-14 md:py-18 overflow-hidden border-t border-white/[0.04]">
      <div className="px-4 md:px-8 lg:px-12 max-w-[min(98vw,2560px)] mx-auto mb-6">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-6 bg-white/20 block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">Lookbook</span>
          </div>
          <h2 className="font-display text-[clamp(32px,4.5vw,64px)] uppercase leading-[0.92] text-[#eadfed]">
            {title}
          </h2>
        </FadeIn>
      </div>

      <div className="relative max-w-[min(98vw,2560px)] mx-auto">
        <button
          onClick={() => scroll("prev")}
          onMouseEnter={() => { isHovered.current = true; }}
          onMouseLeave={() => { isHovered.current = false; }}
          className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/[0.18] text-white/80 hover:text-white hover:bg-black/80 hover:scale-110 active:scale-95 shadow-lg transition-all duration-200 after:content-[''] after:absolute after:-inset-4 ${needsNavigation ? "flex" : "hidden"}`}
          aria-label="Previous lookbook item"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          onMouseEnter={() => { isHovered.current = true; }}
          onMouseLeave={() => { isHovered.current = false; }}
          onTouchStart={() => { isHovered.current = true; }}
          onTouchEnd={() => { isHovered.current = false; }}
          className="flex items-stretch gap-3 px-4 md:px-8 lg:px-12 max-w-[min(98vw,2560px)] mx-auto overflow-x-auto pb-6 no-scrollbar h-[52vw] min-h-[320px] max-h-[580px]"
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
                      preload="metadata"
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
                    <img
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={item.src}
                      alt={item.label}
                      loading="lazy"
                      decoding="async"
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

        <button
          onClick={() => scroll("next")}
          onMouseEnter={() => { isHovered.current = true; }}
          onMouseLeave={() => { isHovered.current = false; }}
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

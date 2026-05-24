"use client";

import { useRef, useCallback } from "react";
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

const lookbookItems = [
  {
    id: "vid-1",
    type: "video" as const,
    src: "/assets/lookbook-01.mp4",
    label: "FW26 / Urban Uniform",
    href: "/collections",
    widthClass: "w-[36vw] min-w-[220px] max-w-[560px]",
  },
  {
    id: "yt-1",
    type: "youtube" as const,
    src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    label: "FW26 / Street Protocol",
    href: "/collections",
    widthClass: "w-[22vw] min-w-[160px] max-w-[340px]",
  },
  {
    id: "img-1",
    type: "placeholder" as const,
    src: "",
    label: "FW26 / Night Runner",
    href: "/collections",
    widthClass: "w-[28vw] min-w-[180px] max-w-[440px]",
  },
  {
    id: "img-2",
    type: "placeholder" as const,
    src: "",
    label: "FW26 / Core Edit",
    href: "/collections",
    widthClass: "w-[32vw] min-w-[200px] max-w-[500px]",
  },
];

export default function Lookbook() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { needsNavigation, canScrollPrev, canScrollNext } = useScrollNavigation(scrollRef);

  const scroll = useCallback((direction: "prev" | "next") => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector<HTMLElement>("[data-card]");
    const scrollAmount = card?.offsetWidth ?? 400;
    scrollRef.current.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }, []);

  return (
    <section className="relative py-14 md:py-18 overflow-hidden border-t border-white/[0.04]">
      <div className="px-4 md:px-8 lg:px-12 max-w-[min(98vw,2560px)] mx-auto mb-6">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-6 bg-white/20 block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">Lookbook</span>
          </div>
          <h2 className="font-display text-[clamp(32px,4.5vw,64px)] uppercase leading-[0.92] text-[#eadfed]">
            Lookbook
          </h2>
        </FadeIn>
      </div>

      <div className="relative">
        <button
          onClick={() => scroll("prev")}
          className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 place-items-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/[0.12] text-white/70 hover:text-white hover:bg-black/70 transition-all ${needsNavigation && canScrollPrev ? "hidden md:grid" : "hidden"}`}
          aria-label="Previous lookbook item"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="flex items-stretch gap-3 px-4 md:px-8 lg:px-12 max-w-[min(98vw,2560px)] mx-auto overflow-x-auto pb-6 no-scrollbar h-[52vw] min-h-[320px] max-h-[580px]"
        >
          {lookbookItems.map((item, i) => (
            <FadeIn key={item.id} delay={0.1 * i} className={`${item.widthClass} shrink-0 h-full`}>
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
          ))}
        </div>

        <button
          onClick={() => scroll("next")}
          className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 place-items-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/[0.12] text-white/70 hover:text-white hover:bg-black/70 transition-all ${needsNavigation && canScrollNext ? "hidden md:grid" : "hidden"}`}
          aria-label="Next lookbook item"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}

"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

/* ── FadeIn helper ── */
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-5% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Serpentine Timeline Data (11 key milestones with custom SVGs matching the slide exactly) ── */
const TIMELINE_ITEMS = [
  // ROW 0: (Col 0, 1, 2, 3) - sits ABOVE the timeline rail
  {
    period: "2021 - November",
    title: "playR Apparel Launch",
    details: ["Kitting and Clothing partner of Bihar Cricket Association"],
    row: 0,
    col: 0,
    position: "above" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46L16 6.14V4a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2.14L3.62 3.46a2 2 0 0 0-2.41.67L.13 5.67a2 2 0 0 0 .37 2.46l4.5 4.5V20a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7.37l4.5-4.5a2 2 0 0 0 .37-2.46l-1.08-1.54a2 2 0 0 0-2.41-.67z" />
      </svg>
    )
  },
  {
    period: "2022 - January",
    title: "playR Cricket Gear Launch",
    details: ["Launch of our first cricket gear range for players"],
    row: 0,
    col: 1,
    position: "above" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="2" x2="22" y2="6" />
        <path d="M7.5 16.5L18 6l4 4L11.5 20.5H7.5v-4z" />
        <path d="M3.5 20.5L2 22" />
      </svg>
    )
  },
  {
    period: "2022 - April",
    title: "playR Bicycles & Accessories Launch",
    details: ["Premium bicycles and accessories line introduced"],
    row: 0,
    col: 2,
    position: "above" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path d="M15 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-3 11.5V11h5.5l2-3.5" />
        <path d="M5.5 17.5L10 11l2-4h5" />
      </svg>
    )
  },
  {
    period: "2023 - January",
    title: "Chennai Super Kings",
    details: ["Exclusive Partner of Player Wear Merchandise"],
    row: 0,
    col: 3,
    position: "above" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
        <path d="M3 20h18" />
      </svg>
    )
  },
  // ROW 1: (Col 0, 1, 2) - sits BELOW the timeline rail
  {
    period: "2023 - February",
    title: "Rajasthan Royals",
    details: [
      "Exclusive Partner of Player Wear Merchandise",
      "GMR India Legends league Exclusive Equipment Partnership"
    ],
    row: 1,
    col: 0,
    position: "below" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polygon points="12 11 14 13.5 13 16 12 14.5 11 16 10 13.5" />
      </svg>
    )
  },
  {
    period: "2023 - March",
    title: "playR B2B Corporate Licensing",
    details: ["Punjab Kings Global Cricket Gear License Merchandise"],
    row: 1,
    col: 1,
    position: "below" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    )
  },
  {
    period: "2024 - February",
    title: "playR Launch D2C",
    details: [
      "playR Launch D2C and E-commerce marketplace",
      "playR Quick Commerce Launch"
    ],
    row: 1,
    col: 2,
    position: "below" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    )
  },
  // ROW 2: (Col 0, 1, 2, 3) - sits BELOW the timeline rail
  {
    period: "2025 - February",
    title: "Pickleball Association",
    details: [
      "Bengaluru Jawans & Chennai Superchamps",
      "Gujarat Titans (GT) Association",
      "Sunrisers Hyderabad (SRH) Association"
    ],
    row: 2,
    col: 0,
    position: "below" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="9" r="6" />
        <path d="M12 15v7" />
        <path d="M9 22h6" />
        <path d="M8 7h8" />
        <path d="M10 11h4" />
      </svg>
    )
  },
  {
    period: "2025 - June",
    title: "Kabaddi",
    details: ["UP Yoddhas Kitting & Partner", "Merchandise Partner"],
    row: 2,
    col: 1,
    position: "below" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    period: "2025 - November",
    title: "Urban Capitals Kitting",
    details: [
      "Allepey Ripples Kitting & Clothing supplier",
      "Brawl Legends Cup Clothing supplier",
      "OCR+ Clothing supplier"
    ],
    row: 2,
    col: 2,
    position: "below" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    )
  },
  {
    period: "2026",
    title: "The Expansion",
    details: [
      "Launch of Gym & Fitness Products",
      "Launch of Pickle Ball Products",
      "Launch of STREET playR & Swimming Products",
      "More Leagues & Association Tie-ups"
    ],
    row: 2,
    col: 3,
    position: "below" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    )
  }
] as const;

/* ── 4 Premium Brand Value Pillars at bottom ── */
const VALUE_PILLARS = [
  {
    title: "Built on Purpose",
    desc: "Every step we take is driven by purpose and athlete-first thinking.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    )
  },
  {
    title: "Driven by Innovation",
    desc: "We innovate to create gear that performs, inspires and lasts.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5L12 2l7.5 14.5-7.5-3-7.5 3z" />
        <path d="M12 13.5v8.5" />
      </svg>
    )
  },
  {
    title: "Rooted in Trust",
    desc: "From partnerships to products, trust is the foundation of everything we build.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 11l2 2 4-4" />
      </svg>
    )
  },
  {
    title: "Growing Together",
    desc: "With athletes, partners and communities — we grow stronger, together.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    )
  }
] as const;

export default function Journey() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Mobile show-more toggling state
  const [showAllMobile, setShowAllMobile] = useState(false);
  const visibleMobileItems = showAllMobile ? TIMELINE_ITEMS : TIMELINE_ITEMS.slice(0, 5);

  /**
   * DESKTOP COORDINATE SYSTEM
   * ─────────────────────────
   * Pure percentage-based — NO transform:scale().
   * SVG viewBox "0 0 1000 1000" + preserveAspectRatio="none".
   * Mapping: SVG_x = leftPercent × 10, SVG_y = topPercent × 10.
   * Nodes positioned with CSS left/top %. Path uses same values × 10.
   * Result: nodes are pixel-perfect on the rail at any viewport width.
   *
   * Column positions (% of container width):
   *   Col 0 → 16%    (SVG x = 160)
   *   Col 1 → 38.67% (SVG x = 387)
   *   Col 2 → 61.33% (SVG x = 613)
   *   Col 3 → 84%    (SVG x = 840)
   * Row Y positions (% of 1300px container):
   *   Row 0 → 22%  (SVG y = 220)
   *   Row 1 → 47%  (SVG y = 470)
   *   Row 2 → 75%  (SVG y = 750)
   */
  const COL_X = [16, 38.67, 61.33, 84];
  const COL_STEP = COL_X[1] - COL_X[0]; // 22.67 — row1 stagger = half of this
  const ROW_Y = [22, 47, 75];
  const desktopPathLength = 2900;

  const getDesktopCoords = (item: (typeof TIMELINE_ITEMS)[number]) => {
    const leftPercent =
      item.row === 1 ? COL_X[item.col] + COL_STEP / 2 : COL_X[item.col];
    const topPercent = ROW_Y[item.row];
    // Row 0 cards float ABOVE the rail. Rows 1 & 2 hang BELOW.
    const position = item.row === 0 ? ("above" as const) : ("below" as const);
    return { leftPercent, topPercent, position };
  };

  // Bottom Carousel Mouse-Drag Scrolling Logic (Desktop Values Carousel)
  const carouselRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - carouselRef.current.offsetLeft;
    scrollLeft.current = carouselRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    carouselRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  return (
    <section className="relative py-28 sm:py-36 w-full max-w-none mx-auto border-t border-[var(--fg-04)] overflow-hidden">

      <div className="px-4 md:px-6 w-full max-w-[min(95vw,2400px)] mx-auto relative z-10">

        {/* Section Header */}
        <FadeIn className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-6 bg-[var(--fg-20)] block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ddb7ff]">
              The Journey
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-7">
              <h2 className="font-display text-[clamp(44px,5vw,84px)] leading-[0.95] tracking-[0.01em] uppercase text-[var(--fg)] max-w-[15ch]">
                From One Cricket Kit to Every Sport.
              </h2>
            </div>
            <div className="lg:col-span-5 lg:pl-10 pb-1.5">
              <p className="font-body text-[15px] leading-relaxed text-[var(--fg-50)] tracking-wide font-light max-w-[460px]">
                Our journey is built on passion, performance and purpose. From a single kit to a movement that empowers every athlete.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* ── DESKTOP TIMELINE: Pure % coordinate system, no transform:scale ──
            Container: 1300px tall.
            Row 0 at 22% = 286px → row-0 cards float above from ~256px up to ~56px ✓
            Row 1 at 47% = 611px → row-1 cards hang below from 641px to ~831px ✓
            Row 2 at 75% = 975px → row-2 cards hang below from 1005px to ~1267px ✓
            SVG path (viewBox 0 0 1000 1000, preserveAspectRatio=none):
              Row 0 (y=220): x=40→840. Nodes: 160,387,613,840 ✓
              Right curve: (840,220)→(840,470) via ctrl (960,220),(960,470)
              Row 1 (y=470): x=840→160. Nodes: 273,500,727 ✓
              Left curve: (160,470)→(160,750) via ctrl (50,470),(50,750)
              Row 2 (y=750): x=160→840. Nodes: 160,387,613,840 ✓ */}
        <div
          className="hidden lg:block relative w-full"
          style={{ height: "1300px" }}
        >
          {/* SVG Rail */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              viewBox="0 0 1000 1000"
              className="w-full h-full"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="journey-rail-v8" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ddb7ff" />
                  <stop offset="35%" stopColor="#dfba89" />
                  <stop offset="65%" stopColor="#dfba89" />
                  <stop offset="100%" stopColor="#ddb7ff" />
                </linearGradient>
                <filter id="rail-glow-v8" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <motion.path
                d="M 40 220 L 840 220 C 960 220, 960 470, 840 470 L 160 470 C 50 470, 50 750, 160 750 L 840 750"
                stroke="url(#journey-rail-v8)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={desktopPathLength}
                initial={{ strokeDashoffset: desktopPathLength }}
                whileInView={{ strokeDashoffset: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 2.8, ease: [0.16, 1, 0.3, 1] }}
                filter="url(#rail-glow-v8)"
              />
              <motion.circle
                cx="40" cy="220" r="5"
                fill="#dfba89"
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ filter: "drop-shadow(0 0 8px #dfba89)" }}
              />
            </svg>
          </div>

          {/* Nodes + Cards */}
          {TIMELINE_ITEMS.map((item, i) => {
            const { leftPercent, topPercent, position } = getDesktopCoords(item);
            return (
              <div key={i}>
                {/* Vertical connector: card ↔ node */}
                <div
                  className="absolute pointer-events-none z-10"
                  style={{
                    left: `${leftPercent}%`,
                    transform: "translateX(-50%)",
                    width: "1px",
                    ...(position === "above"
                      ? {
                          bottom: `calc(${100 - topPercent}% + 3px)`,
                          height: "30px",
                          background:
                            "linear-gradient(to bottom, rgba(223,186,137,0.05), rgba(223,186,137,0.75))",
                        }
                      : {
                          top: `calc(${topPercent}% + 3px)`,
                          height: "30px",
                          background:
                            "linear-gradient(to bottom, rgba(223,186,137,0.75), rgba(223,186,137,0.05))",
                        }),
                  }}
                />

                {/* Node — left/top % = SVG path x/10, y/10 → perfect alignment */}
                <motion.div
                  className="absolute rounded-full border-2 border-[#dfba89] bg-[var(--panel)] cursor-pointer z-20 flex items-center justify-center"
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    transform: "translate(-50%, -50%)",
                    width: "20px",
                    height: "20px",
                    boxShadow: "0 0 14px rgba(223,186,137,0.35)",
                  }}
                  whileHover={{ scale: 1.45, boxShadow: "0 0 28px rgba(223,186,137,0.7)" }}
                  onHoverStart={() => setHoveredIndex(i)}
                  onHoverEnd={() => setHoveredIndex(null)}
                >
                  <motion.div
                    className="rounded-full bg-[var(--fg)]"
                    style={{ width: "6px", height: "6px" }}
                    animate={{
                      scale: hoveredIndex === i ? [1, 1.5, 1] : 1,
                      backgroundColor: hoveredIndex === i ? "#ddb7ff" : "var(--fg)",
                    }}
                    transition={{ duration: 0.6, repeat: hoveredIndex === i ? Infinity : 0 }}
                  />
                </motion.div>

                {/* Card — 300px wide, verified safe at lg+ (no overflow) */}
                <motion.div
                  className="absolute z-10 bg-[var(--panel-90)] border border-[var(--fg-09)] backdrop-blur-xl rounded-xl p-5 pt-10 shadow-[0_16px_48px_rgba(0,0,0,0.65)] hover:border-[#dfba89]/25 transition-colors duration-300"
                  style={{
                    left: `${leftPercent}%`,
                    transform: "translateX(-50%)",
                    width: "300px",
                    ...(position === "above"
                      ? { bottom: `calc(${100 - topPercent}% + 30px)` }
                      : { top: `calc(${topPercent}% + 30px)` }),
                  }}
                  initial={{ opacity: 0, y: position === "above" ? -14 : 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-5% 0px" }}
                  transition={{ duration: 0.85, delay: i * 0.045, ease: [0.16, 1, 0.3, 1] }}
                  animate={{
                    opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.25,
                    y: hoveredIndex === i ? (position === "above" ? -3 : 3) : 0,
                  }}
                  >
                    {/* Icon badge on top border */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-[#dfba89]/40 bg-[var(--panel)] flex items-center justify-center text-[#dfba89] shadow-[0_0_12px_rgba(223,186,137,0.25)] z-10">
                      {item.icon}
                    </div>

                    {/* Date */}
                    <span className="font-mono text-[11px] font-semibold tracking-[0.18em] leading-[1.2] text-[var(--fg-72)] uppercase block mb-1.5 text-center">
                      {item.period.toUpperCase().replace(" - ", " • ")}
                    </span>

                    {/* Title */}
                    <h3 className="font-display text-[18px] uppercase text-[var(--fg-95)] tracking-[-0.01em] leading-[1.1] mb-3.5 font-extrabold text-center">
                      {item.title}
                    </h3>

                    {/* Description — wraps naturally, no truncation */}
                    <div className="space-y-[10px] text-left">
                      {item.details.map((detail, di) => {
                        const text = detail.startsWith("- ") ? detail.slice(2) : detail;
                        return (
                          <p key={di} className="font-body text-[14px] leading-[1.65] text-[var(--fg-82)] tracking-normal flex items-start gap-2.5 font-medium">
                            <span className="flex-shrink-0 mt-[3px]">—</span>
                            <span>{text}</span>
                          </p>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              );
            })}
        </div>

        {/* ── MOBILE TIMELINE ── */}
        <div className="block lg:hidden w-full relative z-10">
          <div className="relative w-full py-6 flex flex-col items-center">
            
            {/* Centered vertical gold gradient rail line */}
            <div className="absolute left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#ddb7ff] via-[#dfba89] to-[#ddb7ff] -translate-x-1/2" />

            {/* Loop mobile items chronologically */}
            {visibleMobileItems.map((item, i) => (
              <div key={i} className="relative w-full max-w-[420px] mb-12 flex flex-col items-center">
                
                {/* Node dot centered exactly on vertical timeline rail */}
                <div className="w-5.5 h-5.5 rounded-full border-2 border-[#dfba89] bg-[var(--panel)] z-20 flex items-center justify-center mb-5 shadow-[0_0_12px_rgba(223,163,137,0.3)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--fg)]" />
                </div>

                {/* Mobile screen-fitting full card sitting below center node */}
                <motion.div
                  className="w-full bg-[var(--panel-60)] border border-[var(--fg-08)] backdrop-blur-md rounded-2xl p-5 flex flex-col items-center text-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10% 0px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Circular gold icon at top of card */}
                  <div className="w-11 h-11 rounded-full border border-[#dfba89]/40 bg-[var(--panel)] flex items-center justify-center text-[#dfba89] mb-3.5">
                    {item.icon}
                  </div>

                  {/* Period/Date */}
                  <span className="font-mono text-[11px] font-semibold tracking-[0.18em] leading-[1.2] text-[var(--fg-72)] uppercase block mb-1.5">
                    {item.period.toUpperCase().replace(" - ", " • ")}
                  </span>
                  
                  {/* Milestone Title */}
                  <h3 className="font-display text-[18px] uppercase text-[var(--fg-95)] font-extrabold leading-[1.1] mb-3.5 tracking-[-0.01em]">
                    {item.title}
                  </h3>
                  
                  {/* High contrast, legible body text */}
                  <div className="space-y-[10px] w-full px-2">
                    {item.details.map((detail, di) => (
                      <p
                        key={di}
                        className="font-body text-[14px] leading-[1.65] text-[var(--fg-82)] tracking-normal font-medium text-center"
                      >
                        <span className="mr-1.5">—</span>
                        {detail}
                      </p>
                    ))}
                  </div>
                </motion.div>
                
              </div>
            ))}

            {/* "+ More Milestones" custom expander button matching mockup exactly */}
            {!showAllMobile && (
              <div className="relative w-full max-w-[420px] mt-4 flex justify-center z-30">
                <button
                  onClick={() => setShowAllMobile(true)}
                  className="w-full py-4.5 rounded-xl border border-[var(--fg-08)] bg-[var(--panel-40)] hover:bg-[var(--panel-80)] hover:border-[#dfba89]/30 transition-all font-mono text-[11px] tracking-[0.25em] text-[#dfba89] uppercase font-bold backdrop-blur-sm active:scale-[0.98] shadow-lg"
                >
                  + 6 More Milestones
                </button>
              </div>
            )}

          </div>
        </div>

        {/* ── 3. VALUES SECTION: Premium Snapping Carousel (All Devices) ── */}
        <div className="mt-16 md:mt-24 relative z-10 border-t border-[var(--fg-05)] pt-12 md:pt-16 w-full mx-auto">
          
          {/* Unified Carousel View: Premium Mouse-Drag & Momentum Snapping Carousel */}
          <div 
            ref={carouselRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory py-4 md:py-6 cursor-grab active:cursor-grabbing select-none w-full scroll-smooth"
          >
            {VALUE_PILLARS.map((val, vi) => (
              <div 
                key={vi} 
                className="snap-start flex-shrink-0 bg-[var(--panel-75)] border border-[var(--fg-12)] backdrop-blur-xl shadow-lg rounded-2xl p-6 md:p-7 flex flex-col items-start hover:border-[#dfba89]/30 transition-all duration-300 w-[85vw] sm:w-[340px] md:w-[calc((100%-24px*1)/2)] lg:w-[calc((100%-24px*2)/3)] xl:w-[calc((100%-24px*3)/4)]"
              >
                
                {/* Circular Gold Icon */}
                <div className="w-12 h-12 rounded-full border border-[#dfba89]/30 bg-[var(--panel)] flex items-center justify-center text-[#dfba89] mb-5">
                  {val.icon}
                </div>

                {/* Title */}
                <h4 className="font-display text-[15.5px] uppercase text-[var(--fg-95)] tracking-[-0.01em] leading-[1.1] font-extrabold mb-3">
                  {val.title}
                </h4>

                {/* Description */}
                <p className="font-body text-[14px] leading-[1.65] text-[var(--fg-82)] tracking-normal font-medium max-w-[280px]">
                  {val.desc}
                </p>
                
              </div>
            ))}
          </div>

        </div>

      </div>

    </section>
  );
}

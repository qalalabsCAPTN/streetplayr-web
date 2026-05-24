"use client";

import { useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { useScrollNavigation } from "@/components/ui/useScrollNavigation";

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

/* ── Data ── */
const ERAS = [
  {
    number: "01",
    name: "The\nBeginning",
    period: "2021",
    tag: "Origin",
    milestones: [
      { label: "playR Apparel Launch", date: "Nov 2021" },
      { label: "Bihar Cricket Association — Kitting & Clothing Partner", date: "Nov 2021" },
    ],
  },
  {
    number: "02",
    name: "Cricket\nFirst",
    period: "2022",
    tag: "Sport",
    milestones: [
      { label: "Cricket Gear Launch", date: "Jan 2022" },
      { label: "Mumbai Indians — Player Wear Replica License (International)", date: "Jan 2022" },
      { label: "Bicycles & Accessories Launch", date: "Apr 2022" },
      { label: "Mumbai Indians — Global Exclusive Cricket Gear License Merchandise", date: "Apr 2022" },
    ],
  },
  {
    number: "03",
    name: "IPL\nDominance",
    period: "2023",
    tag: "Scale",
    milestones: [
      { label: "Chennai Super Kings — Exclusive Player Wear Partner", date: "Jan 2023" },
      { label: "Rajasthan Royals — Exclusive Player Wear Partner", date: "Feb 2023" },
      { label: "GMR India Legends League — Exclusive Equipment Partnership", date: "Feb 2023" },
      { label: "B2B Corporate Launch", date: "Mar 2023" },
      { label: "Punjab Kings — Global Exclusive Cricket Gear License Merchandise", date: "Mar 2023" },
    ],
  },
  {
    number: "04",
    name: "Going\nDirect",
    period: "2024",
    tag: "Consumer",
    milestones: [
      { label: "Punjab Kings — Player Wear + Kitting & Clothing Partner", date: "Jan 2024" },
      { label: "Kolkata Knight Riders — Exclusive Player Wear Partner", date: "Jan 2024" },
      { label: "D2C & E-commerce Platform — Live", date: "Feb 2024" },
      { label: "Quick Commerce Launch", date: "Feb 2024" },
    ],
  },
  {
    number: "05",
    name: "Multi\nSport",
    period: "2025",
    tag: "Expansion",
    milestones: [
      { label: "Pickleball — Bengaluru Jawans & Chennai Superchamps", date: "Feb 2025" },
      { label: "Gujarat Titans — Association Partner", date: "Feb 2025" },
      { label: "Sunrisers Hyderabad — Association Partner", date: "Feb 2025" },
      { label: "Kabaddi — UP Yoddhas Kitting & Merchandise Partner", date: "Jun 2025" },
      { label: "Dubai Capitals — International Kitting Supplier", date: "Nov 2025" },
      { label: "Allepey Ripples — Kitting & Clothing Supplier", date: "Nov 2025" },
      { label: "BnW Legends Cup — Clothing Supplier", date: "Nov 2025" },
      { label: "OGPL — Clothing Supplier", date: "Nov 2025" },
    ],
  },
  {
    number: "06",
    name: "The\nExpansion",
    period: "2026",
    tag: "Future",
    milestones: [
      { label: "Gym & Fitness Products", date: "2026" },
      { label: "Pickleball Products", date: "2026" },
      { label: "STREET playR — Full Launch", date: "2026" },
      { label: "Swimming Products", date: "2026" },
      { label: "More Leagues & Association Tie-ups", date: "2026" },
    ],
  },
] as const;

/* ── Mobile era card — animated vertical timeline entry ── */
function MobileEraCard({
  era,
  isLast,
}: {
  era: (typeof ERAS)[number];
  index: number;
  isLast: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <div ref={ref} className={`relative flex gap-0 ${isLast ? "pb-4" : "pb-16"}`}>

      {/* Left gutter — square marker on hairline */}
      <div className="relative flex-shrink-0 w-[54px] pt-1">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-[9px] h-[9px] bg-[#ddb7ff]/50 ml-[23px] mt-[5px]"
        />
      </div>

      {/* Right — content */}
      <div className="flex-1 min-w-0 relative overflow-hidden">

        {/* Background era-number watermark */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="absolute -right-2 -top-6 font-display text-[100px] leading-none text-white/[0.025] uppercase select-none pointer-events-none"
          aria-hidden
        >
          {era.number}
        </motion.span>

        {/* Meta: number · period · tag */}
        <motion.span
          initial={{ opacity: 0, x: 16 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="font-mono text-[8px] tracking-[0.38em] text-[#ddb7ff]/30 uppercase block mb-2.5"
        >
          {era.number}&nbsp;&nbsp;·&nbsp;&nbsp;{era.period}&nbsp;&nbsp;·&nbsp;&nbsp;{era.tag}
        </motion.span>

        {/* Era title */}
        <motion.h3
          initial={{ opacity: 0, x: 20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[38px] uppercase text-[#eadfed] leading-[0.88] whitespace-pre-line"
        >
          {era.name}
        </motion.h3>

        {/* Expanding separator */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ originX: 0 }}
          className="h-px w-full bg-white/[0.07] mt-4 mb-4"
        />

        {/* Milestones — stagger in one by one */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.08, delayChildren: 0.38 },
            },
          }}
          className="space-y-3"
        >
          {era.milestones.map((m, mi) => (
            <motion.div
              key={mi}
              variants={{
                hidden: { opacity: 0, x: 16 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              className="flex items-baseline justify-between gap-3"
            >
              <p className="font-body text-[12.5px] leading-relaxed text-white/[0.48] flex-1 min-w-0">
                <span className="text-[#ddb7ff]/25 mr-1.5">—</span>
                {m.label}
              </p>
              <span className="font-mono text-[8px] text-white/[0.18] whitespace-nowrap flex-shrink-0 tabular-nums">
                {m.date}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ── Main export ── */
export default function Journey() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { needsNavigation, canScrollPrev, canScrollNext } = useScrollNavigation(scrollRef);

  const scroll = useCallback((dir: "prev" | "next") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "next" ? 380 : -380,
      behavior: "smooth",
    });
  }, []);

  return (
    <section className="relative py-28 sm:py-36 w-full max-w-[min(95vw,2400px)] mx-auto border-t border-white/[0.04]">

      {/* ── Section header ── */}
      <FadeIn className="px-4 md:px-6 mb-16">
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px w-6 bg-white/20 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
            The Journey
          </span>
        </div>
        <h2 className="font-display text-[clamp(38px,5vw,86px)] leading-[0.88] tracking-[0.01em] uppercase text-[#eadfed]">
          From One Cricket Kit to Every Sport.
        </h2>
      </FadeIn>

      {/* ── DESKTOP: horizontal scroll timeline ── */}
      <div className="hidden md:block">
        <div ref={scrollRef} className="overflow-x-auto no-scrollbar px-4 md:px-6 pb-8">
          <div className="relative flex">

            {/* Continuous hairline */}
            <div className="absolute top-[13px] left-0 right-0 h-px bg-white/[0.09]" />

            {ERAS.map((era, i) => (
              <motion.div
                key={era.number}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-5% 0px" }}
                transition={{ duration: 0.9, delay: 0.07 * i, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex-shrink-0 w-[300px] lg:w-[340px] xl:w-[380px] 2xl:w-[420px]"
              >
                {/* Era marker — square sits on the hairline */}
                <div className="w-[8px] h-[8px] bg-[#ddb7ff]/40 mt-[9px] mb-7 relative z-10 flex-shrink-0" />

                <div className="pr-8 2xl:pr-10">
                  <span className="font-mono text-[8px] tracking-[0.38em] text-[#ddb7ff]/30 uppercase block mb-4">
                    {era.number}&nbsp;&nbsp;·&nbsp;&nbsp;{era.period}
                  </span>
                  <h3 className="font-display text-[clamp(30px,2.6vw,46px)] uppercase text-[#eadfed] leading-[0.88] tracking-[0.01em] whitespace-pre-line mb-1">
                    {era.name}
                  </h3>
                  <span className="font-mono text-[8px] tracking-[0.28em] text-white/[0.18] uppercase block mb-5">
                    {era.tag}
                  </span>
                  <div className="space-y-2">
                    {era.milestones.map((m, mi) => (
                      <p key={mi} className="font-body text-[11.5px] leading-relaxed text-white/[0.44] tracking-wide">
                        <span className="text-[#ddb7ff]/[0.22] mr-1.5">—</span>
                        {m.label}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Scroll nav */}
        {needsNavigation && (
          <div className="flex items-center justify-end gap-2 px-4 md:px-6 mt-2">
            <button
              onClick={() => scroll("prev")}
              disabled={!canScrollPrev}
              className="w-9 h-9 flex items-center justify-center border border-white/[0.10] text-white/40 hover:text-white/70 hover:border-white/25 transition-all disabled:opacity-20 disabled:pointer-events-none"
              aria-label="Previous eras"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={() => scroll("next")}
              disabled={!canScrollNext}
              className="w-9 h-9 flex items-center justify-center border border-white/[0.10] text-white/40 hover:text-white/70 hover:border-white/25 transition-all disabled:opacity-20 disabled:pointer-events-none"
              aria-label="Next eras"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ── MOBILE: animated vertical timeline ── */}
      <div className="md:hidden relative">
        {/* Continuous vertical hairline */}
        <div className="absolute left-[27px] top-0 bottom-0 w-px bg-white/[0.08]" />

        <div className="px-4">
          {ERAS.map((era, i) => (
            <MobileEraCard
              key={era.number}
              era={era}
              index={i}
              isLast={i === ERAS.length - 1}
            />
          ))}
        </div>
      </div>

    </section>
  );
}

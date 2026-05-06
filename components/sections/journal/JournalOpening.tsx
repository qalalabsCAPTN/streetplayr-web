"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function JournalOpening() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.62], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-[#050505]"
      aria-label="Journal opening"
    >
      {/* Parallax atmospheric background — slightly cooler than lookbook */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 h-[115%] w-full"
      >
        <div
          className="h-full w-full"
          style={{
            background: `
              radial-gradient(ellipse 70% 55% at 30% 30%, rgba(255,255,255,0.05) 0%, transparent 60%),
              radial-gradient(ellipse 50% 70% at 80% 65%, rgba(255,255,255,0.03) 0%, transparent 55%),
              radial-gradient(ellipse 30% 30% at 10% 85%, rgba(212,255,30,0.02) 0%, transparent 50%),
              linear-gradient(155deg, #0c0c0c 0%, #050505 50%, #020202 100%)
            `,
          }}
        />
        {/* Cross-light slash — different angle from lookbook */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(95deg, transparent 20%, rgba(255,255,255,0.014) 42%, rgba(255,255,255,0.03) 44%, rgba(255,255,255,0.014) 46%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* Film grain */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.05,
          mixBlendMode: "overlay",
        }}
      />

      {/* Bottom bleed */}
      <div className="absolute bottom-0 left-0 right-0 h-80 z-20 pointer-events-none bg-gradient-to-t from-[#050505] via-[#050505]/65 to-transparent" />

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-30 flex h-full flex-col justify-end pb-24 px-6 sm:px-10 lg:px-20"
      >
        {/* Chapter label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.5, delay: 0.4, ease: "easeOut" }}
          className="mb-14 flex items-center gap-5"
        >
          <span className="h-px w-12 bg-white/22 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/32">
            Field Notes — 2025
          </span>
          <span className="hidden sm:block ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-white/15">
            Culture Archive
          </span>
        </motion.div>

        {/* Main title */}
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[22vw] sm:text-[17vw] lg:text-[13vw] uppercase leading-[0.84] tracking-tight text-white"
          >
            JOUR
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.82, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[22vw] sm:text-[17vw] lg:text-[13vw] uppercase leading-[0.84] tracking-tight text-white/10 pl-8 lg:pl-16"
          >
            NAL
          </motion.h1>
        </div>

        {/* Quiet sub-positioning */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3.2, delay: 2, ease: "easeOut" }}
          className="mt-14 flex items-end justify-between"
        >
          <p className="max-w-[200px] font-body text-[11px] leading-[2.1] tracking-[0.16em] text-white/20 sm:max-w-xs">
            Not documentation.
            <br />Culture in motion.
          </p>
          <span className="hidden sm:block font-mono text-[9px] uppercase tracking-[0.28em] text-white/12">
            Est. 2024
          </span>
        </motion.div>

        {/* Scroll pulse */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.5, delay: 2.6, ease: "easeOut" }}
          className="absolute bottom-10 right-8 sm:right-16 flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ opacity: [0.12, 0.45, 0.12] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="h-14 w-px bg-gradient-to-b from-white/0 via-white/18 to-white/0"
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/18 rotate-90 origin-center translate-x-5">
            Scroll
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}

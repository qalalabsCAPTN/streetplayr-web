"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function LookbookOpening() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-[#050505]"
      aria-label="Lookbook opening"
    >
      {/* Parallax atmospheric background */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 h-[115%] w-full"
      >
        <div
          className="h-full w-full"
          style={{
            background: `
              radial-gradient(ellipse 90% 70% at 75% 35%, rgba(212,255,30,0.03) 0%, transparent 55%),
              radial-gradient(ellipse 60% 80% at 15% 75%, rgba(255,255,255,0.04) 0%, transparent 60%),
              radial-gradient(ellipse 40% 40% at 90% 85%, rgba(255,255,255,0.025) 0%, transparent 50%),
              linear-gradient(165deg, #0d0d0d 0%, #050505 45%, #020202 100%)
            `,
          }}
        />
        {/* Diagonal light slash — cinematic */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(118deg, transparent 25%, rgba(255,255,255,0.018) 46%, rgba(255,255,255,0.04) 48%, rgba(255,255,255,0.018) 50%, transparent 75%)",
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

      {/* Bottom vignette — bleeds into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-80 z-20 pointer-events-none bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-30 flex h-full flex-col justify-end pb-24 px-6 sm:px-10 lg:px-20"
      >
        {/* Archive label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.2, delay: 0.4, ease: "easeOut" }}
          className="mb-14 flex items-center gap-5"
        >
          <span className="h-px w-12 bg-white/25 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
            SP Archive — SS/25
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/18 ml-auto hidden sm:block">
            Vol. 001
          </span>
        </motion.div>

        {/* Main title — LOOKBOOK with ghost second word */}
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[18vw] sm:text-[14vw] lg:text-[11vw] uppercase leading-[0.86] tracking-tight text-white"
          >
            LOOK
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.82, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[18vw] sm:text-[14vw] lg:text-[11vw] uppercase leading-[0.86] tracking-tight text-white/12 pl-6 lg:pl-14"
          >
            BOOK
          </motion.h1>
        </div>

        {/* Subline — quiet cultural positioning */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3, delay: 1.9, ease: "easeOut" }}
          className="mt-14 flex items-end justify-between"
        >
          <p className="max-w-[220px] font-body text-[11px] leading-[2] tracking-[0.18em] text-white/22 sm:max-w-xs">
            Campaign archive.
            <br />Controlled chaos. Built in silence.
          </p>
          <span className="hidden sm:block font-mono text-[9px] uppercase tracking-[0.3em] text-white/15">
            Street PlayR
          </span>
        </motion.div>

        {/* Scroll pulse */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.5, delay: 2.4, ease: "easeOut" }}
          className="absolute bottom-10 right-8 sm:right-16 flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ opacity: [0.15, 0.5, 0.15] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-14 w-px bg-gradient-to-b from-white/0 via-white/20 to-white/0"
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/20 rotate-90 origin-center translate-x-5">
            Scroll
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}

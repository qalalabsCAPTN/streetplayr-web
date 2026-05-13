"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function AboutOpening() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full bg-[#050505]"
      aria-label="About opening"
    >
      {/* Atmospheric background */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 h-[115%] w-full"
      >
        {/* Deep gradient atmospheric stand-in — cinematic charcoal */}
        <div
          className="h-full w-full"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 65% 40%, rgba(255,255,255,0.04) 0%, transparent 60%),
              radial-gradient(ellipse 60% 80% at 20% 70%, rgba(157,78,221,0.025) 0%, transparent 55%),
              linear-gradient(160deg, #0a0a0a 0%, #050505 40%, #020202 100%)
            `,
          }}
        />
        {/* Cinematic horizontal light streak */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.025) 48%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.025) 52%, transparent 80%)",
          }}
        />
      </motion.div>

      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.055,
          mixBlendMode: "overlay",
        }}
      />

      {/* Bottom bleed — extends into manifesto for continuity */}
      <div className="absolute bottom-0 left-0 right-0 h-64 z-20 pointer-events-none bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />

      {/* Content — opacity fade only, no vertical drift */}
      <motion.div
        style={{ opacity }}
        className="relative z-30 flex h-full flex-col justify-end pb-28 px-6 sm:px-10 lg:px-20"
      >
        {/* Chapter label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.4, ease: "easeOut" }}
          className="mb-12 flex items-center gap-4"
        >
          <span
            className="h-px w-10 bg-white/30"
            style={{ display: "block" }}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
            Est. 2024 — The Origin
          </span>
        </motion.div>

        {/* Main title — architectural, restrained */}
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[15vw] sm:text-[12vw] lg:text-[10vw] uppercase leading-[0.88] tracking-tight text-white"
          >
            STREET
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.82, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[15vw] sm:text-[12vw] lg:text-[10vw] uppercase leading-[0.88] tracking-tight text-white/14"
          >
            PLAYR
          </motion.h1>
        </div>

        {/* Tagline — quiet, below the fold */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.5, delay: 1.8, ease: "easeOut" }}
          className="mt-12 max-w-[260px] font-body text-sm leading-8 tracking-widest text-white/28 sm:max-w-sm"
        >
          Not a uniform. Not a statement.
          <br />A position you earn in the streets.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 2.2, ease: "easeOut" }}
          className="absolute bottom-10 right-8 sm:right-16 flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="h-12 w-px bg-gradient-to-b from-white/0 via-white/25 to-white/0"
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/25 rotate-90 origin-center translate-x-5">
            Scroll
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}

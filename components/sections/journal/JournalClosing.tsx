"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function JournalClosing() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-8% 0px" });

  return (
    <section
      className="relative w-full bg-[#050505] overflow-hidden"
      aria-label="Journal closing"
    >
      {/* Deep atmospheric gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 50% 35%, rgba(255,255,255,0.022) 0%, transparent 65%),
            linear-gradient(180deg, #050505 0%, #020202 100%)
          `,
        }}
      />

      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          mixBlendMode: "overlay",
        }}
      />

      <div
        ref={ref}
        className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 lg:px-20 py-44 sm:py-64"
      >
        {/* Entry label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 2, ease: "easeOut" }}
          className="flex items-center gap-5 mb-20"
        >
          <span className="h-px w-10 bg-white/12 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/20">
            To Be Continued
          </span>
        </motion.div>

        {/* Main headline — oversized, ghost second line */}
        <div className="overflow-hidden mb-1">
          <motion.h2
            initial={{ y: "100%", opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 1.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[13vw] sm:text-[10vw] lg:text-[8vw] uppercase leading-[0.88] tracking-tight text-white"
          >
            MORE DROPS
          </motion.h2>
        </div>
        <div className="overflow-hidden">
          <motion.h2
            initial={{ y: "100%", opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 1.6, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[13vw] sm:text-[10vw] lg:text-[8vw] uppercase leading-[0.88] tracking-tight text-white/10 pl-6 lg:pl-14"
          >
            INCOMING
          </motion.h2>
        </div>

        {/* Ghost sub-copy — no CTA, no button */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 2.5, delay: 0.7, ease: "easeOut" }}
          className="mt-14 max-w-xs font-body text-sm leading-[2.2] tracking-wide text-white/22"
        >
          When it&apos;s ready. Not before.
        </motion.p>

        {/* Trailing quiet line — no button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 3.5, delay: 1.2, ease: "easeOut" }}
          className="mt-10"
        >
          <span className="h-px w-14 bg-white/12 block" />
        </motion.div>

        {/* Archive close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 3, delay: 1.8, ease: "easeOut" }}
          className="mt-32 sm:mt-48 flex items-center gap-6"
        >
          <span className="h-px flex-1 max-w-[3rem] bg-white/6 block" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/10">
            Street PlayR Journal — 2025
          </span>
        </motion.div>
      </div>
    </section>
  );
}

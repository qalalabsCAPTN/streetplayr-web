"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

export default function LookbookClosing() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-8% 0px" });

  return (
    <section
      className="relative w-full bg-[#050505] overflow-hidden"
      aria-label="Lookbook closing"
    >
      {/* Atmospheric gradient — deep, still */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,255,255,0.025) 0%, transparent 65%),
            radial-gradient(ellipse 40% 40% at 80% 80%, rgba(212,255,30,0.015) 0%, transparent 55%),
            linear-gradient(180deg, #050505 0%, #020202 100%)
          `,
        }}
      />

      {/* Film grain */}
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
        {/* Chapter close label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 2, ease: "easeOut" }}
          className="flex items-center gap-5 mb-20"
        >
          <span className="h-px w-10 bg-white/15 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/22">
            SS/25 — Volume One
          </span>
        </motion.div>

        {/* Main headline */}
        <div className="overflow-hidden mb-1">
          <motion.h2
            initial={{ y: "100%", opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[13vw] sm:text-[10vw] lg:text-[7.5vw] uppercase leading-[0.88] tracking-tight text-white"
          >
            ENTER
          </motion.h2>
        </div>
        <div className="overflow-hidden">
          <motion.h2
            initial={{ y: "100%", opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[13vw] sm:text-[10vw] lg:text-[7.5vw] uppercase leading-[0.88] tracking-tight text-white/12 pl-6 lg:pl-14"
          >
            THE ARCHIVE
          </motion.h2>
        </div>

        {/* Sub-copy */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 2.5, delay: 0.7, ease: "easeOut" }}
          className="mt-14 max-w-xs font-body text-sm leading-[2.2] tracking-wide text-white/28"
        >
          New drop. SS/25. Limited and deliberate.
        </motion.p>

        {/* CTA — minimal, restrained */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 2.5, delay: 1.1, ease: "easeOut" }}
          className="mt-14"
        >
          <Link
            href="/shop"
            className="group inline-flex items-center gap-5 font-mono text-xs uppercase tracking-[0.28em] text-white/50 transition-colors duration-700 hover:text-white/80"
            data-cursor="button"
          >
            <span>View Collection</span>
            <span className="h-px w-10 bg-white/25 transition-all duration-700 group-hover:w-16 group-hover:bg-white/50" />
          </Link>
        </motion.div>

        {/* Footer archive note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 3, delay: 1.5, ease: "easeOut" }}
          className="mt-32 sm:mt-44 flex items-center gap-6"
        >
          <span className="h-px flex-1 max-w-[3rem] bg-white/8 block" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/12">
            Street PlayR — Born From the Streets
          </span>
        </motion.div>
      </div>
    </section>
  );
}

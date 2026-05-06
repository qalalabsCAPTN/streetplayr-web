"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

export default function AboutCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section
      ref={ref}
      className="relative w-full bg-[#050505] overflow-hidden py-36 sm:py-52 lg:py-64"
      aria-label="Closing call to action"
    >
      {/* Atmospheric focal light */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 3, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%]"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.035) 0%, transparent 65%)",
          }}
        />
      </motion.div>

      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          mixBlendMode: "overlay",
        }}
      />

      <div className="relative z-20 mx-auto max-w-4xl px-6 sm:px-10 text-center">
        {/* Overline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="flex items-center justify-center gap-4 mb-14"
        >
          <span className="h-px w-8 bg-white/15 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/25">
            Enter The Play
          </span>
          <span className="h-px w-8 bg-white/15 block" />
        </motion.div>

        {/* Heading */}
        <div className="overflow-hidden mb-2">
          <motion.h2
            initial={{ y: "105%", opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 1.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[14vw] sm:text-[10vw] lg:text-[8vw] uppercase leading-[0.88] tracking-tight text-white"
          >
            The Collection
          </motion.h2>
        </div>
        <div className="overflow-hidden">
          <motion.h2
            initial={{ y: "105%", opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 1.4, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[14vw] sm:text-[10vw] lg:text-[8vw] uppercase leading-[0.88] tracking-tight text-white/15"
          >
            Awaits
          </motion.h2>
        </div>

        {/* Body text — restrained */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1.8, delay: 0.45, ease: "easeOut" }}
          className="mt-12 mx-auto max-w-xs sm:max-w-sm font-body text-sm leading-8 text-white/30 tracking-wide"
        >
          Limited drops. No restock. No noise.
          <br />
          Only the pieces — and those who find them.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.4, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/collections"
            data-cursor="button"
            className="group relative inline-flex items-center gap-5 border border-white/20 px-10 py-5 font-mono text-xs uppercase tracking-[0.2em] text-white transition-all duration-500 hover:border-white/50"
          >
            <span>Explore Collection</span>
            <motion.span
              className="h-px bg-white block"
              initial={{ width: "1.5rem" }}
              whileHover={{ width: "3rem" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </Link>
          <Link
            href="/shop"
            data-cursor="button"
            className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 transition-colors duration-300 hover:text-white/60 px-4 py-5"
          >
            Shop All
          </Link>
        </motion.div>

        {/* SP mark — visual silence at bottom */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 2.5, delay: 1, ease: "easeOut" }}
          className="mt-24 sm:mt-32 font-display text-[2.5vw] sm:text-[1.8vw] lg:text-[1.4vw] uppercase tracking-[0.5em] text-white/06"
        >
          STREET PLAYR — SP — EST. 2024
        </motion.p>
      </div>
    </section>
  );
}

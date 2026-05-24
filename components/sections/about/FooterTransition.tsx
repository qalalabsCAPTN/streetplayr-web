"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

export default function FooterTransition() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section ref={ref} className="relative py-32 sm:py-44 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 3.5, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%]"
          style={{
            background: "radial-gradient(ellipse at center, rgba(221,183,255,0.04) 0%, transparent 65%)",
          }}
        />
      </motion.div>

      <div className="relative z-10 max-w-[min(98vw,2560px)] mx-auto px-4 md:px-8 lg:px-12">
        <div className="max-w-[880px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 1.6, ease: "easeOut" }}
            className="flex items-center justify-center gap-4 mb-16"
          >
            <span className="h-px w-8 bg-white/15 block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/25">The Collection</span>
            <span className="h-px w-8 bg-white/15 block" />
          </motion.div>

          <div className="overflow-hidden mb-2">
            <motion.h2
              initial={{ y: "105%" }}
              animate={isInView ? { y: 0 } : {}}
              transition={{ duration: 1.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[clamp(72px,12vw,140px)] uppercase leading-[0.85] tracking-tight text-[#ddb7ff]"
            >
              Explore the
            </motion.h2>
          </div>
          <div className="overflow-hidden">
            <motion.h2
              initial={{ y: "105%" }}
              animate={isInView ? { y: 0 } : {}}
              transition={{ duration: 1.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[clamp(72px,12vw,140px)] uppercase leading-[0.85] tracking-tight text-[#eadfed]/15"
            >
              Archive
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 2, delay: 0.55, ease: "easeOut" }}
            className="mt-12 mx-auto max-w-xs font-body text-sm leading-8 text-white/30 tracking-wide"
          >
            Limited drops. No restock. No noise. Only the pieces — and those who find them.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
            className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/collections"
              className="group relative inline-flex items-center gap-5 border border-white/[0.14] px-10 py-5 font-mono text-xs uppercase tracking-[0.2em] text-[#eadfed] transition-all duration-500 hover:bg-[#ddb7ff] hover:text-[#16111b] hover:border-[#ddb7ff] rounded-xl"
            >
              <span>Explore Archive</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/collections"
              className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors px-4 py-5"
            >
              Shop All
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 4, delay: 1.6, ease: "easeOut" }}
            className="mt-32 font-display text-[clamp(14px,1.6vw,24px)] uppercase tracking-[0.6em] text-white/[0.04]"
          >
            STREET PLAYR — SP — EST. 2024
          </motion.p>
        </div>
      </div>
    </section>
  );
}

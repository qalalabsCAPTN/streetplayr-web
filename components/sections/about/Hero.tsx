"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

export default function AboutHero() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section ref={ref} className="relative min-h-screen w-full flex items-end overflow-hidden bg-[#16111b]">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/assets/home-page-banner.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 55% at 18% 24%, rgba(221,183,255,0.12) 0%, transparent 64%), linear-gradient(180deg, rgba(22,17,27,0.30) 0%, rgba(22,17,27,0.12) 38%, rgba(22,17,27,0.94) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(12,6,18,0.75) 100%)",
        }}
      />

      <div className="relative z-10 w-full px-4 md:px-8 lg:px-12 pb-32 sm:pb-40">
        <div className="max-w-[min(98vw,2560px)] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/25 block mb-8">
              About
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[clamp(72px,14vw,200px)] leading-[0.85] tracking-[0.01em] uppercase text-[#eadfed] max-w-[5ch]"
          >
            Born
            <br />
            From
            <br />
            <span className="text-[#ddb7ff]">the Streets</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.5, ease: "easeOut" }}
            className="font-mono text-[11px] sm:text-[12px] uppercase tracking-[0.28em] text-white/35 mt-10 max-w-[480px] leading-relaxed"
          >
            A luxury streetwear house built on scarcity, intent, and the discipline of those who move without permission.
          </motion.p>
        </div>
      </div>
    </section>
  );
}

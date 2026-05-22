"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-8% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function QuoteSection() {
  return (
    <section className="relative py-36 sm:py-48 px-6 sm:px-12 lg:px-20 max-w-[1440px] mx-auto border-t border-white/[0.04] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(221,183,255,0.04)_0%,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="relative z-10 max-w-[900px] mx-auto text-center">
        <FadeIn>
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className="h-px w-8 bg-white/20 block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">Core Tenet</span>
            <span className="h-px w-8 bg-white/20 block" />
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <span className="font-display text-[clamp(56px,8vw,120px)] uppercase text-[#ddb7ff] leading-[0.88] block tracking-[-0.02em]">
            &ldquo;Dress for pressure.&rdquo;
          </span>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="mt-12 flex items-center justify-center gap-4">
            <span className="w-px h-6 bg-[#ddb7ff]/30" />
            <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-white/25">
              The Streets &mdash; Since 2024
            </span>
            <span className="w-px h-6 bg-[#ddb7ff]/30" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

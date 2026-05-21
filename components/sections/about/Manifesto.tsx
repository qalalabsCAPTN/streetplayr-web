"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-8% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Manifesto() {
  return (
    <section className="relative py-36 sm:py-48 px-6 sm:px-12 lg:px-20 max-w-[1440px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        {/* Label column */}
        <FadeIn className="lg:col-span-3">
          <div className="flex items-center gap-3">
            <span className="h-px w-6 bg-white/20 block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">The Manifesto</span>
          </div>
        </FadeIn>

        {/* Content column */}
        <div className="lg:col-span-9 lg:col-start-4">
          <FadeIn delay={0.15}>
            <h2 className="font-display text-[clamp(44px,7vw,120px)] leading-[0.88] tracking-[0.01em] uppercase text-[#eadfed] max-w-[12ch]">
              Made for those who refuse to be styled.
            </h2>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="font-body text-[14px] sm:text-[16px] leading-[1.9] text-white/40 max-w-[520px] mt-14 tracking-wide">
              StreetPlayR exists at the intersection of raw urban energy and exacting craftsmanship. Every piece is a study in restraint — stripped of excess, defined by form.
            </p>
          </FadeIn>

          <FadeIn delay={0.45}>
            <p className="font-body text-[13px] leading-[1.9] text-white/25 max-w-[440px] mt-8 tracking-wide">
              We do not overproduce. Each drop is limited — an artifact of a moment, not a commodity on a conveyor belt. The scarcity is intentional. The silence is part of the signal.
            </p>
          </FadeIn>

          <FadeIn delay={0.6}>
            <div className="mt-20 pt-10 border-t border-white/[0.04] max-w-[600px]">
              <span className="font-display text-[clamp(40px,5vw,80px)] uppercase text-[#ddb7ff] leading-[0.9] block tracking-[-0.01em]">
                &ldquo;Dress for pressure.&rdquo;
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/20 mt-4 block">
                Core Tenet // Since 2024
              </span>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

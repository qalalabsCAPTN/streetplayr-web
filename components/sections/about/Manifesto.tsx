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
    <section className="relative py-32 sm:py-48 lg:py-56 px-4 md:px-6 w-full max-w-[min(95vw,2400px)] mx-auto">
      <FadeIn delay={0.1}>
        <div className="flex items-center gap-3 mb-8">
          <span className="h-px w-6 bg-white/20 block" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/60">The Manifesto</span>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <h2 className="font-display text-[clamp(64px,9vw,160px)] leading-[0.88] tracking-[-0.02em] uppercase text-[#eadfed] max-w-[16ch]">
          Made for those who refuse to be styled.
        </h2>
      </FadeIn>

      <FadeIn delay={0.35}>
        <p className="font-body text-[15px] sm:text-[18px] leading-[1.9] text-white/70 font-medium max-w-[660px] mt-16 lg:mt-20">
          StreetPlayR exists at the intersection of raw urban energy and exacting craftsmanship. Every piece is a study in restraint — stripped of excess, defined by form. We do not overproduce. Each drop is limited — an artifact of a moment, not a commodity on a conveyor belt. The scarcity is intentional. The silence is part of the signal.
        </p>
      </FadeIn>
    </section>
  );
}

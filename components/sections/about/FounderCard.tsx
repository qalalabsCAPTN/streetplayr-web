"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

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

export default function FounderCard() {
  return (
    <section className="relative py-36 sm:py-48 px-6 sm:px-12 lg:px-20 max-w-[1440px] mx-auto border-t border-white/[0.04]">
      <FadeIn>
        <div className="flex items-center gap-3 mb-14">
          <span className="h-px w-6 bg-white/20 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">The Founder</span>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        <FadeIn className="lg:col-span-7">
          <div className="relative overflow-hidden bg-[#0a0a0a] border border-white/[0.06]">
            <div className="aspect-[4/5] relative">
              <Image
                src="/assets/about/founder-portrait.svg"
                alt="Founder portrait"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 60vw, 100vw"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
                }}
              />
              <div className="absolute inset-0 border border-white/[0.04] pointer-events-none" />
              <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] pointer-events-none" />
            </div>
            <div className="px-6 py-4 border-t border-white/[0.05] flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#ddb7ff]/50">Founder // Creative Director</span>
              <span className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/15">Est. 2024</span>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} className="lg:col-span-5 flex flex-col justify-center">
          <div className="max-w-[460px]">
            <p className="font-body text-[15px] sm:text-[17px] leading-[1.9] text-white/45 tracking-wide">
              StreetPlayR was never meant to be a brand. It was a reaction — against the noise, against the overproduction, against the idea that fashion has to be disposable to be relevant.
            </p>

            <p className="font-body text-[14px] leading-[1.9] text-white/30 mt-8 tracking-wide">
              Every piece is a study in subtraction. We ask not what we can add, but what we can remove — until only the essential remains. That is the discipline. That is the position.
            </p>

            <div className="mt-14 pt-6 border-t border-white/[0.06]">
              <span className="font-display text-[28px] sm:text-[36px] uppercase text-[#eadfed] leading-none block tracking-[0.01em]">
                The Streets
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-white/20 mt-3 block">
                StreetPlayR — Est. 2024
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

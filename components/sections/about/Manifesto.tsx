"use client";

import { useRef } from "react";
import Image from "next/image";
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
    <section className="relative py-28 sm:py-36 lg:py-48 px-4 md:px-8 lg:px-12 w-full max-w-[min(98vw,2560px)] mx-auto overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24 items-center">
        
        {/* Left Side: Content */}
        <div className="flex flex-col">
          <FadeIn delay={0.1}>
            <div className="flex items-center gap-3 mb-6 lg:mb-8">
              <span className="h-px w-6 bg-[var(--fg-20)] block" />
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#ddb7ff]">The Manifesto</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h2 className="font-display text-[clamp(44px,7vw,110px)] leading-[0.9] tracking-[-0.02em] uppercase text-[var(--fg)] max-w-[16ch]">
              Made for those who refuse to be styled.
            </h2>
          </FadeIn>

          <FadeIn delay={0.35}>
            <p className="font-body text-[14px] sm:text-[17px] leading-[1.8] text-[var(--fg-60)] font-medium max-w-[620px] mt-8 lg:mt-12">
              StreetPlayR exists at the intersection of raw urban energy and exacting craftsmanship. Every piece is a study in restraint — stripped of excess, defined by form. We do not overproduce. Each drop is limited — an artifact of a moment, not a commodity on a conveyor belt. The scarcity is intentional. The silence is part of the signal.
            </p>
          </FadeIn>
        </div>

        {/* Right Side: Editorial Image */}
        <FadeIn delay={0.45} className="w-full flex justify-center lg:justify-end">
          <div className="relative group overflow-hidden rounded-2xl border border-[var(--fg-08)] bg-[var(--panel)] shadow-[0_24px_80px_rgba(0,0,0,0.5)] max-w-[580px] w-full aspect-[4/5]">
            {/* Ambient Background Glow on Hover */}
            <div className="absolute -inset-2 bg-gradient-to-r from-[#ddb7ff]/20 to-[#dfba89]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            {/* Dark premium vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10 pointer-events-none" />
            
            {/* Micro scanlines interaction */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,22,0)_96%,rgba(221,183,255,0.04)_96%)] bg-[size:100%_12px] opacity-0 group-hover:opacity-40 transition-opacity duration-500 z-10 pointer-events-none" />
            
            <Image
              src="/assets/about/manifesto_editorial.png"
              alt="StreetPlayR Manifesto Editorial"
              width={580}
              height={725}
              className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            />
          </div>
        </FadeIn>
        
      </div>
    </section>
  );
}

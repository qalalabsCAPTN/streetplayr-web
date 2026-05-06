"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

function FadeReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-8% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.3, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AtmosphericPanel({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-5% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.985 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 1.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Atmospheric image panels rendered with pure CSS gradients — editorial feel
function ImagePanel({
  variant,
  aspectClass,
  label,
}: {
  variant: "light" | "dark" | "accent" | "mid";
  aspectClass: string;
  label?: string;
}) {
  const gradients: Record<string, string> = {
    light: `
      radial-gradient(ellipse 70% 60% at 30% 40%, rgba(255,255,255,0.07) 0%, transparent 65%),
      linear-gradient(150deg, #141414 0%, #0a0a0a 50%, #060606 100%)
    `,
    dark: `
      radial-gradient(ellipse 50% 70% at 70% 30%, rgba(255,255,255,0.04) 0%, transparent 60%),
      linear-gradient(120deg, #060606 0%, #080808 60%, #0a0a0a 100%)
    `,
    accent: `
      radial-gradient(ellipse 60% 50% at 50% 60%, rgba(212,255,30,0.04) 0%, transparent 65%),
      radial-gradient(ellipse 40% 40% at 20% 20%, rgba(255,255,255,0.05) 0%, transparent 60%),
      linear-gradient(135deg, #0c0c0c 0%, #070707 100%)
    `,
    mid: `
      radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 70%),
      linear-gradient(180deg, #0a0a0a 0%, #060606 100%)
    `,
  };

  return (
    <div
      className={`relative w-full overflow-hidden ${aspectClass} bg-[#0a0a0a]`}
      style={{ background: gradients[variant] }}
    >
      {/* Film grain on each panel */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.07,
          mixBlendMode: "overlay",
        }}
      />
      {/* Subtle inner border */}
      <div className="pointer-events-none absolute inset-0 z-20 border border-white/[0.04]" />
      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* Label overlay */}
      {label && (
        <div className="absolute bottom-4 left-5 z-30">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

export default function AboutEditorial() {
  return (
    <section
      className="relative w-full bg-[#050505] overflow-hidden"
      aria-label="Editorial storytelling"
    >
      {/* ——— BLOCK 1: Full-width silence panel ——— */}
      <div className="w-full">
        <AtmosphericPanel delay={0}>
          <ImagePanel
            variant="light"
            aspectClass="aspect-[16/7] sm:aspect-[21/8]"
            label="SP Archive — 2024"
          />
        </AtmosphericPanel>
      </div>

      {/* ——— BLOCK 2: Copy + asymmetric panel ——— */}
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-20 py-24 sm:py-36">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text side */}
          <div>
            <FadeReveal delay={0}>
              <div className="flex items-center gap-4 mb-10">
                <span className="h-px w-6 bg-white/20 block" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
                  The Craft
                </span>
              </div>
            </FadeReveal>

            <FadeReveal delay={0.1}>
              <h2 className="font-display text-[10vw] sm:text-[7vw] lg:text-[5.5vw] uppercase leading-[0.92] tracking-tight text-white">
                Every Detail
              </h2>
            </FadeReveal>
            <FadeReveal delay={0.18}>
              <h2 className="font-display text-[10vw] sm:text-[7vw] lg:text-[5.5vw] uppercase leading-[0.92] tracking-tight text-white/22 pl-8 lg:pl-12">
                Is Intentional
              </h2>
            </FadeReveal>

            <FadeReveal delay={0.28}>
              <p className="mt-10 max-w-sm font-body text-sm leading-8 tracking-wide text-white/40">
                Each piece begins with silence. No trend board. No algorithm.
                We start from a feeling — the weight of fabric, the hang of a
                silhouette, the restraint of a label stitched low and quiet.
              </p>
            </FadeReveal>

            <FadeReveal delay={0.38}>
              <p className="mt-6 max-w-sm font-body text-sm leading-8 tracking-wide text-white/25">
                Craft is not a selling point. It is the minimum.
              </p>
            </FadeReveal>
          </div>

          {/* Image side — asymmetric tall panel */}
          <AtmosphericPanel delay={0.15} className="lg:translate-y-8">
            <ImagePanel
              variant="dark"
              aspectClass="aspect-[3/4]"
              label="Stitched Label — Detail 01"
            />
          </AtmosphericPanel>
        </div>
      </div>

      {/* ——— BLOCK 3: Full-bleed split grid ——— */}
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-20 pb-24 sm:pb-36">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <AtmosphericPanel delay={0} className="col-span-1">
            <ImagePanel
              variant="mid"
              aspectClass="aspect-[2/3]"
              label="Form — 01"
            />
          </AtmosphericPanel>
          <AtmosphericPanel delay={0.1} className="col-span-1 mt-12">
            <ImagePanel
              variant="accent"
              aspectClass="aspect-[2/3]"
              label="Form — 02"
            />
          </AtmosphericPanel>
          <AtmosphericPanel
            delay={0.2}
            className="col-span-2 lg:col-span-1 lg:mt-6"
          >
            <ImagePanel
              variant="dark"
              aspectClass="aspect-[16/9] lg:aspect-[2/3]"
              label="Form — 03"
            />
          </AtmosphericPanel>
        </div>
      </div>

      {/* ——— BLOCK 4: Macro label detail + silence ——— */}
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-20 pb-32 sm:pb-48">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          {/* Wide atmospheric image */}
          <AtmosphericPanel delay={0} className="lg:col-span-7">
            <ImagePanel
              variant="light"
              aspectClass="aspect-[4/3]"
              label="Campaign Frame — 2024"
            />
          </AtmosphericPanel>
          {/* Quiet text block */}
          <div className="lg:col-span-5 lg:pb-10">
            <FadeReveal delay={0.1}>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/22 mb-8">
                The Label
              </p>
            </FadeReveal>
            <FadeReveal delay={0.2}>
              <h3 className="font-display text-[8vw] sm:text-[5vw] lg:text-[3.8vw] uppercase leading-[0.95] tracking-tight text-white">
                Worn Without
              </h3>
            </FadeReveal>
            <FadeReveal delay={0.28}>
              <h3 className="font-display text-[8vw] sm:text-[5vw] lg:text-[3.8vw] uppercase leading-[0.95] tracking-tight text-white/18 pl-6">
                Explanation
              </h3>
            </FadeReveal>
            <FadeReveal delay={0.38}>
              <p className="mt-8 font-body text-sm leading-8 tracking-wide text-white/35 max-w-xs">
                The stitched label is never loud.
                <br />
                It is a quiet signature for those who know.
              </p>
            </FadeReveal>
          </div>
        </div>
      </div>
    </section>
  );
}

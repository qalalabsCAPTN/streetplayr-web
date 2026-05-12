"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

// ─── Shared motion primitive ───────────────────────────────────────────────
function FadeReveal({
  children,
  delay = 0,
  className = "",
  duration = 1.6,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-6% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Campaign image panel ──────────────────────────────────────────────────
function CampaignPanel({
  src,
  alt,
  aspectClass,
  label,
  delay = 0,
  objectPosition = "center",
}: {
  src: string;
  alt: string;
  aspectClass: string;
  label?: string;
  delay?: number;
  objectPosition?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-5% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 2.2, delay, ease: "easeOut" }}
      className={`relative w-full overflow-hidden ${aspectClass} bg-[#080808]`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        style={{ objectPosition }}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 100vw"
      />
      {/* Atmospheric vignette over image */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      {/* Film grain on image */}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.06,
          mixBlendMode: "overlay",
        }}
      />
      {/* Subtle inner border */}
      <div className="pointer-events-none absolute inset-0 z-20 border border-white/[0.035]" />
      {label && (
        <div className="absolute bottom-4 left-5 z-30">
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/30">
            {label}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Atmospheric gradient panel (no image) ────────────────────────────────
function AtmosphericPanel({
  variant = "dark",
  aspectClass,
  label,
  delay = 0,
}: {
  variant?: "dark" | "light" | "accent";
  aspectClass: string;
  label?: string;
  delay?: number;
}) {
  const gradients: Record<string, string> = {
    dark: `
      radial-gradient(ellipse 60% 70% at 70% 30%, rgba(255,255,255,0.04) 0%, transparent 60%),
      linear-gradient(120deg, #060606 0%, #080808 60%, #0a0a0a 100%)
    `,
    light: `
      radial-gradient(ellipse 70% 60% at 30% 45%, rgba(255,255,255,0.06) 0%, transparent 65%),
      linear-gradient(150deg, #141414 0%, #0a0a0a 50%, #060606 100%)
    `,
    accent: `
      radial-gradient(ellipse 55% 55% at 50% 55%, rgba(157,78,221,0.035) 0%, transparent 65%),
      radial-gradient(ellipse 35% 35% at 15% 15%, rgba(255,255,255,0.04) 0%, transparent 60%),
      linear-gradient(135deg, #0c0c0c 0%, #070707 100%)
    `,
  };

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-5% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 2, delay, ease: "easeOut" }}
      className={`relative w-full overflow-hidden ${aspectClass} bg-[#0a0a0a]`}
      style={{ background: gradients[variant] }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.07,
          mixBlendMode: "overlay",
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-20 border border-white/[0.04]" />
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {label && (
        <div className="absolute bottom-4 left-5 z-30">
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/22">
            {label}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Campaign statement interruption ──────────────────────────────────────
function CampaignStatement({ text, sub }: { text: string; sub?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 2.4, ease: "easeOut" }}
      className="py-2"
    >
      <div className="flex items-center gap-6">
        <span className="h-px w-8 bg-white/10 block flex-shrink-0" />
        <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/18">
          {text}
        </span>
        {sub && (
          <span className="hidden sm:block ml-auto font-mono text-[9px] uppercase tracking-[0.22em] text-white/10">
            {sub}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function LookbookEditorialFeed() {
  return (
    <section
      className="relative w-full bg-[#050505] overflow-hidden"
      aria-label="Editorial campaign feed"
    >
      {/* ──────────────────────────────────────────────────────────────── */}
      {/* BLOCK 1: Full-bleed dominant image — campaign entrance */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <div className="w-full">
        <CampaignPanel
          src="/assets/hero-tees.png"
          alt="Street PlayR SS/25 Campaign — Oversized Tees"
          aspectClass="aspect-[16/7] sm:aspect-[21/8]"
          label="SP Campaign — SS/25"
          delay={0}
          objectPosition="center top"
        />
      </div>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* BLOCK 2: Asymmetric — story fragment left, tall image right */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-20 py-32 sm:py-52">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28 items-center">
          {/* Text side */}
          <div>
            <FadeReveal delay={0}>
              <div className="flex items-center gap-4 mb-12">
                <span className="h-px w-6 bg-white/18 block" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/28">
                  Campaign Direction
                </span>
              </div>
            </FadeReveal>

            <FadeReveal delay={0.08}>
              <h2 className="font-display text-[13vw] sm:text-[9vw] lg:text-[6.5vw] uppercase leading-[0.9] tracking-tight text-white">
                CONTROLLED
              </h2>
            </FadeReveal>
            <FadeReveal delay={0.16}>
              <h2 className="font-display text-[13vw] sm:text-[9vw] lg:text-[6.5vw] uppercase leading-[0.9] tracking-tight text-white/14 pl-6 lg:pl-10">
                CHAOS
              </h2>
            </FadeReveal>

            <FadeReveal delay={0.28} duration={2}>
              <p className="mt-12 max-w-xs font-body text-sm leading-[2.2] tracking-wide text-white/35">
                Not spontaneous. Not accidental.
                Every edit is deliberate — chaos as a tool,
                not an outcome.
              </p>
            </FadeReveal>

            <FadeReveal delay={0.4} duration={2}>
              <p className="mt-5 max-w-xs font-body text-xs leading-[2] tracking-wide text-white/20">
                Form over noise. Silence over statement.
              </p>
            </FadeReveal>
          </div>

          {/* Image side — tall portrait, shifted down */}
          <CampaignPanel
            src="/assets/polo-editorial.png"
            alt="Street PlayR Polo Editorial — Portrait"
            aspectClass="aspect-[3/4]"
            label="Polo — Detail 01"
            delay={0.14}
            objectPosition="center"
          />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* BLOCK 3: Typography interruption — massive ghost text */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <div className="w-full overflow-hidden py-8 sm:py-12">
        <FadeReveal duration={3} delay={0}>
          <div className="px-4 sm:px-8">
            <p
              className="font-display uppercase text-white select-none leading-none"
              style={{
                fontSize: "clamp(4rem, 16vw, 18rem)",
                opacity: 0.04,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
              }}
              aria-hidden="true"
            >
              BUILT IN SILENCE
            </p>
          </div>
        </FadeReveal>
      </div>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* BLOCK 4: Staggered grid — 3 panels, asymmetric offsets */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-20 pb-36 sm:pb-56">
        <CampaignStatement text="Form follows feeling — not function" sub="SP Archive 2025" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-14 sm:mt-20">
          <div className="col-span-1">
            <AtmosphericPanel
              variant="light"
              aspectClass="aspect-[2/3]"
              label="Form — 01"
              delay={0}
            />
          </div>
          <div className="col-span-1 mt-14 sm:mt-20">
            <CampaignPanel
              src="/assets/run-shorts.jpeg"
              alt="Street PlayR Run Shorts — Fabric Detail"
              aspectClass="aspect-[2/3]"
              label="Shorts — SS/25"
              delay={0.14}
              objectPosition="center"
            />
          </div>
          <div className="col-span-2 lg:col-span-1 lg:mt-8">
            <AtmosphericPanel
              variant="accent"
              aspectClass="aspect-[16/9] lg:aspect-[2/3]"
              label="Form — 03"
              delay={0.24}
            />
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* BLOCK 5: Dominant single image + quiet text — jersey campaign */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-20 pb-36 sm:pb-52">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          {/* Dominant image — 7 cols */}
          <div className="lg:col-span-7">
            <CampaignPanel
              src="/assets/srh-jersey.jpg"
              alt="Street PlayR SRH Jersey — Campaign Frame"
              aspectClass="aspect-[4/3]"
              label="Jersey — Campaign Frame 01"
              delay={0}
              objectPosition="center"
            />
          </div>
          {/* Quiet text — 5 cols */}
          <div className="lg:col-span-5 lg:pb-12">
            <FadeReveal delay={0.1}>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/18 mb-8">
                The Jersey
              </p>
            </FadeReveal>
            <FadeReveal delay={0.2}>
              <h3 className="font-display text-[9vw] sm:text-[5.5vw] lg:text-[4vw] uppercase leading-[0.92] tracking-tight text-white">
                Worn Without
              </h3>
            </FadeReveal>
            <FadeReveal delay={0.28}>
              <h3 className="font-display text-[9vw] sm:text-[5.5vw] lg:text-[4vw] uppercase leading-[0.92] tracking-tight text-white/14 pl-5">
                Permission
              </h3>
            </FadeReveal>
            <FadeReveal delay={0.38} duration={2}>
              <p className="mt-10 font-body text-sm leading-[2.2] tracking-wide text-white/30 max-w-xs">
                The SRH collab was never about the team.
                <br />
                It was about where you wear it.
              </p>
            </FadeReveal>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* BLOCK 6: Macro detail — fabric/stitching moment */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-20 pb-48 sm:pb-72">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          {/* Text — first on mobile */}
          <div className="lg:order-2 lg:pt-24">
            <FadeReveal delay={0.05}>
              <div className="flex items-center gap-4 mb-10">
                <span className="h-px w-6 bg-white/18 block" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/28">
                  Material Study
                </span>
              </div>
            </FadeReveal>
            <FadeReveal delay={0.14}>
              <h3 className="font-display text-[10vw] sm:text-[7vw] lg:text-[5vw] uppercase leading-[0.9] tracking-tight text-white">
                FABRIC
              </h3>
            </FadeReveal>
            <FadeReveal delay={0.22}>
              <h3 className="font-display text-[10vw] sm:text-[7vw] lg:text-[5vw] uppercase leading-[0.9] tracking-tight text-white/16 pl-4">
                MEMORY
              </h3>
            </FadeReveal>
            <FadeReveal delay={0.32} duration={2}>
              <p className="mt-10 font-body text-sm leading-[2.2] tracking-wide text-white/32 max-w-[300px]">
                The weight of the material is the first communication.
                Before it's seen, it's felt.
              </p>
            </FadeReveal>
            <FadeReveal delay={0.44} duration={2.2}>
              <p className="mt-5 font-body text-xs leading-[2] tracking-wide text-white/18 max-w-[260px]">
                Stitched to outlast the season it arrives in.
              </p>
            </FadeReveal>
          </div>
          {/* Image — portrait macro crop */}
          <div className="lg:order-1">
            <CampaignPanel
              src="/assets/run-shorts.jpeg"
              alt="Street PlayR — Fabric and Material Detail"
              aspectClass="aspect-[3/4]"
              label="Material — Detail 02"
              delay={0}
              objectPosition="center 30%"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

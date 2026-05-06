"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

// ─── Shared primitives ─────────────────────────────────────────────────────
function FadeReveal({
  children,
  delay = 0,
  className = "",
  duration = 1.8,
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

function EditorialImage({
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
      transition={{ duration: 2.4, delay, ease: "easeOut" }}
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
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: "radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.58) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.06,
          mixBlendMode: "overlay",
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-20 border border-white/[0.03]" />
      {label && (
        <div className="absolute bottom-4 left-5 z-30">
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/28">
            {label}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Journal entry divider ─────────────────────────────────────────────────
function EntryDivider({ number }: { number: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 2, ease: "easeOut" }}
      className="flex items-center gap-5 py-1"
    >
      <span className="font-mono text-[10px] text-white/20 tracking-[0.24em]">{number}</span>
      <span className="h-px flex-1 bg-white/[0.07] block max-w-xs" />
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function JournalEditorialFeed() {
  return (
    <section
      className="relative w-full bg-[#050505] overflow-hidden"
      aria-label="Journal editorial feed"
    >
      {/* ──────────────────────────────────────────────────────────────── */}
      {/* ENTRY 01: Full-bleed campaign frame — no text */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <div className="w-full">
        <EditorialImage
          src="/assets/hero-tees.png"
          alt="Street PlayR — Field Note 01"
          aspectClass="aspect-[16/8] sm:aspect-[21/8]"
          label="Field Note 001 — SP Archive"
          delay={0}
          objectPosition="center 20%"
        />
      </div>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* ENTRY 02: Text-dominant — almost no image */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-20 py-32 sm:py-52">
        <EntryDivider number="002" />
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-36 items-start">
          <div>
            <FadeReveal delay={0.05}>
              <div className="flex items-center gap-4 mb-10">
                <span className="h-px w-6 bg-white/16 block" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/25">
                  On Restraint
                </span>
              </div>
            </FadeReveal>
            <FadeReveal delay={0.12}>
              <h2 className="font-display text-[11vw] sm:text-[8vw] lg:text-[6vw] uppercase leading-[0.9] tracking-tight text-white">
                LESS IS
              </h2>
            </FadeReveal>
            <FadeReveal delay={0.2}>
              <h2 className="font-display text-[11vw] sm:text-[8vw] lg:text-[6vw] uppercase leading-[0.9] tracking-tight text-white/13 pl-5">
                THE EDIT
              </h2>
            </FadeReveal>
            <FadeReveal delay={0.32} duration={2.2}>
              <p className="mt-12 max-w-xs font-body text-sm leading-[2.2] tracking-wide text-white/32">
                Every season, we remove more than we add.
                The final garment is what survived the edit.
                Not what made it in.
              </p>
            </FadeReveal>
          </div>
          {/* Small portrait — offset right */}
          <div className="lg:mt-16">
            <EditorialImage
              src="/assets/run-shorts.jpeg"
              alt="Street PlayR — Run Shorts Detail"
              aspectClass="aspect-[3/4]"
              label="Edit — Detail 01"
              delay={0.15}
            />
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* ENTRY 03: Single dominant image — centered silence */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <div className="w-full pb-4">
        <EditorialImage
          src="/assets/polo-editorial.png"
          alt="Street PlayR — Polo Editorial Field Note"
          aspectClass="aspect-[4/3] sm:aspect-[16/8]"
          label="Field Note 003"
          delay={0}
          objectPosition="center 35%"
        />
      </div>

      {/* Ghost date stamp */}
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-20 py-8">
        <FadeReveal delay={0}>
          <div className="flex items-center justify-end gap-5">
            <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/14">
              Feb 2025
            </span>
            <span className="h-px w-8 bg-white/10 block" />
          </div>
        </FadeReveal>
      </div>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* ENTRY 04: Staggered 3-panel grid */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-20 py-28 sm:py-44">
        <EntryDivider number="004" />
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-5 items-start">
          {/* Wide image — 5 cols */}
          <div className="col-span-2 lg:col-span-5">
            <EditorialImage
              src="/assets/srh-jersey.jpg"
              alt="SRH Jersey — Campaign Detail"
              aspectClass="aspect-[4/3]"
              label="Jersey — 004"
              delay={0}
            />
          </div>
          {/* Middle portrait — 3 cols, shifted down */}
          <div className="col-span-1 lg:col-span-3 lg:mt-20">
            <EditorialImage
              src="/assets/hero-tees.png"
              alt="Oversized Tee — Detail"
              aspectClass="aspect-[3/4]"
              label="Tee — 004"
              delay={0.14}
              objectPosition="center top"
            />
          </div>
          {/* Text block — 4 cols */}
          <div className="col-span-1 lg:col-span-4 lg:pt-12">
            <FadeReveal delay={0.2}>
              <div className="flex items-center gap-4 mb-8">
                <span className="h-px w-5 bg-white/15 block" />
                <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/22">
                  On Identity
                </span>
              </div>
            </FadeReveal>
            <FadeReveal delay={0.28}>
              <h3 className="font-display text-[8vw] sm:text-[5.5vw] lg:text-[3.8vw] uppercase leading-[0.92] tracking-tight text-white">
                THE JERSEY
              </h3>
            </FadeReveal>
            <FadeReveal delay={0.36}>
              <h3 className="font-display text-[8vw] sm:text-[5.5vw] lg:text-[3.8vw] uppercase leading-[0.92] tracking-tight text-white/12 pl-4">
                IS THE CITY
              </h3>
            </FadeReveal>
            <FadeReveal delay={0.46} duration={2.2}>
              <p className="mt-8 font-body text-sm leading-[2.2] tracking-wide text-white/28 max-w-[260px]">
                It was never about sport.
                It was about where you were when you wore it.
              </p>
            </FadeReveal>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* ENTRY 05: Ghost typography moment — atmospheric pause */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <div className="w-full overflow-hidden py-10 sm:py-16">
        <FadeReveal duration={3}>
          <div className="px-4 sm:px-8">
            <p
              className="font-display uppercase text-white select-none leading-none"
              style={{
                fontSize: "clamp(3.5rem, 14vw, 16rem)",
                opacity: 0.035,
                letterSpacing: "-0.015em",
                whiteSpace: "nowrap",
              }}
              aria-hidden="true"
            >
              EVERY PIECE IS AN EDIT
            </p>
          </div>
        </FadeReveal>
      </div>
    </section>
  );
}

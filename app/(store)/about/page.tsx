"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

// ─── Gradient image panel (atmospheric CSS-only visuals) ─────────────
function ArchivePanel({ className = "", label }: { className?: string; label?: string }) {
  return (
    <div className={`relative w-full overflow-hidden bg-[#0a0a0a] ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 30% 40%, rgba(221,183,255,0.04) 0%, transparent 65%),
            radial-gradient(ellipse 50% 70% at 70% 30%, rgba(255,255,255,0.03) 0%, transparent 60%),
            linear-gradient(150deg, #0a0a0a 0%, #060606 50%, #040404 100%)
          `,
        }}
      />
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Grain */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.06,
          mixBlendMode: "overlay",
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      {/* Border */}
      <div className="absolute inset-0 z-20 pointer-events-none border border-white/[0.04]" />
      {/* Inner glow edge */}
      <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]" />
      {label && (
        <div className="absolute bottom-4 left-5 z-30">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25">{label}</span>
        </div>
      )}
    </div>
  );
}

// ─── Fade reveal wrapper ─────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-8% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════
export default function AboutPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Fixed HUD background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-32 left-6 font-mono text-[9px] uppercase tracking-[0.2em] text-white/[0.12]">REC [00:42:15:02]</div>
        <div className="absolute bottom-24 right-6 font-mono text-[9px] uppercase tracking-[0.2em] text-white/[0.12]">COORD // 19.0760° N, 72.8777° E</div>
        <div className="absolute top-1/3 left-6 h-24 w-px bg-white/[0.04]" />
        <div className="absolute top-2/3 right-6 h-24 w-px bg-white/[0.04]" />
      </div>

      {/* ═══ 1. ARCHIVE ENTRY — HERO ═══ */}
      <HeroSection />

      {/* ═══ 2. CORE MANIFESTO — BENTO GRID ═══ */}
      <ManifestoSection />

      {/* ═══ 3. DESIGN PROCESS RAIL — HORIZONTAL SCROLL ═══ */}
      <ProcessRail />

      {/* ═══ 4. SYSTEM TIMELINE — VERTICAL ARCHIVE ═══ */}
      <TimelineSection />

      {/* ═══ 5. INTERNAL DIVISIONS — TEAM ═══ */}
      <TeamSection />

      {/* ═══ 6. FINAL TRANSMISSION — CLOSING ═══ */}
      <ClosingSection />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 1. HERO / ARCHIVE ENTRY
// ═══════════════════════════════════════════════════════════════════════
function HeroSection() {
  return (
    <header className="relative pt-36 pb-20 px-6 sm:px-12 lg:px-20 max-w-[1440px] mx-auto overflow-hidden">
      {/* Scanning line effect */}
      <motion.div
        className="absolute left-0 right-0 h-px z-10 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(221,183,255,0.15), transparent)",
          boxShadow: "0 0 8px rgba(221,183,255,0.08)",
        }}
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      <div className="flex flex-col items-start gap-5 mb-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ffb59e] relative pl-4 before:content-['['] before:absolute before:left-0 before:opacity-50 after:content-[']'] after:ml-1 after:opacity-50">
          System_Entry // Internal_Docs
        </span>
        <h1 className="font-display text-6xl sm:text-8xl md:text-[9vw] uppercase tracking-tight text-[#ddb7ff] leading-none">
          Archive_01:<br />
          <span className="text-[#eadfed]">The Core</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Main visual panel (8 cols) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-8 relative overflow-hidden border border-white/[0.06]"
        >
          <ArchivePanel className="aspect-[16/9]" label="V.1.0 // Prototype_Deployment" />
        </motion.div>

        {/* Text + CTA (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-end gap-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            className="font-body text-sm leading-7 text-white/50 max-w-sm"
          >
            Decoding the architectural DNA of StreetPlayR. A visual investigation into the technical artifacts and digital subcultures defining the next era of decentralized expression.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          >
            <Link
              href="/collections"
              className="rounded-none group relative inline-flex items-center gap-4 border border-white/[0.14] px-8 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#eadfed] hover:bg-[#ddb7ff] hover:text-[#16111b] hover:border-[#ddb7ff] transition-all duration-500"
            >
              <span className="relative z-10">Initiate Sequence</span>
              <span className="relative z-10 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 2. MANIFESTO — BENTO GRID
// ═══════════════════════════════════════════════════════════════════════
function ManifestoSection() {
  return (
    <section className="relative py-28 sm:py-36 px-6 sm:px-12 lg:px-20 max-w-[1440px] mx-auto">
      {/* Section header */}
      <FadeIn>
        <div className="flex items-end justify-between mb-14">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-6 bg-white/20 block" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">The Manifesto</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase text-[#eadfed] leading-tight">
              Core Protocol
            </h2>
          </div>
          <div className="hidden md:block font-mono text-[9px] uppercase tracking-[0.2em] text-[#ddb7ff]/[0.5] text-right">
            Filter_Status: Active<br />Protocol: StreetPlayR_V1
          </div>
        </div>
      </FadeIn>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Digital Fortress — 2x2 */}
        <FadeIn delay={0.1} className="md:col-span-2 md:row-span-2 bg-[#231e27] border border-white/[0.06] p-8 md:p-10 flex flex-col justify-between group hover:border-[#ddb7ff]/20 transition-colors">
          <div>
            <span className="font-mono text-3xl text-[#ddb7ff] block mb-6">✦</span>
            <h3 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase text-[#ffb59e] leading-none mb-4">
              Digital<br />Fortress
            </h3>
          </div>
          <p className="font-body text-sm leading-7 text-white/40 max-w-md">
            Protecting the scarcity of our drops through encrypted biometric verification and immutable ledger tracking. Every thread is a data point.
          </p>
        </FadeIn>

        {/* Aesthetics */}
        <FadeIn delay={0.15} className="bg-[#1f1a23] border border-white/[0.06] p-6 md:p-8 group hover:border-[#ddb7ff]/20 transition-colors">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#ddb7ff] block mb-3">01 / Aesthetics</span>
          <p className="font-body text-sm leading-7 text-white/50">Brutalist structures meeting vaporwave palettes. High-octane contrast.</p>
        </FadeIn>

        {/* Ethos */}
        <FadeIn delay={0.2} className="bg-[#1f1a23] border border-white/[0.06] p-6 md:p-8 group hover:border-[#ddb7ff]/20 transition-colors">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#ddb7ff] block mb-3">02 / Ethos</span>
          <p className="font-body text-sm leading-7 text-white/50">Aggressive exclusivity. Only those who look for the signal find the drop.</p>
        </FadeIn>

        {/* No White Flashes — CTA banner */}
        <FadeIn delay={0.25} className="md:col-span-2 bg-[#ddb7ff] p-8 md:p-10 flex flex-col items-center justify-center text-center">
          <h4 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase text-[#16111b] leading-none">No White Flashes</h4>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#16111b]/60 mt-4">The StarLoader Protocol</p>
        </FadeIn>

        {/* Materiality */}
        <FadeIn delay={0.3} className="bg-[#1f1a23] border border-white/[0.06] p-6 md:p-8 group hover:border-[#ddb7ff]/20 transition-colors">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#ddb7ff] block mb-3">03 / Materiality</span>
          <p className="font-body text-sm leading-7 text-white/50">Archival-grade construction. Every seam is intentional and permanent.</p>
        </FadeIn>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 3. PROCESS RAIL — HORIZONTAL SCROLL
// ═══════════════════════════════════════════════════════════════════════
function ProcessRail() {
  const ITERATIONS = [
    { id: "01", title: "Frame_01: Topology", desc: "Initial topology mapping — structural blueprint and material matrix." },
    { id: "02", title: "Frame_02: Component X", desc: "Core component fabrication with encrypted biometric verification nodes." },
    { id: "03", title: "Frame_03: Texture Mapping", desc: "Surface articulation and texture mapping across all prototype iterations." },
    { id: "04", title: "Frame_04: Assembly", desc: "Final assembly protocol — quality assurance and archival documentation." },
  ];

  return (
    <section className="relative py-28 sm:py-36 overflow-hidden border-t border-white/[0.04]">
      <div className="px-6 sm:px-12 lg:px-20 max-w-[1440px] mx-auto mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px w-6 bg-white/20 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">Process Rail</span>
        </div>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase text-[#eadfed]">Design Intelligence Pipeline</h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ffb59e] mt-2 relative pl-4 before:content-['['] before:absolute before:left-0 before:opacity-50 after:content-[']'] after:ml-1 after:opacity-50">
          Evolution of the Chrome_Star Prototype
        </p>
      </div>

      <div className="flex gap-5 px-6 sm:px-12 lg:px-20 max-w-[1440px] mx-auto overflow-x-auto pb-6 no-scrollbar">
        {ITERATIONS.map((item) => (
          <FadeIn key={item.id} delay={0.1 * parseInt(item.id)} className="min-w-[320px] md:min-w-[420px] shrink-0">
            <div className="group bg-[#1f1a23] border border-white/[0.06] hover:border-[#ddb7ff]/20 transition-colors overflow-hidden">
              <div className="aspect-[4/5] relative overflow-hidden">
                <ArchivePanel className="absolute inset-0" label={`ITERATION_${item.id}`} />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#ddb7ff]/5 opacity-0 group-hover:opacity-100 transition-opacity z-30" />
              </div>
              <div className="p-5 border-t border-white/[0.05]">
                <h5 className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#ddb7ff]">{item.title}</h5>
                <p className="font-body text-xs text-white/40 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 4. TIMELINE — VERTICAL ARCHIVE
// ═══════════════════════════════════════════════════════════════════════
function TimelineSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.15, 0.85], ["0%", "100%"]);

  const events = [
    {
      year: "2021",
      title: "The Spark",
      body: "Formation of the core collective. Initial encryption protocols established in the underground circuits.",
    },
    {
      year: "2023",
      title: "V.1 Alpha",
      body: "First physical artifact drop. Sold out via the StarLoader protocol in 0.4 seconds across global nodes.",
    },
    {
      year: "2024",
      title: "Protocol Expansion",
      body: "Ecosystem expansion — new divisions, international node deployment, and the Chrome_Star prototype phase.",
    },
  ];

  return (
    <section ref={sectionRef} className="relative py-28 sm:py-36 px-6 sm:px-12 lg:px-20 max-w-[1440px] mx-auto border-t border-white/[0.04]">
      <FadeIn>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase text-[#ddb7ff] text-center mb-24">
          Chronological Archive
        </h2>
      </FadeIn>

      <div className="relative">
        {/* Timeline center line (animated) */}
        <div className="absolute left-1/2 -translate-x-1/2 w-px bg-white/[0.06] top-0 bottom-0 hidden md:block">
          <motion.div className="w-full bg-[#ddb7ff]/40" style={{ height: lineHeight }} />
        </div>

        <div className="space-y-32">
          {events.map((event, i) => (
            <TimelineEvent key={event.year} event={event} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineEvent({ event, index }: { event: { year: string; title: string; body: string }; index: number }) {
  const isLeft = index % 2 === 0;

  return (
    <div className={`relative flex flex-col ${isLeft ? "md:flex-row" : "md:flex-row-reverse"} items-center justify-between group`}>
      {/* Text side */}
      <FadeIn delay={0.1 * index} className={`w-full md:w-[45%] ${isLeft ? "md:text-right md:pr-12" : "md:text-left md:pl-12"}`}>
        <h4 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase text-[#ffb59e] leading-none">{event.title}</h4>
        <p className="font-body text-sm leading-7 text-white/40 mt-4">{event.body}</p>
      </FadeIn>

      {/* Year marker */}
      <div className="relative z-10 w-14 h-14 bg-[#16111b] border-2 border-[#ddb7ff]/40 flex items-center justify-center my-6 md:my-0 shrink-0">
        <span className="font-mono text-[11px] text-[#ddb7ff]">{event.year}</span>
      </div>

      {/* Visual panel side */}
      <FadeIn delay={0.15 + 0.1 * index} className={`w-full md:w-[45%] ${isLeft ? "md:text-left md:pl-12" : "md:text-right md:pr-12"}`}>
        <ArchivePanel className="aspect-[16/9] md:aspect-[4/3]" label={`YEAR_${event.year}`} />
      </FadeIn>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 5. TEAM — INTERNAL DIVISIONS
// ═══════════════════════════════════════════════════════════════════════
function TeamSection() {
  const members = [
    { role: "[ Division_Lead ]", name: "Xenon_01", title: "Systems Architect & Hardware Integration" },
    { role: "[ Creative_Dir ]", name: "Nova_Flux", title: "Visual Narrative & Aesthetic Engineering" },
    { role: "[ Logistics_OP ]", name: "Cipher_K", title: "Global Node Deployment & Supply Chain" },
  ];

  return (
    <section className="relative py-28 sm:py-36 px-6 sm:px-12 lg:px-20 max-w-[1440px] mx-auto border-t border-white/[0.04]">
      <FadeIn>
        <div className="flex flex-col items-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase text-[#eadfed] text-center">The Architects</h2>
          <div className="h-px w-24 bg-[#ddb7ff]/40 mt-4" />
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {members.map((member, i) => (
          <FadeIn key={member.name} delay={0.1 * i}>
            <div className="group bg-[#1f1a23] border border-white/[0.06] hover:border-[#ddb7ff]/20 transition-colors overflow-hidden">
              <div className="aspect-square relative overflow-hidden">
                <ArchivePanel className="absolute inset-0" />
                <div className="absolute inset-0 bg-[#ddb7ff]/5 opacity-0 group-hover:opacity-100 transition-opacity z-30" />
              </div>
              <div className="p-6 border-t border-white/[0.05]">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#ddb7ff]">{member.role}</span>
                <h5 className="font-display text-2xl uppercase text-[#eadfed] mt-1">{member.name}</h5>
                <p className="font-body text-xs text-white/40 mt-2 italic">{member.title}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 6. CLOSING / FINAL TRANSMISSION
// ═══════════════════════════════════════════════════════════════════════
function ClosingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section ref={ref} className="relative py-36 sm:py-48 overflow-hidden border-t border-white/[0.04]">
      {/* Atmospheric glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 3, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%]"
          style={{
            background: "radial-gradient(ellipse at center, rgba(221,183,255,0.03) 0%, transparent 65%)",
          }}
        />
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Overline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span className="h-px w-8 bg-white/15 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/25">Final Transmission</span>
          <span className="h-px w-8 bg-white/15 block" />
        </motion.div>

        {/* Heading */}
        <div className="overflow-hidden mb-2">
          <motion.h2
            initial={{ y: "105%", opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 1.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[12vw] sm:text-[9vw] md:text-[7vw] uppercase leading-[0.88] tracking-tight text-[#ddb7ff]"
          >
            Enter The
          </motion.h2>
        </div>
        <div className="overflow-hidden">
          <motion.h2
            initial={{ y: "105%", opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 1.4, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[12vw] sm:text-[9vw] md:text-[7vw] uppercase leading-[0.88] tracking-tight text-[#eadfed]/20"
          >
            Archive
          </motion.h2>
        </div>

        {/* Body */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1.8, delay: 0.45, ease: "easeOut" }}
          className="mt-10 mx-auto max-w-sm font-body text-sm leading-8 text-white/30 tracking-wide"
        >
          Limited drops. No restock. No noise.
          <br />
          Only the pieces — and those who find them.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1.8, delay: 0.65, ease: "easeOut" }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/collections"
            className="rounded-none group relative inline-flex items-center gap-5 border border-white/[0.14] px-10 py-5 font-mono text-xs uppercase tracking-[0.2em] text-[#eadfed] transition-all duration-500 hover:bg-[#ddb7ff] hover:text-[#16111b] hover:border-[#ddb7ff]"
          >
            <span>Explore Archive</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <Link
            href="/shop"
            className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors px-4 py-5"
          >
            Shop All
          </Link>
        </motion.div>

        {/* SP mark */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 3.5, delay: 1.2, ease: "easeOut" }}
          className="mt-28 font-display text-[1.8vw] sm:text-[1.4vw] uppercase tracking-[0.6em] text-white/[0.04]"
        >
          STREET PLAYR — SP — EST. 2024
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 4, delay: 2.0, ease: "easeOut" }}
          className="mt-8 font-body text-[11px] tracking-[0.18em] text-white/[0.08] uppercase"
        >
          Still becoming.
        </motion.p>
      </div>
    </section>
  );
}

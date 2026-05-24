"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

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
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.06,
          mixBlendMode: "overlay",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      <div className="absolute inset-0 pointer-events-none border border-white/[0.04]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]" />
      {label && (
        <div className="absolute bottom-4 left-5 z-30">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25">{label}</span>
        </div>
      )}
    </div>
  );
}

const collections = [
  { id: "core", title: "Core", subtitle: "Foundation pieces", slug: "/collections?category=CORE" },
  { id: "outerwear", title: "Outerwear", subtitle: "Shell & insulation", slug: "/collections?category=OUTERWEAR" },
  { id: "sport", title: "Sport", subtitle: "Performance wear", slug: "/collections?category=SPORT" },
  { id: "archive", title: "Archive", subtitle: "Past drops archive", slug: "/collections?category=ARCHIVE" },
];

export default function CollectionTiles() {
  return (
    <section className="relative py-24 sm:py-28 px-4 md:px-8 lg:px-12 w-full max-w-[min(98vw,2560px)] mx-auto border-t border-white/[0.04]">
      <FadeIn>
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px w-6 bg-white/20 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">Collections</span>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {collections.map((col, i) => (
          <FadeIn key={col.id} delay={0.1 * i}>
            <Link
              href={col.slug}
              className="group relative block aspect-[4/3] overflow-hidden border border-white/[0.06] hover:border-[#ddb7ff]/20 transition-colors rounded-xl"
            >
              <ArchivePanel className="absolute inset-0" label={`Collection // ${col.title}`} />
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-8">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff]/70 mb-2">
                  COLLECTION 0{i + 1}
                </span>
                <h3 className="font-display text-[clamp(28px,3.5vw,48px)] uppercase text-[#eadfed] leading-none group-hover:text-[#ddb7ff] transition-colors">
                  {col.title}
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 mt-2">
                  {col.subtitle}
                </p>
              </div>
              <div className="absolute inset-0 bg-[#ddb7ff]/5 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
            </Link>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

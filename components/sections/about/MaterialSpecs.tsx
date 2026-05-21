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
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const SPECS = [
  {
    id: "hq-cotton",
    image: "/assets/about/fabric-heavy-01.svg",
    alt: "Heavyweight cotton jersey — fabric surface detail",
    ref: "SP-RR // MAT-001",
    name: "220GSM Brushed Cotton Jersey",
    description: "Archival-grade heavyweight cotton. Structured drape. Pre-shrunk, double-stitched seams, reinforced collar.",
    tech: [
      "220 GSM weight",
      "100% combed ring-spun cotton",
      "Pre-shrunk enzyme wash",
      "Double-needle hem & sleeves",
      "Shoulder-to-shoulder tape",
    ],
  },
  {
    id: "waffle",
    image: "/assets/about/fabric-heavy-02.svg",
    alt: "Waffle knit terry — textile construction detail",
    ref: "SP-RR // MAT-002",
    name: "380GSM Waffle Knit Terry",
    description: "Deep-texture waffle construction. Thermal regulation. Breathable, heavyweight, precision-cut panels.",
    tech: [
      "380 GSM weight",
      "80% cotton / 20% polyester",
      "Waffle knit terry",
      "Low-pill fiber treatment",
      "Ribbed cuffs & hem",
    ],
  },
  {
    id: "garment-dye",
    image: "/assets/about/fabric-heavy-03.svg",
    alt: "Garment-dyed finish — mineral pigment detail",
    ref: "SP-RR // MAT-003",
    name: "Premium Garment-Dye Finish",
    description: "Garment-dyed for depth. Each batch produces subtle variation — no two pieces identical. Fade-resistant formulation.",
    tech: [
      "Garment-dye process",
      "Enzyme + silicon wash",
      "Mineral pigment infusion",
      "Fade-resistant formulation",
      "Batch-tracked consistency",
    ],
  },
];

function SpecPanel({
  spec,
  index,
}: {
  spec: (typeof SPECS)[number];
  index: number;
}) {
  const isReversed = index % 2 !== 0;

  return (
    <FadeIn delay={0.1 * index}>
      <div
        className={`flex flex-col ${
          isReversed ? "lg:flex-row-reverse" : "lg:flex-row"
        } overflow-hidden bg-[#0a0a0a] border border-white/[0.06]`}
      >
        {/* Image side — dominant */}
        <div className="relative w-full lg:w-[85%] aspect-[4/3] lg:aspect-auto lg:min-h-[600px] overflow-hidden bg-[#0a0a0a]">
          <Image
            src={spec.image}
            alt={spec.alt}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 85vw, 100vw"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.4) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)",
            }}
          />
          <div className="absolute inset-0 border border-white/[0.03] pointer-events-none" />
          <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.5)] pointer-events-none" />

          {/* Reference label overlaid on image */}
          <div className="absolute top-5 left-5 z-10">
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/20">
              {spec.ref}
            </span>
          </div>
        </div>

        {/* Spec panel — compact, industrial, docked */}
        <div className="w-full lg:w-[15%] min-w-[200px] lg:min-w-[240px] bg-[#0d0b10] border-t lg:border-t-0 lg:border-l border-white/[0.06] flex flex-col justify-between">
          <div className="p-6 lg:p-8 flex flex-col gap-5">
            <div>
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#ddb7ff]/50 block mb-3">
                Material Spec
              </span>
              <h3 className="font-display text-[18px] sm:text-[20px] uppercase text-[#eadfed] leading-[1.15]">
                {spec.name}
              </h3>
            </div>
            <p className="font-body text-[11px] leading-[1.8] text-white/35 tracking-wide">
              {spec.description}
            </p>
          </div>

          <div className="p-6 lg:p-8 pt-0">
            <div className="pt-5 border-t border-white/[0.06]">
              <span className="font-mono text-[7px] uppercase tracking-[0.35em] text-white/20 block mb-3">
                Construction
              </span>
              <ul className="space-y-1.5">
                {spec.tech.map((t) => (
                  <li
                    key={t}
                    className="font-mono text-[9px] tracking-[0.04em] text-white/25 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-[#ddb7ff]/40 mt-0.5 shrink-0">—</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

export default function MaterialSpecs() {
  return (
    <section className="relative py-36 sm:py-48 px-6 sm:px-12 lg:px-20 max-w-[1440px] mx-auto border-t border-white/[0.04]">
      <div className="mb-16">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-6 bg-white/20 block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">Material Specifications</span>
          </div>
        </FadeIn>
        <FadeIn delay={0.15}>
          <h2 className="font-display text-[clamp(40px,6vw,96px)] leading-[0.88] tracking-[0.01em] uppercase text-[#eadfed] max-w-[10ch]">
            Engineered for the city after dark.
          </h2>
        </FadeIn>
      </div>

      <div className="space-y-10 sm:space-y-12">
        {SPECS.map((spec, i) => (
          <SpecPanel key={spec.id} spec={spec} index={i} />
        ))}
      </div>
    </section>
  );
}

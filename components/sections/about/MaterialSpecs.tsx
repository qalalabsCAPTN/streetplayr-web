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

const TILES = [
  {
    id: "cotton",
    image: "/assets/about/fabric-swatch-01.png",
    alt: "Brushed cotton jersey — heavyweight fabric weave detail",
    ref: "SP-RR // MAT-001",
    name: "220GSM Brushed Cotton Jersey",
    description: "Archival-grade heavyweight cotton. Structured drape. Double-needle seams, reinforced collar, shoulder-to-shoulder tape.",
    specs: ["220 GSM weight", "100% combed ring-spun cotton", "Pre-shrunk enzyme wash"],
  },
  {
    id: "waffle",
    image: "/assets/about/fabric-swatch-02.png",
    alt: "Waffle knit terry — textured fabric construction",
    ref: "SP-RR // MAT-002",
    name: "380GSM Waffle Knit Terry",
    description: "Deep-texture waffle construction. Thermal regulation. Low-pill treatment, ribbed cuffs, precision-cut panels.",
    specs: ["380 GSM weight", "80% cotton / 20% polyester", "Waffle knit terry"],
  },
  {
    id: "dye",
    image: "/assets/about/fabric-swatch-03.png",
    alt: "Garment-dye finish — mineral pigment fabric surface",
    ref: "SP-RR // MAT-003",
    name: "Premium Garment-Dye Finish",
    description: "Garment-dyed for depth. Fade-resistant formulation. Batch-tracked consistency. Mineral pigment infusion.",
    specs: ["Garment-dye process", "Enzyme + silicon wash", "Mineral pigment infusion"],
  },
];

function MaterialTile({ tile, index }: { tile: (typeof TILES)[number]; index: number }) {
  return (
    <FadeIn delay={0.1 * index}>
      <div className="group relative bg-[#0a0a0a] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="grid grid-rows-[3fr_1fr] aspect-[3/4]">
          <div className="relative overflow-hidden">
            <Image
              src={tile.image}
              alt={tile.alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            />
            <div className="absolute top-4 left-4 z-10">
              <span className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/20">
                {tile.ref}
              </span>
            </div>
          </div>
          <div className="bg-[#0d0b10] px-5 py-4 flex flex-col justify-center">
            <span className="font-mono text-[6px] uppercase tracking-[0.3em] text-[#ddb7ff]/40 block leading-none mb-2.5">
              Material Spec
            </span>
            <h3 className="font-display text-[13px] sm:text-[14px] uppercase text-[#eadfed] leading-[1.15] mb-1.5">
              {tile.name}
            </h3>
            <p className="font-body text-[9px] leading-[1.5] text-white/35 tracking-wide line-clamp-2 mb-2">
              {tile.description}
            </p>
            <div className="pt-2 border-t border-white/[0.06]">
              <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
                {tile.specs.map((s) => (
                  <span key={s} className="font-mono text-[7px] tracking-[0.02em] text-white/25 flex items-center gap-1">
                    <span className="text-[#ddb7ff]/30">—</span>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

export default function MaterialSpecs() {
  return (
    <section className="relative py-28 sm:py-36 px-4 md:px-6 w-full max-w-[min(95vw,2400px)] mx-auto border-t border-white/[0.04]">
      <div className="mb-16">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-6 bg-white/20 block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">Material Specifications</span>
          </div>
        </FadeIn>
        <FadeIn delay={0.15}>
          <h2 className="font-display text-[clamp(40px,6vw,96px)] leading-[0.88] tracking-[0.01em] uppercase text-[#eadfed]">
            Engineered for the city after dark.
          </h2>
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
        {TILES.map((tile, i) => (
          <MaterialTile key={tile.id} tile={tile} index={i} />
        ))}
      </div>
    </section>
  );
}

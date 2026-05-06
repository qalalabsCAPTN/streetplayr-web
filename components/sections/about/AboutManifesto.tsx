"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

const manifestoLines = [
  { text: "We did not launch a brand.", indent: false, dim: false },
  { text: "We declared a position.", indent: true, dim: false },
  { text: "", indent: false, dim: false }, // silence
  { text: "Born from the tension", indent: false, dim: true },
  { text: "between the street and the studio.", indent: true, dim: false },
  { text: "", indent: false, dim: false }, // silence
  { text: "Between restraint", indent: false, dim: true },
  { text: "and controlled chaos.", indent: true, dim: false },
  { text: "", indent: false, dim: false }, // silence
  { text: "StreetPlayR does not follow culture.", indent: false, dim: false },
  { text: "It moves before it.", indent: true, dim: true },
];

function ManifestoLine({
  text,
  indent,
  dim,
  index,
}: {
  text: string;
  indent: boolean;
  dim: boolean;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });

  if (text === "") {
    return <div className="h-8 sm:h-12" />;
  }

  return (
    <div
      ref={ref}
      className={`overflow-hidden ${indent ? "pl-8 sm:pl-20 lg:pl-32" : ""}`}
    >
      <motion.p
        initial={{ y: "105%", opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : {}}
        transition={{
          duration: 1.1,
          delay: index * 0.04,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={`font-display text-[7.5vw] sm:text-[5.5vw] lg:text-[4.2vw] xl:text-[3.6vw] uppercase leading-[1.05] tracking-tight ${
          dim ? "text-white/25" : "text-white"
        }`}
      >
        {text}
      </motion.p>
    </div>
  );
}

export default function AboutManifesto() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const accentX = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#050505] py-32 sm:py-44 lg:py-56 overflow-hidden"
      aria-label="Brand manifesto"
    >
      {/* Atmospheric accent glow */}
      <motion.div
        style={{ opacity: bgOpacity, x: accentX }}
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="absolute top-1/2 left-[-20%] w-[70%] h-[60%] -translate-y-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(212,255,30,0.03) 0%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* Watermark */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-end overflow-hidden select-none"
        aria-hidden="true"
      >
        <span
          className="font-display text-[22vw] leading-none text-white/[0.018] uppercase whitespace-nowrap pr-[-2%]"
          style={{ WebkitTextStroke: "1px rgba(255,255,255,0.04)" }}
        >
          MANIFESTO
        </span>
      </div>

      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          mixBlendMode: "overlay",
        }}
      />

      <div className="relative z-20 mx-auto max-w-7xl px-6 sm:px-10 lg:px-20">
        {/* Section label */}
        <ManifestoSectionLabel />

        {/* Manifesto lines */}
        <div className="mt-16 sm:mt-24">
          {manifestoLines.map((line, i) => (
            <ManifestoLine
              key={i}
              text={line.text}
              indent={line.indent}
              dim={line.dim}
              index={i}
            />
          ))}
        </div>

        {/* Closing accent line */}
        <ManifestoClosing />
      </div>
    </section>
  );
}

function ManifestoSectionLabel() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -12 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="flex items-center gap-4"
    >
      <span className="h-px w-8 bg-white/20 block" />
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
        The Manifesto
      </span>
    </motion.div>
  );
}

function ManifestoClosing() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.8, delay: 0.3, ease: "easeOut" }}
      className="mt-24 sm:mt-32 flex items-center gap-6"
    >
      <span className="h-px flex-1 bg-white/8" />
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/20">
        SP — 2024 —
      </span>
      <span className="h-px w-8 bg-white/8" />
    </motion.div>
  );
}

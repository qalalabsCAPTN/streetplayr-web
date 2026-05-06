"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const lines = [
  {
    text: "We don't document culture.",
    size: "large",
    indent: "0",
    opacity: 0.88,
    delay: 0,
  },
  {
    text: "We make it.",
    size: "xlarge",
    indent: "6vw",
    opacity: 0.55,
    delay: 0.14,
  },
  {
    text: "Every piece is an edit.",
    size: "medium",
    indent: "2vw",
    opacity: 0.35,
    delay: 0.26,
  },
  {
    text: "No noise. No trend. No explanation.",
    size: "small",
    indent: "10vw",
    opacity: 0.22,
    delay: 0.38,
  },
  {
    text: "Just the work.",
    size: "large",
    indent: "0",
    opacity: 0.14,
    delay: 0.5,
  },
];

const sizeMap: Record<string, string> = {
  xlarge: "text-[12vw] sm:text-[9vw] lg:text-[7vw]",
  large: "text-[8vw] sm:text-[6vw] lg:text-[4.5vw]",
  medium: "text-[5.5vw] sm:text-[4vw] lg:text-[3vw]",
  small: "text-[4vw] sm:text-[3vw] lg:text-[2.2vw]",
};

function ManifestoLine({
  text,
  size,
  indent,
  opacity,
  delay,
}: {
  text: string;
  size: string;
  indent: string;
  opacity: number;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-8% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 2.4, delay, ease: "easeOut" }}
      style={{ paddingLeft: indent }}
      className="py-0.5 sm:py-1"
    >
      <span
        className={`font-display uppercase leading-none tracking-tight ${sizeMap[size]}`}
        style={{ opacity, color: "white" }}
      >
        {text}
      </span>
    </motion.div>
  );
}

export default function JournalManifesto() {
  return (
    <section
      className="relative w-full bg-[#050505] overflow-hidden py-32 sm:py-52"
      aria-label="Journal manifesto"
    >
      {/* Atmospheric glow — right side */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 50% at 95% 45%, rgba(255,255,255,0.015) 0%, transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-20">
        {/* Section marker */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="flex items-center gap-5 mb-20 sm:mb-28"
        >
          <span className="h-px w-10 bg-white/12 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/22">
            Notes to Self
          </span>
        </motion.div>

        {/* Manifesto lines */}
        <div className="flex flex-col gap-1 sm:gap-2">
          {lines.map((line) => (
            <ManifestoLine key={line.text} {...line} />
          ))}
        </div>

        {/* Trailing silence */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 3, delay: 0.8, ease: "easeOut" }}
          className="mt-24 sm:mt-36 flex items-center gap-6"
        >
          <span className="h-px flex-1 max-w-[3rem] bg-white/8 block" />
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/12">
            SP — Archive of Intent
          </p>
        </motion.div>
      </div>
    </section>
  );
}

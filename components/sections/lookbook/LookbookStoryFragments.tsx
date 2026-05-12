"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const fragments = [
  { phrase: "CONTROLLED CHAOS", size: "large", offset: "0", opacity: 0.9 },
  { phrase: "BUILT IN SILENCE", size: "small", offset: "8vw", opacity: 0.4 },
  { phrase: "FORM OVER NOISE", size: "medium", offset: "2vw", opacity: 0.7 },
  { phrase: "WORN IN THE CITY", size: "small", offset: "12vw", opacity: 0.28 },
  { phrase: "ARCHIVE SEASON", size: "large", offset: "0", opacity: 0.55 },
  { phrase: "NO TREND. NO NOISE.", size: "micro", offset: "6vw", opacity: 0.2 },
];

const sizeMap: Record<string, string> = {
  large: "text-[11vw] sm:text-[8vw] lg:text-[6vw]",
  medium: "text-[7vw] sm:text-[5vw] lg:text-[3.8vw]",
  small: "text-[5vw] sm:text-[3.5vw] lg:text-[2.6vw]",
  micro: "text-[3.5vw] sm:text-[2.5vw] lg:text-[1.8vw]",
};

function Fragment({
  phrase,
  size,
  offset,
  opacity,
  delay,
}: {
  phrase: string;
  size: string;
  offset: string;
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
      transition={{ duration: 2.2, delay, ease: "easeOut" }}
      style={{ paddingLeft: offset }}
      className="py-1 sm:py-2"
    >
      <span
        className={`font-display uppercase leading-none tracking-tight ${sizeMap[size]}`}
        style={{ opacity, color: "white" }}
      >
        {phrase}
      </span>
    </motion.div>
  );
}

export default function LookbookStoryFragments() {
  return (
    <section
      className="relative w-full bg-[#050505] overflow-hidden py-28 sm:py-44"
      aria-label="Story fragments and cultural positioning"
    >
      {/* Atmospheric side glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 5% 50%, rgba(157,78,221,0.018) 0%, transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-20">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="flex items-center gap-5 mb-20 sm:mb-28"
        >
          <span className="h-px w-10 bg-white/15 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/25">
            Cultural Positioning
          </span>
        </motion.div>

        {/* Fragment stack — staggered opacity hierarchy */}
        <div className="flex flex-col">
          {fragments.map((f, i) => (
            <Fragment
              key={f.phrase}
              phrase={f.phrase}
              size={f.size}
              offset={f.offset}
              opacity={f.opacity}
              delay={i * 0.14}
            />
          ))}
        </div>

        {/* Trailing line — absolute quiet */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 3, delay: 0.8, ease: "easeOut" }}
          className="mt-20 sm:mt-28 flex items-center gap-6"
        >
          <span className="h-px flex-1 max-w-[4rem] bg-white/8 block" />
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/14">
            Not explanation. Atmosphere.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

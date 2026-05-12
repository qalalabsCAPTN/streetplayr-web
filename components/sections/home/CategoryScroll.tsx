"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const categories = [
  "OUTERWEAR",
  "TOPS",
  "BOTTOMS",
  "HEADWEAR",
  "ACCESSORIES",
  "FOOTWEAR",
  "ESSENTIALS",
];

export default function CategoryScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const x1 = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["-50%", "0%"]);

  return (
    <section ref={containerRef} className="w-full bg-[#050505] py-32 overflow-hidden text-[var(--sp-accent)] flex flex-col gap-6 md:gap-12 border-y border-white/5">
      <motion.div style={{ x: x1 }} className="flex whitespace-nowrap" data-cursor="drag">
        {[...categories, ...categories, ...categories].map((category, index) => (
          <div key={index} className="flex items-center">
            <span className="font-display text-7xl md:text-9xl lg:text-[10rem] uppercase px-8 opacity-100 hover:opacity-80 transition-opacity cursor-none drop-shadow-2xl">
              {category}
            </span>
            <span className="text-5xl md:text-7xl px-8 opacity-50">✧</span>
          </div>
        ))}
      </motion.div>
      <motion.div style={{ x: x2 }} className="flex whitespace-nowrap" data-cursor="drag">
        {[...categories, ...categories, ...categories].reverse().map((category, index) => (
          <div key={index} className="flex items-center">
            <span 
              className="font-display text-7xl md:text-9xl lg:text-[10rem] uppercase px-8 opacity-80 hover:opacity-100 transition-opacity cursor-none text-transparent"
              style={{ WebkitTextStroke: "1px var(--sp-accent)" }}
            >
              {category}
            </span>
            <span className="text-5xl md:text-7xl px-8 opacity-30 text-transparent" style={{ WebkitTextStroke: "1px var(--sp-accent)" }}>✧</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

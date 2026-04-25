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
    <section ref={containerRef} className="w-full bg-[#d4ff1e] py-16 overflow-hidden text-black flex flex-col gap-4">
      <motion.div style={{ x: x1 }} className="flex whitespace-nowrap" data-cursor="drag">
        {[...categories, ...categories, ...categories].map((category, index) => (
          <div key={index} className="flex items-center">
            <span className="font-display text-6xl md:text-8xl lg:text-9xl uppercase px-8 opacity-90 hover:opacity-100 transition-opacity cursor-none">
              {category}
            </span>
            <span className="text-4xl md:text-6xl px-4 opacity-50">✦</span>
          </div>
        ))}
      </motion.div>
      <motion.div style={{ x: x2 }} className="flex whitespace-nowrap" data-cursor="drag">
        {[...categories, ...categories, ...categories].reverse().map((category, index) => (
          <div key={index} className="flex items-center">
            <span className="font-display text-6xl md:text-8xl lg:text-9xl uppercase px-8 opacity-90 hover:opacity-100 transition-opacity cursor-none text-black/50 hover:text-black">
              {category}
            </span>
            <span className="text-4xl md:text-6xl px-4 opacity-30">✦</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

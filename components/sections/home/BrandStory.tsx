"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function BrandStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const textOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.2, 1, 1, 0.2]);

  return (
    <section ref={containerRef} className="relative w-full bg-black py-40 px-4 flex items-center justify-center">
      <div className="max-w-4xl text-center">
        <motion.p 
          style={{ opacity: textOpacity }}
          className="font-display text-4xl md:text-6xl lg:text-7xl uppercase leading-[1.1] tracking-wide text-white"
        >
          Born from the <span className="text-[#d4ff1e] italic pr-2">streets</span>. <br />
          Engineered for the <span className="text-white/50">relentless</span>. <br />
          We don't just play the game, <br />
          we <span className="underline decoration-[#d4ff1e] decoration-4 underline-offset-8">redefine</span> the rules.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16"
        >
          <button data-cursor="button" className="font-mono text-sm tracking-widest text-white hover:text-[#d4ff1e] transition-colors uppercase border border-white/20 px-8 py-4 rounded-full hover:border-[#d4ff1e]/50">
            Our Story
          </button>
        </motion.div>
      </div>
    </section>
  );
}

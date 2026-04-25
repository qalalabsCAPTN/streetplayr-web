"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const words = "Born from the streets. Engineered for the relentless. We don't just play the game, we redefine the rules.".split(" ");

export default function BrandStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section ref={containerRef} className="relative w-full h-[200vh] bg-[#020202]">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center px-4 md:px-16 overflow-hidden">
        {/* Grunge typography watermark (SEAKOFF accent) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0 select-none overflow-hidden">
          <span className="font-display text-[15vw] md:text-[25vw] leading-none text-white whitespace-nowrap rotate-[-5deg] mix-blend-overlay" style={{ WebkitTextStroke: "2px white", color: "transparent" }}>
            BUILT FOR STREETS
          </span>
        </div>
        
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#d4ff1e]/5 via-transparent to-transparent opacity-50 z-0" />
        
        <div className="relative z-10 max-w-5xl text-center flex flex-wrap justify-center gap-x-4 gap-y-2 md:gap-x-6 md:gap-y-4">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + (1 / words.length);
            
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const opacity = useTransform(scrollYProgress, [start, end], [0.15, 1]);
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const y = useTransform(scrollYProgress, [start, end], [10, 0]);
            
            const isHighlight = word.includes("redefine") || word.includes("streets.");
            
            return (
              <motion.span 
                key={i}
                style={{ opacity, y }}
                className={`font-display text-5xl md:text-7xl lg:text-8xl uppercase leading-[1.1] tracking-wide ${
                  isHighlight ? "text-[#d4ff1e] italic pr-2" : "text-white"
                }`}
              >
                {word}
              </motion.span>
            );
          })}
        </div>

        <motion.div 
          style={{ 
            opacity: useTransform(scrollYProgress, [0.8, 1], [0, 1]),
            y: useTransform(scrollYProgress, [0.8, 1], [20, 0])
          }}
          className="absolute bottom-16 md:bottom-24"
        >
          <button data-cursor="button" className="group font-mono text-xs tracking-[0.2em] text-white hover:text-[#d4ff1e] transition-colors uppercase border border-white/20 px-10 py-5 rounded-full hover:border-[#d4ff1e]/50 backdrop-blur-md">
            Discover Our Origins
          </button>
        </motion.div>
      </div>
    </section>
  );
}

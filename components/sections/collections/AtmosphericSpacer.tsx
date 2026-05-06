"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

export default function AtmosphericSpacer() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 1.05]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section 
      ref={containerRef}
      className="relative flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden py-32 md:min-h-[100vh] md:py-48"
    >
      <div className="absolute inset-0 z-0 bg-[#050505]" />
      
      {/* Background large subtle text */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none">
        <h2 className="font-display text-[25vw] leading-none text-white whitespace-nowrap">
          SILENCE
        </h2>
      </div>

      <motion.div 
        style={{ y: y1, scale, opacity }}
        className="relative z-10 w-full max-w-[1200px] px-6 md:px-12"
      >
        <div 
          className="relative aspect-[4/5] w-full overflow-hidden md:aspect-[21/9]"
          data-cursor="video"
        >
          <Image
            src="https://images.unsplash.com/photo-1550639524-a6f58345a278?q=80&w=2000&auto=format&fit=crop"
            alt="Atmospheric Campaign"
            fill
            className="object-cover grayscale"
          />
          <div className="absolute inset-0 bg-black/30 mix-blend-multiply" />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-20 mt-12 max-w-2xl px-6 text-center md:mt-24"
      >
        <p className="font-body text-lg leading-relaxed text-[#8c8c8c] md:text-2xl">
          We believe in the space between.
          The pause that gives meaning to the movement.
        </p>
      </motion.div>
    </section>
  );
}

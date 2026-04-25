"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function HomeHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-black"
    >
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 h-full w-full"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover opacity-60"
        >
          <source src="/assets/videos/WebAnimation_V1.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60" />
      </motion.div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <h1 className="font-display mb-6 text-6xl uppercase tracking-widest text-white md:text-8xl lg:text-[10vw] leading-[0.85]">
            Redefine <br />
            <span className="text-[#d4ff1e]">The Play</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-12 flex flex-col items-center space-y-6"
        >
          <button
            data-cursor="button"
            className="group relative flex items-center gap-4 overflow-hidden rounded-full border border-white/20 bg-white/5 px-8 py-4 font-mono text-sm tracking-widest text-white backdrop-blur-md transition-all hover:bg-white hover:text-black"
          >
            <span className="relative z-10">EXPLORE COLLECTION</span>
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-xs text-white/50 tracking-widest">SCROLL</span>
          <div className="h-12 w-[1px] bg-white/20 overflow-hidden">
            <motion.div
              animate={{ y: [0, 48, 48] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "circInOut" }}
              className="h-full w-full bg-[#d4ff1e]"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

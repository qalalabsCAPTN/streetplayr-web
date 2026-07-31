"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

export default function FeaturedCollections() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Extremely subtle parallax (was 15/20/10 — too floaty)
  const y1 = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["0%", "5%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["6%", "-6%"]);
  const textY = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["3%", "-3%"]);

  return (
    <section ref={containerRef} className="relative w-full bg-transparent py-32 px-4 md:px-8 lg:px-12 overflow-hidden">
      {/* Background oversized typography watermark */}
      <motion.div 
        style={{ y: textY }}
        className="absolute top-1/4 left-0 w-full text-center pointer-events-none opacity-[0.03] z-0"
      >
        <span className="font-display text-[20vw] leading-none whitespace-nowrap">CURATED</span>
      </motion.div>

      <div className="relative z-10 max-w-[min(98vw,2560px)] mx-auto">
        <div className="mb-32 flex flex-col items-center text-center">
          <span className="font-mono text-xs tracking-[0.3em] text-[var(--sp-accent)] uppercase mb-6">Archive 001</span>
          <h2 className="font-display text-5xl md:text-8xl uppercase tracking-widest text-white leading-[0.9]">
            The <br />
            <span className="text-white/40 italic pl-12 md:pl-24">Heritage</span>
          </h2>
        </div>

        {/* Low-opacity SEAKOFF style barcode stamp */}
        <div className="absolute top-10 right-4 md:right-16 opacity-20 rotate-[-2deg] pointer-events-none mix-blend-screen hidden md:block">
          <svg width="120" height="60" viewBox="0 0 120 60" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="4" height="40" />
            <rect x="8" y="0" width="2" height="40" />
            <rect x="14" y="0" width="6" height="40" />
            <rect x="24" y="0" width="4" height="40" />
            <rect x="32" y="0" width="8" height="40" />
            <rect x="44" y="0" width="2" height="40" />
            <rect x="50" y="0" width="4" height="40" />
            <rect x="58" y="0" width="12" height="40" />
            <rect x="74" y="0" width="4" height="40" />
            <rect x="82" y="0" width="6" height="40" />
            <rect x="92" y="0" width="2" height="40" />
            <rect x="98" y="0" width="8" height="40" />
            <rect x="110" y="0" width="4" height="40" />
            <text x="0" y="55" fontFamily="monospace" fontSize="10" letterSpacing="2">ST-PLYR-01</text>
          </svg>
        </div>

        {/* Magazine overlapping composition */}
        <div className="relative grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-0 mt-20">
          <motion.div 
            style={{ y: y1 }}
            className="md:col-span-8 md:col-start-1 relative z-10 group"
          >
            <div data-cursor="drag" className="relative w-full aspect-[4/5] md:aspect-[16/10] overflow-hidden bg-[#111] rotate-[1deg] shadow-2xl border border-white/5 p-1 pb-4 bg-zinc-900/50 rounded-xl">
              <Image
                src="/assets/products/inspired/image-1.webp"
                alt="Inspired tee editorial"
                fill
                className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-black/20 mix-blend-overlay transition-opacity duration-1000 group-hover:opacity-0" />
            </div>
            <div className="static md:absolute md:-bottom-16 left-8 md:left-12 mt-4 md:mt-0 flex flex-col bg-[#231e27]/80 backdrop-blur-md p-6 border border-white/10 rounded-lg">
              <span className="font-mono text-xs text-white/50 tracking-[0.2em] mb-2 uppercase">Editorial</span>
              <h3 className="font-display text-3xl tracking-wider">Heritage Polo</h3>
            </div>
          </motion.div>

          <motion.div 
            style={{ y: y2 }}
            className="md:col-span-5 md:col-start-8 md:-mt-48 md:-ml-16 relative z-20 group"
          >
            <div data-cursor="product" className="relative w-full aspect-[3/4] md:aspect-[3/4] overflow-hidden bg-[#111] shadow-2xl shadow-black/80 rotate-[-1.5deg] border border-white/5 p-1 pb-8 bg-zinc-900/50 rounded-xl">
              <Image
                src="/assets/products/star-tank-dark/image-1.jpg"
                alt="Star tank"
                fill
                className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
              
              <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-[var(--sp-accent)] tracking-[0.2em] mb-2 uppercase">Performance</span>
                  <h3 className="font-body text-xl tracking-wide text-white">Tech Jersey</h3>
                </div>
                <span className="font-mono text-xs text-white/70">001</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

export default function FeaturedCollections() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["15%", "-15%"]);

  return (
    <section ref={containerRef} className="relative w-full bg-black py-32 px-4 md:px-8 lg:px-16">
      <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between">
        <h2 className="font-display text-5xl uppercase tracking-wider text-white md:text-7xl">
          Curated <br />
          <span className="text-white/40">For The Streets</span>
        </h2>
        <a href="#" data-cursor="button" className="mt-8 font-mono text-sm tracking-widest text-white/60 hover:text-white transition-colors border-b border-white/20 pb-1 w-fit">
          VIEW ALL COLLECTIONS
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
        <motion.div 
          style={{ y: y1 }}
          className="md:col-span-7 flex flex-col group"
        >
          <div data-cursor="product" className="relative w-full aspect-[4/5] overflow-hidden bg-[#111]">
            <Image
              src="/assets/polo-editorial.png"
              alt="Polo Editorial"
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          </div>
          <div className="mt-6 flex justify-between items-center">
            <div>
              <h3 className="font-body text-2xl font-medium tracking-wide">Heritage Polo Series</h3>
              <p className="font-mono text-sm text-white/50 mt-2">CLASSIC • REIMAGINED</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          style={{ y: y2 }}
          className="md:col-span-5 flex flex-col group md:mt-32"
        >
          <div data-cursor="product" className="relative w-full aspect-[3/4] overflow-hidden bg-[#111]">
            <Image
              src="/assets/srh-jersey.jpg"
              alt="SRH Jersey"
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          </div>
          <div className="mt-6 flex justify-between items-center">
            <div>
              <h3 className="font-body text-2xl font-medium tracking-wide">Performance Drop</h3>
              <p className="font-mono text-sm text-white/50 mt-2">TECH • BREATHABLE</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

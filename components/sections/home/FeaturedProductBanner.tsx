"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

export default function FeaturedProductBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.1, 1]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <section ref={containerRef} className="relative w-full h-[80vh] min-h-[600px] overflow-hidden bg-[#0c0c0c]">
      <motion.div style={{ scale, y }} className="absolute inset-0 h-full w-full">
        <Image
          src="/assets/hero-tees.png"
          alt="Featured Drop"
          fill
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </motion.div>

      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="font-mono text-sm tracking-widest text-[#d4ff1e] mb-4 block">SIGNATURE DROP</span>
            <h2 className="font-display text-5xl md:text-8xl uppercase tracking-widest text-white mb-8">
              The Genesis <br /> Tee
            </h2>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <button data-cursor="button" className="group relative overflow-hidden rounded-full border border-white bg-white text-black px-10 py-4 font-mono text-sm tracking-widest transition-all hover:bg-transparent hover:text-white">
              <span className="relative z-10">SHOP NOW</span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

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

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section ref={containerRef} className="relative w-full h-[100vh] min-h-[700px] overflow-hidden bg-transparent">
      <motion.div style={{ scale, y }} className="absolute inset-0 h-full w-full">
        <Image
          src="/assets/empty_centre.jpg"
          alt="Featured Drop"
          fill
          className="object-cover opacity-50 mix-blend-luminosity"
        />
        {/* Deep luxury gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#9D4EDD]/10 via-black/60 to-black/90 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#16111b] via-transparent to-[#16111b]" />
      </motion.div>

      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="text-center px-4 max-w-5xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="font-mono text-[10px] md:text-xs tracking-[0.4em] text-[var(--sp-accent)] mb-8 block uppercase">Signature Drop 001</span>
            <h2 className="font-display text-6xl md:text-[10vw] leading-[0.85] uppercase tracking-widest text-white mb-12 drop-shadow-2xl">
              The Genesis <br /> Tee
            </h2>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.4 }}
          >
            <button data-cursor="button" className="group relative overflow-hidden rounded-full border border-white bg-white text-black px-12 py-5 font-mono text-xs tracking-[0.2em] transition-all hover:bg-transparent hover:text-white uppercase">
              <span className="relative z-10">Acquire Now</span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

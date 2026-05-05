"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

type ProductStoryProps = {
  headline: string;
  sublines: string[];
};

export default function ProductStory({ headline, sublines }: ProductStoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0.2, 0.4, 0.6, 0.8], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.2, 0.4, 0.6, 0.8], [100, 0, 0, -100]);

  return (
    <section 
      ref={containerRef} 
      className="relative h-[250vh] w-full"
    >
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden px-6 text-center md:px-12">
        <motion.div style={{ opacity, y }} className="max-w-6xl">
          <h2 className="mb-12 font-display text-6xl uppercase leading-[0.8] tracking-tight text-white md:text-8xl lg:text-[12rem]">
            {headline}
          </h2>
          <div className="mx-auto flex max-w-2xl flex-col gap-6">
            {sublines.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ duration: 1, delay: i * 0.2 + 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="font-mono text-sm uppercase leading-relaxed tracking-[0.2em] text-white/60 md:text-base"
              >
                {line}
              </motion.p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

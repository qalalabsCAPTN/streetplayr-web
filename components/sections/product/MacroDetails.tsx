"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

type MacroImage = {
  src: string;
  label: string;
};

export default function MacroDetails({ images }: { images: MacroImage[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-100, 100]);

  return (
    <section ref={containerRef} className="py-32 px-6 md:px-12 lg:px-24 bg-black overflow-hidden">
      <div className="mb-24 flex flex-col gap-4">
        <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--sp-accent)]">
          Material Intelligence
        </h3>
        <h2 className="font-display text-4xl uppercase leading-none tracking-wide text-white md:text-6xl max-w-2xl">
          Obsessive Details. Uncompromising Quality.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 lg:gap-32">
        {images.map((img, i) => {
          const isOdd = i % 2 !== 0;
          const motionY = isOdd ? y2 : y1;

          return (
            <motion.div
              key={i}
              style={{ y: motionY }}
              className={`relative flex flex-col gap-4 ${isOdd ? "md:mt-32" : ""}`}
            >
              <div className="relative overflow-hidden bg-[#0a0a0a] aspect-[4/5] w-full">
                <Image
                  src={img.src}
                  alt={img.label}
                  fill
                  className="object-cover transition-transform duration-1000 hover:scale-105"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/50 text-right">
                [ {img.label} ]
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

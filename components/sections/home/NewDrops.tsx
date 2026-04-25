"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
// Removed lucide-react import

const products = [
  {
    id: 1,
    name: "Oversized Graphic Tee",
    price: "$45",
    image: "/assets/hero-tees.png",
    category: "Tops",
  },
  {
    id: 2,
    name: "Performance Shorts",
    price: "$55",
    image: "/assets/run-shorts.jpeg",
    category: "Bottoms",
  },
  {
    id: 3,
    name: "Essential Polo",
    price: "$60",
    image: "/assets/polo-editorial.png",
    category: "Tops",
  },
];

export default function NewDrops() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section ref={containerRef} className="w-full bg-[#050505] py-24 px-4 md:px-8 lg:px-16 border-t border-white/5">
      <div className="flex justify-between items-end mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="font-display text-4xl uppercase tracking-widest text-white md:text-5xl"
        >
          Latest <br/><span className="text-[#d4ff1e]">Drops</span>
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <button data-cursor="button" className="group flex items-center gap-3 font-mono text-sm tracking-widest hover:text-[#d4ff1e] transition-colors">
            SHOP NEW
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 group-hover:border-[#d4ff1e]/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </span>
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: index * 0.2 }}
            className="group flex flex-col cursor-none"
            data-cursor="product"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#111] rounded-sm">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20" />
            </div>
            <div className="mt-5 flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-mono text-xs text-white/50 tracking-wider mb-1 uppercase">{product.category}</span>
                <h4 className="font-body text-lg font-medium tracking-wide">{product.name}</h4>
              </div>
              <span className="font-mono text-sm tracking-wider">{product.price}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

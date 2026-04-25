"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

const products = [
  {
    id: 1,
    name: "Oversized Graphic Tee",
    price: "$45",
    image: "/assets/hero-tees.png",
    category: "Tops",
    className: "md:col-span-5 md:mt-24", // Large left card, pushed down
  },
  {
    id: 2,
    name: "Performance Shorts",
    price: "$55",
    image: "/assets/run-shorts.jpeg",
    category: "Bottoms",
    className: "md:col-span-3", // Small middle card, top aligned
  },
  {
    id: 3,
    name: "Essential Polo",
    price: "$60",
    image: "/assets/polo-editorial.png",
    category: "Tops",
    className: "md:col-span-4 md:mt-48", // Medium right card, pushed furthest down
  },
];

export default function NewDrops() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section ref={containerRef} className="w-full bg-[#050505] py-32 px-4 md:px-8 lg:px-16 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-8">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-5xl uppercase tracking-widest text-white md:text-7xl leading-[0.9]"
          >
            Latest <br/>
            <span className="text-[#d4ff1e] italic pr-4">Arrivals</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <button data-cursor="button" className="group flex items-center gap-4 font-mono text-xs tracking-[0.2em] uppercase border-b border-white/20 pb-2 hover:border-[#d4ff1e] hover:text-[#d4ff1e] transition-colors">
              VIEW THE FULL DROP
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transform transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 80 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.2, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={`group flex flex-col cursor-none ${product.className}`}
              data-cursor="product"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#111] rounded-none transition-all duration-700 ease-out group-hover:rounded-2xl">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-black/10 transition-colors duration-700 group-hover:bg-transparent" />
              </div>
              <div className="mt-6 flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-white/40 tracking-[0.2em] mb-2 uppercase">{product.category}</span>
                  <h4 className="font-body text-lg font-light tracking-wide text-white/90">{product.name}</h4>
                </div>
                <span className="font-mono text-sm tracking-wider text-white/70">{product.price}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

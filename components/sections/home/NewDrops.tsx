"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, formatProductTitle } from "@/lib/utils/format";

interface Product {
  id: string | number;
  name: string;
  price: string | number;
  image: string;
  category: string;
  className?: string;
  slug?: string;
}

interface NewDropsProps {
  products: Product[];
}

export default function NewDrops({ products }: NewDropsProps) {
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
            <Link href="/collections" data-cursor="button" className="group flex items-center gap-4 font-mono text-xs tracking-[0.2em] uppercase border-b border-white/20 pb-2 hover:border-[#d4ff1e] hover:text-[#d4ff1e] transition-colors relative">
              VIEW THE FULL DROP
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="16" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform transition-transform group-hover:translate-x-2 text-[#d4ff1e]">
                <path d="M5,15 Q30,10 85,15" strokeDasharray="3 2" />
                <path d="M75,5 Q90,15 85,15" />
                <path d="M75,25 Q90,15 85,15" />
              </svg>
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
           {products.map((product, index) => {
            const href = product.slug ? `/product/${product.slug}` : "/collections";
            return (
              <Link key={product.id} href={href} className="block cursor-none">
                <motion.div
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
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-black/10 transition-colors duration-700 group-hover:bg-transparent" />
                  </div>
                  <div className="mt-6 flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] text-white/40 tracking-[0.2em] mb-2 uppercase">{product.category}</span>
                      <h4 className="font-body text-lg font-light tracking-wide text-white/90">{formatProductTitle(product.name)}</h4>
                    </div>
                    <span className="font-mono text-sm tracking-wider text-white/70">{formatPrice(Number(product.price))}</span>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

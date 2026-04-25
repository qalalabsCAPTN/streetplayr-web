"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { Instagram } from "lucide-react";

const instagramPosts = [
  { id: 1, image: "/assets/polo-editorial.png" },
  { id: 2, image: "/assets/run-shorts.jpeg" },
  { id: 3, image: "/assets/srh-jersey.jpg" },
  { id: 4, image: "/assets/hero-tees.png" },
];

export default function SocialProof() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section ref={containerRef} className="w-full bg-black py-32 px-4 md:px-8 lg:px-16">
      <div className="flex flex-col items-center mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <Instagram className="w-6 h-6 text-[#d4ff1e]" />
          <span className="font-mono text-sm tracking-widest uppercase">Join The Community</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-4xl md:text-6xl uppercase tracking-widest text-white"
        >
          @STREETPLAYR
        </motion.h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {instagramPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            className="group relative aspect-square overflow-hidden bg-[#111] cursor-none"
            data-cursor="product"
          >
            <Image
              src={post.image}
              alt="Community Post"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Instagram className="w-8 h-8 text-white" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

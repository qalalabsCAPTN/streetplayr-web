"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

const instagramPosts = [
  { id: 1, image: "/assets/polo-editorial.png", className: "mt-12 md:mt-24" },
  { id: 2, image: "/assets/run-shorts.jpeg", className: "" },
  { id: 3, image: "/assets/srh-jersey.jpg", className: "mt-8 md:mt-16" },
  { id: 4, image: "/assets/hero-tees.png", className: "-mt-4 md:-mt-8" },
];

export default function SocialProof() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  return (
    <section ref={containerRef} className="w-full bg-transparent py-32 px-4 md:px-8 lg:px-12 overflow-hidden border-t border-white/10">
      <div className="flex flex-col items-center mb-32 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center gap-4 mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[var(--sp-accent)]"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
          <span className="font-mono text-xs md:text-sm tracking-[0.3em] uppercase text-white/70">The Community</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-5xl md:text-8xl uppercase tracking-widest text-white leading-[0.9]"
        >
          STREETPLAYR <br />
          <span className="text-white/30 italic">SOCIETY</span>
        </motion.h2>
      </div>

      <div className="max-w-[min(98vw,2560px)] mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {instagramPosts.map((post, index) => (
            <motion.div
              key={post.id}
              style={{ y: index % 2 === 0 ? y1 : y2 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.3 + index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative aspect-[3/4] overflow-hidden bg-[#111] cursor-none rounded-xl ${post.className}`}
              data-cursor="product"
            >
              <Image
                src={post.image}
                alt="Community Post"
                fill
                className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-110 opacity-70 group-hover:opacity-100 mix-blend-luminosity group-hover:mix-blend-normal"
              />
              {/* Masked curtain effect */}
              <div className="absolute inset-0 bg-black translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-40 mix-blend-multiply" />

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

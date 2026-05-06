"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

export default function LookbookSilenceMoment() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-5% 0px" });

  return (
    <section
      className="relative w-full bg-[#050505] overflow-hidden"
      aria-label="Visual silence moment"
    >
      {/* Generous breathing room — top */}
      <div className="h-28 sm:h-44 lg:h-60" />

      {/* Single centered image — alone */}
      <div className="flex justify-center px-6 sm:px-16 lg:px-0">
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 3, ease: "easeOut" }}
          className="relative w-full max-w-[680px] overflow-hidden"
          style={{ aspectRatio: "3/4" }}
        >
          <Image
            src="/assets/polo-editorial.png"
            alt="Street PlayR — Editorial Silence"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 680px"
          />
          {/* Vignette */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
            }}
          />
          {/* Film grain */}
          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              opacity: 0.06,
              mixBlendMode: "overlay",
            }}
          />
          {/* Ghost caption — bottom right */}
          <div className="absolute bottom-5 right-5 z-30">
            <motion.span
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 2, delay: 1.4, ease: "easeOut" }}
              className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/22"
            >
              SP — 2025
            </motion.span>
          </div>
        </motion.div>
      </div>

      {/* Generous breathing room — bottom */}
      <div className="h-36 sm:h-52 lg:h-72" />
    </section>
  );
}

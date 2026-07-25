"use client";

import { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { useWindowWidth } from "@/hooks/useWindowWidth";

const copyVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.22,
    },
  },
};

const lineVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Hero() {
  const windowWidth = useWindowWidth();

  const isMobile = windowWidth !== null && windowWidth < 768;
  const isTablet = windowWidth !== null && windowWidth >= 768 && windowWidth < 1024;
  const duration = isTablet ? 12 : 8;

  return (
    <section className="relative isolate flex min-h-[100dvh] overflow-hidden bg-black">
      <Image
        alt="Street PlayR training tees lookbook"
        className="absolute inset-0 -z-20 h-full w-full scale-110 object-cover object-[62%_center] opacity-72"
        fill
        priority
        sizes="100vw"
        src="/assets/empty_centre.jpg"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.20)_72%,rgba(0,0,0,0.74)_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-1/3 bg-gradient-to-b from-black via-black/80 to-transparent" />
      
      {/* Optimized GPU translation sweep background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {!isMobile && (
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            className="hero-sweep absolute top-0 left-0 h-full w-[200%] opacity-25"
            transition={{ duration, ease: "linear", repeat: Infinity }}
          />
        )}
      </div>
      <div className="grid-floor absolute inset-x-0 bottom-0 -z-10 h-1/2 opacity-70" />

      <div className="mx-auto flex w-full max-w-7xl items-end px-4 pb-[88px] pt-28 sm:px-6 md:pb-[104px] lg:px-16">
        <motion.div
          animate="visible"
          className="max-w-4xl"
          initial="hidden"
          variants={copyVariants}
        >
          {/* metadata/subtext removed */}
          <motion.h1
            className="mt-4 max-w-4xl text-balance font-display text-[clamp(4.75rem,15vw,10.5rem)] leading-[0.82] tracking-[0.08em]"
            variants={lineVariants}
          >
            WEAR THE STREET.
          </motion.h1>
          <motion.p
            className="mt-6 max-w-xl text-base leading-7 text-white/68 sm:text-lg"
            variants={lineVariants}
          >
            Dark editorial essentials, limited drops, and PlayR points that make
            every fit feel sharper.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap items-center gap-4"
            variants={lineVariants}
          >
            <Button href="/collections">Shop Now</Button>
            <Button href="#latest-drop" variant="secondary">
              See The Drop
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-6 right-4 hidden items-center gap-3 text-white/44 sm:right-6 md:flex lg:right-16">
        <span className="h-14 w-px overflow-hidden bg-white/20">
          <motion.span
            animate={{ y: ["-100%", "100%"] }}
            className="block h-1/2 w-full bg-white/70"
            transition={{ duration: 1.35, ease: "easeInOut", repeat: Infinity }}
          />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
          Scroll
        </span>
      </div>
    </section>
  );
}

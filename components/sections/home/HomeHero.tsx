"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function HomeHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  const titleText = "REDEFINE".split("");
  const subtitleText = "THE PLAY".split("");

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-[#050505]"
    >
      <motion.div
        style={{ y, opacity, scale }}
        className="absolute inset-0 h-full w-full"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover opacity-80"
        >
          <source src="/assets/videos/WebAnimation_V1.mp4" type="video/mp4" />
        </video>
        {/* Luxury deep radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/90 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
      </motion.div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 md:px-8 text-center mt-12">
        <div className="flex flex-col items-center gap-2 mb-4 overflow-hidden">
          <motion.span 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="font-mono text-xs md:text-sm tracking-[0.3em] text-[var(--sp-accent)] uppercase"
          >
            Spring / Summer Collection
          </motion.span>
        </div>

        <h1 className="font-display flex flex-col items-center text-[15vw] md:text-[12vw] uppercase tracking-widest leading-[0.8] text-white">
          <div className="flex overflow-hidden pb-4">
            {titleText.map((char, index) => (
              <motion.span
                key={`t-${index}`}
                initial={{ y: "100%", opacity: 0, rotateZ: 5 }}
                animate={{ y: 0, opacity: 1, rotateZ: 0 }}
                transition={{
                  duration: 1.2,
                  delay: 0.4 + index * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </div>
          <div className="flex overflow-hidden relative text-white/50">
            {/* Subtle hand-drawn premium accent */}
            <motion.svg 
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ duration: 1.5, delay: 1.8, ease: "easeInOut" }}
              className="absolute -inset-x-8 -inset-y-4 w-[calc(100%+4rem)] h-[calc(100%+2rem)] pointer-events-none z-0 text-[var(--sp-accent)]"
              viewBox="0 0 400 100" 
              fill="none" 
              preserveAspectRatio="none"
            >
              <motion.path 
                d="M 20 50 C 50 10, 350 10, 380 50 C 390 80, 350 95, 200 90 C 50 85, 10 70, 30 40" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                className="mix-blend-screen"
              />
            </motion.svg>
            
            <div className="flex relative z-10">
              {subtitleText.map((char, index) => (
                <motion.span
                  key={`s-${index}`}
                  initial={{ y: "100%", opacity: 0, rotateZ: -5 }}
                  animate={{ y: 0, opacity: 1, rotateZ: 0 }}
                  transition={{
                    duration: 1.2,
                    delay: 0.6 + index * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="inline-block"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </div>
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.5, delay: 1, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-1/2 left-0 right-0 h-[2px] bg-white origin-left"
            />
          </div>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="mt-16"
        >
          <button
            data-cursor="button"
            className="group relative overflow-hidden rounded-full border border-white/30 bg-transparent px-10 py-5 font-mono text-xs md:text-sm tracking-[0.2em] text-white backdrop-blur-sm transition-all hover:border-[var(--sp-accent)] hover:text-[var(--sp-accent)]"
          >
            <span className="relative z-10 flex items-center gap-4">
              DISCOVER MORE
              <span className="h-[1px] w-8 bg-current transition-all group-hover:w-12" />
            </span>
            <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

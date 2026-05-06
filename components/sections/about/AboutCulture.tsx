"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

const pillars = [
  {
    num: "01",
    word: "REBELLION",
    body: "We reject the consensus. Not as a gesture — as a discipline. Every silhouette we build begins by discarding what is expected.",
  },
  {
    num: "02",
    word: "RESTRAINT",
    body: "Luxury is not decoration. It is the deliberate removal of everything unnecessary. What remains is the truth of a garment.",
  },
  {
    num: "03",
    word: "PRESENCE",
    body: "You do not announce StreetPlayR. You are recognised by those who already exist in that frequency.",
  },
];

function PillarItem({
  num,
  word,
  body,
  index,
}: {
  num: string;
  word: string;
  body: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 1.4,
        delay: index * 0.15,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative border-t border-white/8 pt-8 pb-10"
    >
      {/* Hover accent line */}
      <motion.div
        className="absolute top-0 left-0 h-px bg-white/35"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 0 }}
        style={{ originX: 0, scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Number */}
        <div className="col-span-2 sm:col-span-1">
          <span className="font-mono text-[10px] tracking-[0.2em] text-white/20">
            {num}
          </span>
        </div>

        {/* Title + body */}
        <div className="col-span-10 sm:col-span-11">
          <h3 className="font-display text-[8vw] sm:text-[4.5vw] lg:text-[3.2vw] uppercase leading-none tracking-tight text-white group-hover:text-white/85 transition-colors duration-700">
            {word}
          </h3>
          <p className="mt-5 max-w-lg font-body text-sm leading-8 text-white/35 sm:text-white/28 group-hover:text-white/40 transition-colors duration-700">
            {body}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function AboutCulture() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const lineWidth = useTransform(scrollYProgress, [0.1, 0.5], ["0%", "100%"]);
  const bgParallax = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);

  const headRef = useRef<HTMLDivElement>(null);
  const headInView = useInView(headRef, { once: true });

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#0a0a0a] overflow-hidden py-28 sm:py-40 lg:py-56"
      aria-label="Cultural positioning"
    >
      {/* Atmospheric bg element */}
      <motion.div
        style={{ y: bgParallax }}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div
          className="absolute bottom-0 right-0 w-[55%] h-[70%]"
          style={{
            background:
              "radial-gradient(ellipse at bottom right, rgba(255,255,255,0.025) 0%, transparent 65%)",
          }}
        />
      </motion.div>

      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.045,
          mixBlendMode: "overlay",
        }}
      />

      <div className="relative z-20 mx-auto max-w-7xl px-6 sm:px-10 lg:px-20">
        {/* Section header */}
        <div ref={headRef}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={headInView ? { opacity: 1 } : {}}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex items-center gap-4 mb-16 sm:mb-20"
          >
            <span className="h-px w-6 bg-white/20 block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
              The Philosophy
            </span>
          </motion.div>

          {/* Big heading — two-line collision */}
          <div className="mb-6">
            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "105%" }}
                animate={headInView ? { y: 0 } : {}}
                transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[13vw] sm:text-[9vw] lg:text-[7vw] uppercase leading-[0.88] tracking-tight text-white"
              >
                Controlled
              </motion.h2>
            </div>
            <div className="overflow-hidden pl-8 sm:pl-20 lg:pl-28">
              <motion.h2
                initial={{ y: "105%" }}
                animate={headInView ? { y: 0 } : {}}
                transition={{ duration: 1.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[13vw] sm:text-[9vw] lg:text-[7vw] uppercase leading-[0.88] tracking-tight text-white/18"
              >
                Chaos
              </motion.h2>
            </div>
          </div>

          {/* Animated rule */}
          <div className="h-px bg-white/6 overflow-hidden mb-16 sm:mb-20">
            <motion.div
              style={{ width: lineWidth }}
              className="h-full bg-white/20"
            />
          </div>
        </div>

        {/* Pillars */}
        <div>
          {pillars.map((p, i) => (
            <PillarItem
              key={p.num}
              num={p.num}
              word={p.word}
              body={p.body}
              index={i}
            />
          ))}
        </div>

        {/* Closing visual silence */}
        <ClosingStatement />
      </div>
    </section>
  );
}

function ClosingStatement() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-12%" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 2, delay: 0.2, ease: "easeOut" }}
      className="mt-28 sm:mt-36 text-center"
    >
      <p className="font-display text-[5vw] sm:text-[3.5vw] lg:text-[2.8vw] uppercase tracking-[0.06em] text-white/10">
        Move before the culture.
      </p>
      <p className="mt-3 font-display text-[5vw] sm:text-[3.5vw] lg:text-[2.8vw] uppercase tracking-[0.06em] text-white/05">
        Or do not move at all.
      </p>
    </motion.div>
  );
}

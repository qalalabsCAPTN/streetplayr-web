"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const CHAPTERS = [
  {
    era: "2021",
    title: "Origins",
    description:
      "Born from the underground. A collective of designers, engineers, and artists who saw fashion as infrastructure — not decoration. The first sketches were drawn on construction blueprints.",
  },
  {
    era: "2023",
    title: "The First Drop",
    description:
      "A single silhouette. Zero marketing. One-hundred units. Gone in forty seconds. The signal was sent — and the right people received it.",
  },
  {
    era: "2024",
    title: "Ecosystem",
    description:
      "Expansion into a full ecosystem — drops, NECTAR membership, the SP-RR wallet, and a community that grew through scarcity and intent, not advertising.",
  },
  {
    era: "2025+",
    title: "Future",
    description:
      "The next chapter is not about scale. It is about depth — deeper materials research, deeper community infrastructure, deeper commitment to the craft. Still becoming.",
  },
];

export default function Journey() {
  return (
    <section className="relative py-36 sm:py-48 px-6 sm:px-12 lg:px-20 max-w-[1440px] mx-auto border-t border-white/[0.04]">
      <FadeIn>
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px w-6 bg-white/20 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">The Journey</span>
        </div>
      </FadeIn>
      <FadeIn delay={0.15}>
        <h2 className="font-display text-[clamp(40px,6vw,96px)] leading-[0.88] tracking-[0.01em] uppercase text-[#eadfed] mb-24 max-w-[12ch]">
          From the underground to the infrastructure.
        </h2>
      </FadeIn>

      <div className="relative">
        {/* Vertical center line */}
        <div className="absolute left-[23px] md:left-1/2 md:-translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-[#ddb7ff]/20 via-white/[0.06] to-transparent hidden md:block" />
        <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-[#ddb7ff]/20 via-white/[0.06] to-transparent md:hidden" />

        <div className="space-y-32 md:space-y-40">
          {CHAPTERS.map((chapter, i) => {
            const isLeft = i % 2 === 0;
            return (
              <div
                key={chapter.era}
                className={`relative flex flex-col ${
                  isLeft ? "md:flex-row" : "md:flex-row-reverse"
                } items-start gap-8 md:gap-0`}
              >
                {/* Content */}
                <FadeIn
                  delay={0.15 * i}
                  className={`w-full md:w-[calc(50%-40px)] pl-16 md:pl-0 ${
                    isLeft ? "md:pr-16 md:text-right" : "md:pl-16"
                  }`}
                >
                  <span className="font-mono text-[10px] tracking-[0.3em] text-[#ddb7ff]/60 block mb-3">
                    {chapter.era}
                  </span>
                  <h3 className="font-display text-[32px] sm:text-[40px] md:text-[48px] uppercase text-[#eadfed] leading-[0.95] tracking-[0.01em]">
                    {chapter.title}
                  </h3>
                  <p
                    className={`font-body text-[13px] leading-[1.9] text-white/35 mt-5 max-w-[400px] tracking-wide ${
                      isLeft ? "md:ml-auto" : ""
                    }`}
                  >
                    {chapter.description}
                  </p>
                </FadeIn>

                {/* Marker */}
                <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-1 z-10 flex flex-col items-center">
                  <div className="w-[18px] h-[18px] md:w-[22px] md:h-[22px] rounded-full border-2 border-[#ddb7ff]/50 bg-[#16111b]" />
                  <div className="w-px h-8 bg-[#ddb7ff]/20 hidden md:block" />
                </div>

                {/* Spacer */}
                <div className="hidden md:block w-[calc(50%-40px)]" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

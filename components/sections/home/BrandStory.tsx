"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-8% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function BrandStory() {
  return (
    <section className="relative py-28 sm:py-36 px-6 sm:px-12 lg:px-20 max-w-[1440px] mx-auto border-t border-white/[0.04]">
      <FadeIn>
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px w-6 bg-white/20 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">The Vision</span>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Editorial media panel */}
        <FadeIn delay={0.1} className="lg:col-span-7 relative overflow-hidden border border-white/[0.06] bg-[#0a0a0a]">
          <div className="aspect-[4/3] relative">
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse 70% 60% at 30% 40%, rgba(221,183,255,0.04) 0%, transparent 65%),
                  radial-gradient(ellipse 50% 70% at 70% 30%, rgba(255,255,255,0.03) 0%, transparent 60%),
                  linear-gradient(150deg, #0a0a0a 0%, #060606 50%, #040404 100%)
                `,
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                opacity: 0.06,
                mixBlendMode: "overlay",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
              }}
            />
            <div className="absolute inset-0 pointer-events-none border border-white/[0.04]" />
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]" />
            
          </div>
        </FadeIn>

        {/* Manifesto copy */}
        <div className="lg:col-span-5 flex flex-col justify-center gap-6">
          <FadeIn delay={0.15}>
            <h2 className="font-display text-[clamp(28px,4vw,56px)] uppercase leading-[0.92] text-[#eadfed]">
              Create The Things
              <br />
              <span className="text-[#ddb7ff]">You Wish Existed</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="space-y-4 font-body text-sm leading-7 text-white/45 max-w-md">
              <p>
                StreetPlayR was built from a single principle: if it doesn&rsquo;t exist, build it.
                Every drop is a response to what the streets demanded but never received.
              </p>
              <p>
                We don&rsquo;t follow trends. We archive them. Deconstruct them. Then release
                them back as limited-edition artifacts engineered for the city after dark.
              </p>
            </div>
          </FadeIn>
          
        </div>
      </div>
    </section>
  );
}

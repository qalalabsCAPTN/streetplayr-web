"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

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

interface BrandStoryBlock {
  title: string;
  description: string;
  image_url?: string;
}

interface BrandStoryProps {
  heading?: string;
  subheading?: string;
  blocks?: BrandStoryBlock[];
  ctaLabel?: string;
  ctaHref?: string;
  videoUrl?: string;
}

export default function BrandStory({
  heading,
  subheading = "The Vision",
  blocks,
  ctaLabel = "Explore The Archive",
  ctaHref = "/collections",
  videoUrl = "/assets/videos/WebAnimation_V1.mp4",
}: BrandStoryProps = {}) {
  // Render default blocks if none provided
  const hasBlocks = blocks && blocks.length > 0;

  return (
    <section className="relative py-20 sm:py-24 px-4 md:px-8 lg:px-12 w-full max-w-[min(98vw,2560px)] mx-auto border-t border-white/[0.04]">
      <FadeIn>
        <div className="flex items-center gap-3 mb-6">
          <span className="h-px w-6 bg-white/20 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">{subheading}</span>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Text — left on desktop, above on mobile */}
        <div className="lg:col-span-5 flex flex-col justify-center text-center lg:text-left">
          <FadeIn delay={0.15}>
            {heading ? (
              <h2 className="font-display text-[clamp(28px,4vw,56px)] uppercase leading-[0.92] text-[#eadfed] whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: heading }}
              />
            ) : (
              <h2 className="font-display text-[clamp(28px,4vw,56px)] uppercase leading-[0.92] text-[#eadfed]">
                Create The Things
                <br />
                <span className="text-[#ddb7ff]">You Wish Existed</span>
              </h2>
            )}
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="space-y-4 font-body text-sm leading-7 text-white/45 max-w-md mx-auto lg:mx-0 mt-6">
              {hasBlocks ? (
                blocks.map((b, i) => (
                  <div key={i} className="mb-4 text-left">
                    <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-1">{b.title}</h4>
                    <p className="text-white/45">{b.description}</p>
                  </div>
                ))
              ) : (
                <>
                  <p>
                    StreetPlayR was built from a single principle: if it doesn&rsquo;t exist, build it.
                    Every drop is a response to what the streets demanded but never received.
                  </p>
                  <p>
                    We don&rsquo;t follow trends. We archive them. Deconstruct them. Then release
                    them back as limited-edition artifacts engineered for the city after dark.
                  </p>
                </>
              )}
            </div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 hover:text-white transition-colors duration-300 mx-auto lg:mx-0"
            >
              <span>{ctaLabel}</span>
              <span className="text-[11px]">→</span>
            </Link>
          </FadeIn>
        </div>

        {/* Editorial media panel — right on desktop */}
        <FadeIn delay={0.1} className="lg:col-span-7 relative overflow-hidden border border-white/[0.06] bg-[#0a0a0a] rounded-xl">
          <div className="aspect-[4/3] relative">
            {hasBlocks && blocks[0]?.image_url ? (
              <img
                src={blocks[0].image_url}
                alt={blocks[0].title || "Brand Story"}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={videoUrl} type="video/mp4" />
              </video>
            )}
            <div className="absolute inset-0 pointer-events-none border border-white/[0.04]" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

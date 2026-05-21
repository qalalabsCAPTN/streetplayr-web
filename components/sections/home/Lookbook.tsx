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

const lookbookItems = [
  {
    id: "vid-1",
    type: "video" as const,
    src: "/assets/lookbook-01.mp4",
    label: "FW26 / Urban Uniform",
  },
  {
    id: "yt-1",
    type: "youtube" as const,
    src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    label: "FW26 / Street Protocol",
  },
  {
    id: "img-1",
    type: "placeholder" as const,
    src: "",
    label: "FW26 / Night Runner",
  },
  {
    id: "img-2",
    type: "placeholder" as const,
    src: "",
    label: "FW26 / Core Edit",
  },
];

export default function Lookbook() {
  return (
    <section className="relative py-28 sm:py-36 overflow-hidden border-t border-white/[0.04]">
      <div className="px-6 sm:px-12 lg:px-20 max-w-[1440px] mx-auto mb-10">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-6 bg-white/20 block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">Lookbook</span>
          </div>
          <h2 className="font-display text-[clamp(32px,4.5vw,64px)] uppercase leading-[0.92] text-[#eadfed]">
            FW26 Editorial
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ffb59e] mt-2 relative pl-4 before:content-['['] before:absolute before:left-0 before:opacity-50 after:content-[']'] after:ml-1 after:opacity-50">
            Visual Index // Motion Studies
          </p>
        </FadeIn>
      </div>

      <div className="flex gap-5 px-6 sm:px-12 lg:px-20 max-w-[1440px] mx-auto overflow-x-auto pb-6 no-scrollbar">
        {lookbookItems.map((item, i) => (
          <FadeIn key={item.id} delay={0.1 * i} className="min-w-[320px] md:min-w-[480px] shrink-0">
            <div className="group bg-[#1f1a23] border border-white/[0.06] hover:border-[#ddb7ff]/20 transition-colors overflow-hidden">
              <div className="aspect-[4/5] relative overflow-hidden bg-[#0a0a0a]">
                {/* Rich editorial background */}
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

                {/* Video content */}
                {item.type === "video" && (
                  <video
                    className="absolute inset-0 w-full h-full object-cover"
                    src={item.src}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                )}
                {item.type === "youtube" && (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={item.src}
                    allow="accelerometer; gyroscope"
                    allowFullScreen
                  />
                )}
                {item.type === "placeholder" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/15">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#ddb7ff]/5 opacity-0 group-hover:opacity-100 transition-opacity z-30" />
              </div>
              <div className="p-5 border-t border-white/[0.05]">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ddb7ff]/70">
                  {item.label}
                </span>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

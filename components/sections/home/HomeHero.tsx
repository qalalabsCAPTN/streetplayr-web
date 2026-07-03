"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, type Variants } from "framer-motion";

const NinjaStar = dynamic(() => import("@/components/ui/NinjaStar"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-transparent" />,
});

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

interface HomeHeroProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  bgImageUrl?: string;
  bgVideoUrl?: string;
  overlayOpacity?: number;
}

export default function HomeHero({
  title = "Dress for\npressure.",
  subtitle,
  ctaLabel = "Enter the Drop",
  ctaHref = "/collection",
  bgImageUrl,
  bgVideoUrl = "/assets/home-page-banner.mp4",
  overlayOpacity = 0.4,
}: HomeHeroProps = {}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [particles, setParticles] = useState<Array<{ left: number; delay: number; dur: number; size: number }>>([]);

  useEffect(() => {
    const initParticles = () => {
      setParticles(
        Array.from({ length: 28 }, () => ({
          left: Math.random() * 100,
          delay: Math.random() * 5,
          dur: 4 + Math.random() * 6,
          size: 1 + Math.random() * 2,
        })),
      );
    };
    const frame = requestAnimationFrame(initParticles);
    return () => cancelAnimationFrame(frame);
  }, []);

  const [windowWidth, setWindowWidth] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    const frame = requestAnimationFrame(handleResize);
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getStarScale = () => {
    if (windowWidth === null) return 0.95;
    if (windowWidth < 768) return 0.65;
    if (windowWidth < 1024) return 0.85;
    return 0.95;
  };
  const starScale = getStarScale();

  const getPopupStarScale = () => {
    if (windowWidth === null) return 1.45;
    if (windowWidth < 768) return 1.05;
    if (windowWidth < 1024) return 1.25;
    return 1.45;
  };
  const popupStarScale = getPopupStarScale();

  useEffect(() => {
    const timer = setTimeout(() => setJoinOpen(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    el.play().catch(() => {
      timer = setTimeout(() => el.play(), 300);
    });
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (joinOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [joinOpen]);

  const scrollToNext = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  const isMobile = windowWidth !== null && windowWidth < 768;
  const isTablet = windowWidth !== null && windowWidth >= 768 && windowWidth < 1024;

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-end overflow-hidden bg-transparent">
      {/* CSS-driven backdrop stages matching /enter-the-play page */}
      <div className="absolute inset-0 z-[-3] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-transparent" />
        <div className={`home-bg-grid ${isMobile ? "mobile-static" : ""}`} />
        <div className="home-bg-blob-purple" />
        <div className="home-bg-blob-green" />
        {!isMobile && (
          <>
            <div className={`home-bg-scanline ${isTablet ? "tablet-scan" : ""}`} />
            <div className={`home-bg-scanline ${isTablet ? "tablet-scan" : ""}`} style={{ animationDelay: "2.4s" }} />
          </>
        )}
      </div>

      {/* Floating Particles Backdrop */}
      {!isMobile && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-2]">
          {particles.map((p, i) => (
            <span
              key={i}
              className="home-particle"
              style={{
                left: `${p.left}%`,
                bottom: "-10px",
                width: `${p.size}px`,
                height: `${p.size}px`,
                "--dur": `${p.dur}s`,
                "--delay": `${p.delay}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Interactive 3D Star Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
        <div 
          className="pointer-events-auto flex items-center justify-center w-60 h-60 md:w-[320px] md:h-[320px] lg:w-[420px] lg:h-[420px]"
        >
          <NinjaStar scale={starScale} />
        </div>
      </div>

      {/* Image Background */}
      {bgImageUrl && (
        <img
          className="absolute inset-0 w-full h-full object-cover z-[-3]"
          src={bgImageUrl}
          alt={title}
        />
      )}

      {/* Dynamic Overlay Dark Tint if Image background is present */}
      {bgImageUrl && (
        <div
          className="absolute inset-0 bg-black z-[-2] pointer-events-none"
          style={{ opacity: overlayOpacity }}
        />
      )}

      <div className="absolute inset-0 z-[-2] pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 55% at 18% 24%, rgba(221,183,255,0.18), transparent 64%), radial-gradient(46% 48% at 82% 78%, rgba(255,87,26,0.12), transparent 65%), linear-gradient(180deg, rgba(22,17,27,0.50) 0%, rgba(22,17,27,0.22) 38%, rgba(22,17,27,0.92) 100%)"
        }}
      />
      <div className="absolute inset-0 z-[-2] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(12,6,18,0.72) 100%)"
        }}
      />
      <div
        className="absolute inset-0 z-[-2] pointer-events-none opacity-45"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "256px",
          mixBlendMode: "overlay",
        }}
      />

      {/* Hero Content with staggered reveals */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-[2] flex flex-col items-start gap-4 px-[6vw] pb-16 max-w-[880px] pointer-events-none"
      >
        <motion.h1
          variants={itemVariants}
          className="font-display text-[clamp(64px,10vw,168px)] leading-[0.88] tracking-[0.01em] uppercase text-[#eadfed] m-0 max-w-[7.8ch] whitespace-pre-line pointer-events-none"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            variants={itemVariants}
            className="font-body text-base text-white/70 max-w-md mt-2 pointer-events-none"
          >
            {subtitle}
          </motion.p>
        )}
        <motion.div
          variants={itemVariants}
          className="flex gap-3 mt-4 pointer-events-auto"
        >
          <button
            className="inline-flex items-center gap-3 px-7 py-4 bg-[#eadfed] text-[#16111b] border border-[#eadfed] font-mono text-[11px] tracking-[0.24em] font-bold uppercase transition-colors hover:bg-[#ddb7ff] rounded-xl cursor-pointer"
            onClick={() => router.push(ctaHref)}
          >
            {ctaLabel}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <button
            className="inline-flex items-center gap-3 px-7 py-4 bg-[#231e27]/40 text-[#eadfed] border border-white/[0.14] font-mono text-[11px] tracking-[0.24em] font-bold uppercase transition-colors hover:bg-white/[0.06] hover:border-white/[0.24] rounded-xl cursor-pointer"
            onClick={() => setJoinOpen(true)}
          >
            Join List
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </motion.div>
      </motion.div>

      {/* Scroll Down Indicator */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-2 cursor-pointer" onClick={scrollToNext}>
        <span className="text-[10px] tracking-[0.3em] text-white/40" style={{ fontFamily: "'Space Mono', monospace" }}>SCROLL</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40 animate-bounce">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </div>

      {/* Join the Drop Modal — portal to body to escape Hero's isolate stacking context */}
      {joinOpen && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6"
          onClick={() => setJoinOpen(false)}
        >
          <div
            className="relative w-full max-w-[960px] max-h-[calc(100vh-48px)] overflow-y-auto md:overflow-hidden grid grid-cols-1 md:grid-cols-[360px_1fr] bg-[#231e27] border border-white/[0.10] shadow-[0_40px_120px_-20px_rgba(12,6,18,0.92)] animate-in fade-in zoom-in-95 duration-300 rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              className="absolute top-3.5 right-3.5 w-9 h-9 bg-black/60 border border-white/[0.14] text-white grid place-items-center z-[4] transition-colors hover:bg-white/[0.08] rounded-xl"
              onClick={() => setJoinOpen(false)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Left Panel */}
            <div
              className="relative px-5 md:px-5 py-8 md:py-10 flex flex-col items-center justify-center gap-6 md:gap-8 overflow-hidden border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.10)]"
              style={{
                  background: "linear-gradient(160deg, rgba(221,183,255,0.08), rgba(35,30,39,0.78) 62%), #1b1620",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                  maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
                }}
              />
              <div
                className="absolute w-80 h-80 rounded-full filter blur-[40px] pointer-events-none top-[-40px] right-[-60px]"
                style={{
                  background: "radial-gradient(circle, rgba(221,183,255,0.20), transparent 60%)",
                  animation: "preFloat 8s ease-in-out infinite",
                }}
              />
              <div className="relative z-[2] w-full max-w-[240px] sm:max-w-[280px] md:max-w-[320px] aspect-square flex items-center justify-center select-none pointer-events-auto">
                <NinjaStar scale={popupStarScale} scrollReactive={false} />
              </div>
              <div className="relative z-[2] flex flex-col gap-3.5">
                <h3
                  className="font-display text-[48px] md:text-[64px] leading-[1.05] tracking-[0.01em] uppercase text-white m-0 text-center"
                >
                  Join The<br />Release
                </h3>
              </div>
            </div>

            {/* Right Panel */}
            <div className="p-6 md:p-9 md:pt-8 flex flex-col gap-4">
              <h2 className="font-display text-[36px] leading-none tracking-[0.01em] uppercase text-white m-0">
                Welcome to <em className="not-italic text-[#ddb7ff]">StreetplayR</em>
              </h2>

              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => { e.preventDefault(); setJoinOpen(false); }}
              >
                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[9px] tracking-[0.32em] text-white/34 uppercase">Name</span>
                  <input className="w-full bg-[#1b1620] border border-white/[0.12] text-[#eadfed] p-3.5 font-mono text-[13px] tracking-[0.04em] outline-none transition-colors focus:border-white/[0.32] focus:bg-[#211c26] rounded-xl" placeholder="Your name" type="text" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[9px] tracking-[0.32em] text-white/34 uppercase">Email</span>
                  <input className="w-full bg-[#1b1620] border border-white/[0.12] text-[#eadfed] p-3.5 font-mono text-[13px] tracking-[0.04em] outline-none transition-colors focus:border-white/[0.32] focus:bg-[#211c26] rounded-xl" placeholder="you@streetplayr.com" type="email" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[9px] tracking-[0.32em] text-white/34 uppercase">Phone</span>
                  <input className="w-full bg-[#1b1620] border border-white/[0.12] text-[#eadfed] p-3.5 font-mono text-[13px] tracking-[0.04em] outline-none transition-colors focus:border-white/[0.32] focus:bg-[#211c26] rounded-xl" placeholder="+X XXX XXX XXXX" type="tel" />
                </label>
                <button type="submit" className="w-full bg-[#eadfed] py-4 mt-2 font-mono font-bold text-[12px] tracking-[0.22em] uppercase text-[#16111b] hover:bg-[#ddb7ff] transition-colors duration-300 group flex items-center justify-center gap-2 rounded-xl">
                  SUBMIT
                  <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
      <style>{`
        @keyframes gridDrift {
          from { background-position: 0 0; }
          to   { background-position: 64px 64px; }
        }
        @keyframes blobP {
          0%,100% { transform: translate(-12%, -18%); }
          33%     { transform: translate(12%, 4%); }
          66%     { transform: translate(-6%, 18%); }
        }
        @keyframes blobG {
          0%,100% { transform: translate(82%, 60%); }
          33%     { transform: translate(70%, 78%); }
          66%     { transform: translate(88%, 48%); }
        }
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          6% { opacity: var(--scan-opacity, 0.5); }
          94% { opacity: var(--scan-opacity, 0.5); }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes particleUp {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
        .home-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 64px 64px;
          animation: gridDrift 28s linear infinite;
          mask-image: radial-gradient(80% 80% at 50% 50%, #000 50%, transparent 100%);
          -webkit-mask-image: radial-gradient(80% 80% at 50% 50%, #000 50%, transparent 100%);
        }
        .home-bg-grid.mobile-static {
          animation: none;
        }
        .home-bg-blob-purple {
          position: absolute;
          width: 620px;
          height: 620px;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          pointer-events: none;
          background: radial-gradient(circle, rgba(221,183,255,0.10), transparent 70%);
          animation: blobP 18s ease-in-out infinite;
          top: 10%;
          left: 55%;
        }
        .home-bg-blob-green {
          position: absolute;
          width: 460px;
          height: 460px;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          pointer-events: none;
          background: radial-gradient(circle, rgba(255,181,158,0.08), transparent 70%);
          animation: blobG 22s ease-in-out infinite;
          top: 60%;
          left: 10%;
        }
        .home-bg-scanline {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #ddb7ff, transparent);
          animation: scan 7s linear infinite;
          --scan-opacity: 0.5;
        }
        .home-bg-scanline.tablet-scan {
          animation: scan 10s linear infinite;
          --scan-opacity: 0.3;
        }
        .home-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: #ddb7ff;
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(221,183,255,0.3);
          animation: particleUp var(--dur) var(--delay) linear infinite;
        }
      `}</style>
    </section>
  );
}

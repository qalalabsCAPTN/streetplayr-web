"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export default function HomeHero() {
  const router = useRouter();
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setJoinOpen(true), 6000);
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

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-end overflow-hidden bg-[#16111b] isolate">
      {/* Video Background */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-[-3]"
        src="/assets/home-page-banner.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
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

      {/* Hero Content */}
      <div className="relative z-[2] flex flex-col items-start gap-4 px-[6vw] pb-16 max-w-[880px]">
        <h1 className="font-display text-[clamp(64px,10vw,168px)] leading-[0.88] tracking-[0.01em] uppercase text-[#eadfed] m-0 max-w-[7.8ch]">
          Dress for
          <br />
          pressure.
        </h1>
        <div className="flex gap-3 mt-4">
          <button
            className="inline-flex items-center gap-3 px-7 py-4 bg-[#eadfed] text-[#16111b] border border-[#eadfed] font-mono text-[11px] tracking-[0.24em] font-bold uppercase transition-colors hover:bg-[#ddb7ff] rounded-xl"
            onClick={() => router.push("/collection")}
          >
            Enter the Drop
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <button
            className="inline-flex items-center gap-3 px-7 py-4 bg-[#231e27]/40 text-[#eadfed] border border-white/[0.14] font-mono text-[11px] tracking-[0.24em] font-bold uppercase transition-colors hover:bg-white/[0.06] hover:border-white/[0.24] rounded-xl"
            onClick={() => setJoinOpen(true)}
          >
            Join List
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 cursor-pointer" onClick={scrollToNext}>
        <span className="text-[10px] tracking-[0.3em] text-white/40" style={{ fontFamily: "'Space Mono', monospace" }}>SCROLL</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40 animate-bounce">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </div>

      {/* Join the Drop Modal — portal to body to escape Hero's isolate stacking context */}
      {joinOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-6"
          onClick={() => setJoinOpen(false)}
        >
          <div
            className="relative w-full max-w-[960px] max-h-[calc(100vh-48px)] overflow-hidden grid grid-cols-1 md:grid-cols-[360px_1fr] bg-[#231e27] border border-white/[0.10] shadow-[0_40px_120px_-20px_rgba(12,6,18,0.92)] animate-in fade-in zoom-in-95 duration-300 rounded-2xl"
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
              className="relative p-9 pr-7 flex flex-col gap-6 overflow-hidden border-r border-[rgba(255,255,255,0.10)]"
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
              <div className="relative z-[2] self-center">
                <svg width="64" height="64" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="100,5 115.6,84.4 195,100 115.6,115.6 100,195 84.4,115.6 5,100 84.4,84.4" fill="#ddb7ff" opacity="0.55" />
                  <polygon points="100,5 115.6,84.4 195,100 115.6,115.6 100,195 84.4,115.6 5,100 84.4,84.4" fill="url(#starGlow)" style={{ mixBlendMode: "screen" }} />
                  <defs>
                    <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="70%" stopColor="rgba(157,78,221,0)" />
                      <stop offset="100%" stopColor="rgba(157,78,221,0.35)" />
                    </radialGradient>
                  </defs>
                </svg>
              </div>
              <div className="relative z-[2] flex flex-col gap-3.5">
                <h3
                  className="font-display text-[56px] leading-[0.9] tracking-[0.01em] uppercase text-white m-0"
                >
                  Join The<br />Release
                </h3>
              </div>
            </div>

            {/* Right Panel */}
            <div className="p-9 pt-8 flex flex-col gap-4">
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
    </section>
  );
}

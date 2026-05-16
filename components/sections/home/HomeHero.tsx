"use client";

import { useState } from "react";

export default function HomeHero() {
  const [joinOpen, setJoinOpen] = useState(true);

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-end overflow-hidden bg-[#050505] isolate">
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
            "radial-gradient(50% 50% at 20% 30%, rgba(123,47,190,0.35), transparent 65%), radial-gradient(40% 40% at 80% 80%, rgba(255,77,0,0.20), transparent 65%), linear-gradient(180deg, rgba(5,5,8,0.55) 0%, rgba(5,5,8,0.25) 35%, rgba(5,5,8,0.85) 100%)"
        }}
      />
      <div className="absolute inset-0 z-[-2] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)"
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
        <h1 className="font-gothic text-[clamp(64px,10vw,168px)] leading-[0.9] tracking-[0.02em] uppercase text-white m-0">
          Design <em className="not-italic text-[#c77dff]" style={{ textShadow: "0 0 30px rgba(157,78,221,0.5)" }}>your</em>
          <br />
          reality.
        </h1>
        <p className="text-[15px] leading-relaxed text-white/85 max-w-[640px] m-0">
          Eight pieces. One drop. Built for the static city &mdash;
          <br />
          engineered fabrics, brutalist silhouettes, a wallet that follows you
          across the iCorETS universe.
        </p>
        <div className="flex gap-3 mt-4">
          <button
            className="inline-flex items-center gap-3 px-7 py-4 bg-white text-black rounded-xl border border-white font-mono text-[11px] tracking-[0.32em] font-bold uppercase transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_24px_-8px_rgba(255,255,255,0.4)]"
            onClick={() => {
              document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Enter the Drop
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <button
            className="inline-flex items-center gap-3 px-7 py-4 bg-transparent text-white rounded-xl border border-[rgba(255,255,255,0.18)] font-mono text-[11px] tracking-[0.32em] font-bold uppercase transition-all hover:border-[#c77dff] hover:bg-[rgba(157,78,221,0.08)]"
            onClick={() => setJoinOpen(true)}
          >
            Join the Drop
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>

      {/* Join the Drop Modal */}
      {joinOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-6"
          onClick={() => setJoinOpen(false)}
        >
          <div
            className="relative w-full max-w-[960px] max-h-[calc(100vh-48px)] overflow-auto grid grid-cols-1 md:grid-cols-[360px_1fr] bg-[#0a0a0a] border border-[rgba(255,255,255,0.10)] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(157,78,221,0.25),0_0_80px_-20px_rgba(157,78,221,0.4)] animate-in fade-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              className="absolute top-3.5 right-3.5 w-9 h-9 bg-black/60 border border-[rgba(255,255,255,0.18)] text-white grid place-items-center z-[4] transition-colors hover:border-[#ff4d00] hover:text-[#ff4d00]"
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
                background:
                  "linear-gradient(160deg, rgba(123,47,190,0.18), rgba(10,10,10,0.6) 60%), radial-gradient(80% 60% at 30% 20%, rgba(157,78,221,0.25), transparent 60%), #0a0612",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(157,78,221,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(157,78,221,0.08) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                  maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
                }}
              />
              <div
                className="absolute w-80 h-80 rounded-full filter blur-[40px] pointer-events-none top-[-40px] right-[-60px]"
                style={{
                  background: "radial-gradient(circle, rgba(157,78,221,0.5), transparent 60%)",
                  animation: "preFloat 8s ease-in-out infinite",
                }}
              />
              <div className="relative z-[2] self-center">
                {/* Star icon placeholder */}
                <svg width="64" height="64" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="100,5 115.6,84.4 195,100 115.6,115.6 100,195 84.4,115.6 5,100 84.4,84.4" fill="#c77dff" opacity="0.8" />
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
                <div className="font-mono text-[#c77dff] text-[10px] tracking-[0.5em] uppercase">
                  ★ MEMBERS ONLY
                </div>
                <h3
                  className="font-gothic text-[56px] leading-[0.95] tracking-[0.02em] uppercase text-white m-0"
                  style={{ textShadow: "0 0 30px rgba(157,78,221,0.4)" }}
                >
                  JOIN THE<br />DROP
                </h3>
                <p className="text-[13px] leading-relaxed text-[#7a7a7a]">
                  First access to Drop 001. Earn pts on every order. Free shipping on day-one launches.
                </p>
                <ul className="list-none p-0 m-0 flex flex-col gap-2.5 mt-2">
                  {["Early access · 24h before public", "100 welcome pts (₹100 off)", "Member-only colorways"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[10px] tracking-[0.25em] text-white/70 uppercase">
                      <span className="w-[6px] h-[6px] bg-[#ff4d00] shadow-[0_0_8px_#ff4d00] shrink-0 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Panel */}
            <div className="p-9 pt-8 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 mb-1">
                <div className="font-mono text-[10px] tracking-[0.5em] text-[#c77dff] uppercase">
                  FW · 26 · DROP 01 · 8 PIECES
                </div>
                <h2 className="font-gothic text-[36px] leading-none tracking-[0.02em] uppercase text-white m-0">
                  Welcome to <em className="not-italic text-[#c77dff]">StreetplayR</em>
                </h2>
                <p className="text-[13px] text-[#7a7a7a] leading-relaxed mt-1">
                  Tell us who you are. We&apos;ll line up your drop.
                </p>
              </div>

              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => { e.preventDefault(); setJoinOpen(false); }}
              >
                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[9px] tracking-[0.4em] text-[#4d4d4d] uppercase">NAME</span>
                  <input className="w-full bg-[#111114] border border-[rgba(255,255,255,0.18)] text-white p-3.5 font-mono text-[13px] tracking-[0.04em] outline-none transition-all focus:border-[#c77dff] focus:shadow-[0_0_0_1px_rgba(199,125,255,0.3),0_0_24px_-8px_rgba(157,78,221,0.5)] focus:bg-[#131018]" placeholder="Your name" type="text" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[9px] tracking-[0.4em] text-[#4d4d4d] uppercase">EMAIL</span>
                  <input className="w-full bg-[#111114] border border-[rgba(255,255,255,0.18)] text-white p-3.5 font-mono text-[13px] tracking-[0.04em] outline-none transition-all focus:border-[#c77dff] focus:shadow-[0_0_0_1px_rgba(199,125,255,0.3),0_0_24px_-8px_rgba(157,78,221,0.5)] focus:bg-[#131018]" placeholder="you@streetplayr.com" type="email" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[9px] tracking-[0.4em] text-[#4d4d4d] uppercase">PHONE</span>
                  <input className="w-full bg-[#111114] border border-[rgba(255,255,255,0.18)] text-white p-3.5 font-mono text-[13px] tracking-[0.04em] outline-none transition-all focus:border-[#c77dff] focus:shadow-[0_0_0_1px_rgba(199,125,255,0.3),0_0_24px_-8px_rgba(157,78,221,0.5)] focus:bg-[#131018]" placeholder="+X XXX XXX XXXX" type="tel" />
                </label>
                <button type="submit" className="w-full bg-[#c77dff] py-4 mt-2 font-mono font-bold text-[14px] tracking-[0.05em] uppercase text-black hover:bg-white hover:text-black transition-all duration-300 shadow-lg group flex items-center justify-center gap-2 rounded-xl">
                  SUBMIT
                  <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <p className="font-mono text-[10px] text-[#7a7a7a] text-center leading-relaxed mt-1">
                  BY ENTERING, YOU CONSENT TO DATA TRANSMISSION WITHIN THE STREETPLAYR DECENTRALIZED PROTOCOL.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

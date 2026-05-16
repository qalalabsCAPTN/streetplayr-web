"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function HomeHero() {
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-[#16111b]">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-[#2e1a3d] via-[#16111b] to-[#050505] opacity-80" />
        <div className="absolute inset-0 scanline opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
        <div className="absolute inset-0 grid-overlay opacity-20" />
      </div>

      {/* HUD Overlays — left */}
      <div className="absolute top-24 left-16 hidden lg:block font-hud text-[var(--sp-accent)]/60">
        <p>REC [●] LIVE_SIGNAL_STRENGTH: 98.4%</p>
        <p>LOC: 35.6895° N, 139.6917° E</p>
        <p>TIME_STAMP: 04:22:11:09</p>
      </div>

      {/* HUD Overlays — right */}
      <div className="absolute bottom-12 right-16 hidden lg:block font-hud text-[var(--sp-accent)]/60 text-right">
        <p>CORE_ENGINE: V1.0.4_BETA</p>
        <p>CHROME_STAR_STATUS: ACTIVE</p>
        <p>LATENCY: 12ms</p>
      </div>

      {/* Join the Universe Modal */}
      {joinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setJoinOpen(false)}>
          <div className="relative z-10 w-full max-w-md mx-4 bg-[#1f1a23]/90 backdrop-blur-xl border border-[var(--sp-accent)]/30 p-8 shadow-[0_0_50px_rgba(132,43,210,0.2)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
              <h2 className="font-display text-[42px] md:text-[64px] text-[var(--sp-accent)] leading-none uppercase" style={{ fontFamily: "'Anton', sans-serif" }}>Join the<br />Universe</h2>
              <span className="font-hud border border-[var(--sp-accent)] px-2 py-1 text-[var(--sp-accent)]">STREET_01</span>
            </div>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setJoinOpen(false); }}>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="font-hud text-[var(--sp-text-secondary)] block">USER_NAME_INPUT</label>
                  <input className="w-full bg-[#39323d] border-b border-[var(--sp-border-subtle)] focus:border-[var(--sp-accent-2)] transition-colors font-hud text-[var(--sp-text-primary)] placeholder:text-[var(--sp-text-muted)] p-3 outline-none" placeholder="ENTER_FULL_NAME" type="text" />
                </div>
                <div className="space-y-1">
                  <label className="font-hud text-[var(--sp-text-secondary)] block">USER_PHONE_INPUT</label>
                  <input className="w-full bg-[#39323d] border-b border-[var(--sp-border-subtle)] focus:border-[var(--sp-accent-2)] transition-colors font-hud text-[var(--sp-text-primary)] placeholder:text-[var(--sp-text-muted)] p-3 outline-none" placeholder="+X XXX XXX XXXX" type="tel" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[var(--sp-accent)] py-4 font-bold text-[14px] tracking-[0.05em] uppercase text-[var(--sp-cta-text)] hover:bg-white hover:text-black transition-all duration-300 shadow-lg hover:shadow-[var(--sp-accent-glow)] group flex items-center justify-center gap-2">
                SUBMIT
                <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <p className="font-hud text-[10px] text-[var(--sp-text-muted)] text-center leading-relaxed mt-4">
                BY ENTERING, YOU CONSENT TO DATA TRANSMISSION WITHIN THE STREETPLAYR DECENTRALIZED PROTOCOL.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Main CTA panel */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-[#1f1a23]/90 backdrop-blur-xl border border-[var(--sp-accent)]/30 p-8 shadow-[0_0_50px_rgba(132,43,210,0.2)]">
        <div className="flex justify-between items-start mb-8">
          <h2 className="font-display text-[42px] md:text-[64px] text-[var(--sp-accent)] leading-none uppercase" style={{ fontFamily: "'Anton', sans-serif" }}>Join the<br />Universe</h2>
          <span className="font-hud border border-[var(--sp-accent)] px-2 py-1 text-[var(--sp-accent)]">STREET_01</span>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="font-hud text-[var(--sp-text-secondary)] block">USER_NAME_INPUT</label>
            <input className="w-full bg-[#39323d] border-b border-[var(--sp-border-subtle)] focus:border-[var(--sp-accent-2)] transition-colors font-hud text-[var(--sp-text-primary)] placeholder:text-[var(--sp-text-muted)] p-3 outline-none" placeholder="ENTER_FULL_NAME" type="text" />
          </div>
          <div className="space-y-1">
            <label className="font-hud text-[var(--sp-text-secondary)] block">USER_PHONE_INPUT</label>
            <input className="w-full bg-[#39323d] border-b border-[var(--sp-border-subtle)] focus:border-[var(--sp-accent-2)] transition-colors font-hud text-[var(--sp-text-primary)] placeholder:text-[var(--sp-text-muted)] p-3 outline-none" placeholder="+X XXX XXX XXXX" type="tel" />
          </div>
        </div>
        <button className="w-full bg-[var(--sp-accent)] py-4 font-bold text-[14px] tracking-[0.05em] uppercase text-[var(--sp-cta-text)] hover:bg-white hover:text-black transition-all duration-300 shadow-lg hover:shadow-[var(--sp-accent-glow)] group flex items-center justify-center gap-2 mt-6">
          SUBMIT
          <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
        </button>
        <p className="font-hud text-[10px] text-[var(--sp-text-muted)] text-center leading-relaxed mt-4">
          BY ENTERING, YOU CONSENT TO DATA TRANSMISSION WITHIN THE STREETPLAYR DECENTRALIZED PROTOCOL.
        </p>
      </div>
    </section>
  );
}

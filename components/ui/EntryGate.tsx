"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const SESSION_KEY = "sp-entry-seen";

/* Pre-defined particle positions — stable across SSR/CSR */
const PARTICLES: { left: number; delay: number; dur: number; size: number; opacity: number }[] = [
  { left: 4,  delay: 0.0, dur: 4.8, size: 2, opacity: 0.6 },
  { left: 10, delay: 1.4, dur: 3.9, size: 3, opacity: 0.4 },
  { left: 18, delay: 0.7, dur: 5.2, size: 2, opacity: 0.5 },
  { left: 24, delay: 2.1, dur: 4.1, size: 4, opacity: 0.3 },
  { left: 32, delay: 0.3, dur: 6.0, size: 2, opacity: 0.6 },
  { left: 39, delay: 1.8, dur: 3.7, size: 3, opacity: 0.4 },
  { left: 46, delay: 0.9, dur: 5.5, size: 2, opacity: 0.5 },
  { left: 53, delay: 2.5, dur: 4.3, size: 4, opacity: 0.35 },
  { left: 60, delay: 0.4, dur: 6.2, size: 2, opacity: 0.55 },
  { left: 67, delay: 1.2, dur: 3.5, size: 3, opacity: 0.45 },
  { left: 73, delay: 2.8, dur: 4.9, size: 2, opacity: 0.4 },
  { left: 80, delay: 0.6, dur: 5.8, size: 3, opacity: 0.5 },
  { left: 87, delay: 1.9, dur: 4.0, size: 2, opacity: 0.6 },
  { left: 93, delay: 0.2, dur: 6.5, size: 4, opacity: 0.3 },
  { left: 97, delay: 2.3, dur: 3.8, size: 2, opacity: 0.5 },
  /* accent-2 green particles */
  { left: 14, delay: 3.1, dur: 5.0, size: 2, opacity: 0.35 },
  { left: 56, delay: 3.5, dur: 4.6, size: 2, opacity: 0.3 },
  { left: 78, delay: 3.9, dur: 5.3, size: 3, opacity: 0.25 },
];

/* Stagger each letter for wordmark reveal */
const WORDMARK = "STREET PLAYR".split("");

export default function EntryGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem(SESSION_KEY);
      if (!seen) setVisible(true);
    } catch {
      /* sessionStorage blocked in some privacy modes — skip gate */
    }
  }, []);

  function handleEnter() {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* noop */ }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="entry-gate"
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
          style={{ background: "var(--sp-bg-base)" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleEnter}
          aria-label="Enter Street PlayR"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleEnter()}
        >
          {/* Noise layer */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              opacity: 0.04,
              mixBlendMode: "overlay",
            }}
          />

          {/* Grid floor */}
          <div className="pointer-events-none absolute inset-0 grid-floor" />

          {/* Radial purple bloom behind logo */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: "480px",
              height: "480px",
              background:
                "radial-gradient(ellipse at center, rgba(123,47,190,0.18) 0%, transparent 70%)",
              filter: "blur(32px)",
            }}
          />

          {/* Particles */}
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="entry-particle"
              style={{
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.dur}s`,
                background: i >= 15 ? "var(--sp-accent-2)" : "var(--sp-accent)",
              }}
            />
          ))}

          {/* Core content */}
          <div className="relative flex flex-col items-center gap-8">
            {/* SP monogram with 3D perspective tilt on mount */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotateX: 30, y: 24 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ perspective: "800px" }}
            >
              <div
                className="grid h-28 w-28 place-items-center bg-white text-black"
                style={{
                  boxShadow:
                    "0 0 40px rgba(157,78,221,0.55), 0 0 80px rgba(157,78,221,0.28), 0 0 0 1px rgba(255,255,255,0.15)",
                }}
              >
                <span className="font-display text-6xl leading-none tracking-[0.04em]">
                  SP
                </span>
              </div>
            </motion.div>

            {/* Gothic wordmark */}
            <motion.div
              className="flex gap-[0.06em] overflow-hidden"
              aria-label="Street PlayR"
            >
              {WORDMARK.map((char, i) => (
                <motion.span
                  key={i}
                  aria-hidden="true"
                  className="font-gothic text-3xl sm:text-4xl text-white leading-none"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.45 + i * 0.04,
                    duration: 0.35,
                    ease: "easeOut",
                  }}
                >
                  {char === " " ? " " : char}
                </motion.span>
              ))}
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="font-mono text-xs uppercase tracking-[0.32em] text-white/35"
            >
              Enter The Play
            </motion.p>
          </div>

          {/* Tap / click prompt */}
          <motion.div
            className="absolute bottom-14 flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0, 0.8, 0.4, 0.8], y: 0 }}
            transition={{ delay: 1.4, duration: 2, repeat: Infinity, repeatType: "mirror" }}
          >
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-white/40">
              Click to Enter
            </span>
            {/* Animated chevron */}
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
              <path d="M1 1l4 4 4-4" stroke="rgba(157,78,221,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>

          {/* Bottom accent line */}
          <motion.div
            className="absolute bottom-0 left-0 h-px w-full origin-left"
            style={{ background: "var(--sp-accent)" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

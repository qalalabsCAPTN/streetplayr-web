"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const SESSION_KEY = "sp-entry-seen";

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  left: [4, 10, 18, 24, 32, 39, 46, 53, 60, 67, 73, 80, 87, 93, 97, 14, 56, 78, 22, 35, 48, 62, 75, 88, 5, 42, 70, 95][i % 28],
  delay: [0.0, 1.4, 0.7, 2.1, 0.3, 1.8, 0.9, 2.5, 0.4, 1.2, 2.8, 0.6, 1.9, 0.2, 2.3, 3.1, 3.5, 3.9, 2.0, 0.5, 3.3, 1.5, 2.7, 0.8, 3.7, 1.1, 2.4, 3.0][i % 28],
  dur: 4 + (i % 9),
  size: [2, 3, 2, 4, 2, 3, 2, 4, 2, 3, 2, 3, 2, 4, 2, 2, 2, 3, 3, 2, 4, 2, 3, 2, 3, 2, 2, 3][i % 28],
  isGreen: i >= 15 && i < 18,
}));

export default function EntryGate() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem(SESSION_KEY);
      if (!seen) setVisible(true);
    } catch { }
  }, []);

  useEffect(() => {
    if (!visible) return;
    let p = 0;
    const id = setInterval(() => {
      p += Math.random() * 14 + 4;
      if (p >= 100) { p = 100; setReady(true); clearInterval(id); }
      setProgress(p);
    }, 180);
    return () => clearInterval(id);
  }, [visible]);

  function handleEnter() {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="entry-gate"
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden select-none"
          style={{ background: "#000" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleEnter}
          aria-label="Enter StreetplayR"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleEnter()}
        >
          {/* Background layers */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(157,78,221,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(157,78,221,0.07) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
                animation: "gridDrift 28s linear infinite",
                maskImage: "radial-gradient(80% 80% at 50% 50%, #000 50%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(80% 80% at 50% 50%, #000 50%, transparent 100%)",
              }}
            />
            <div
              className="absolute rounded-full blur-[80px] opacity-60"
              style={{
                width: "620px",
                height: "620px",
                background: "radial-gradient(circle, rgba(123,47,190,0.55), transparent 70%)",
                top: "10%",
                left: "55%",
                animation: "blobP 18s ease-in-out infinite",
              }}
            />
            <div
              className="absolute rounded-full blur-[80px] opacity-60"
              style={{
                width: "460px",
                height: "460px",
                background: "radial-gradient(circle, rgba(26,170,90,0.30), transparent 70%)",
                top: "60%",
                left: "10%",
                animation: "blobG 22s ease-in-out infinite",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                backgroundSize: "256px",
                opacity: 0.04,
                mixBlendMode: "overlay",
              }}
            />
            <div
              className="absolute left-0 right-0 h-px"
              style={{
                background: "linear-gradient(90deg, transparent, #C77DFF, transparent)",
                animation: "scan 7s linear infinite",
                opacity: 0,
              }}
            />
            <div
              className="absolute left-0 right-0 h-px"
              style={{
                background: "linear-gradient(90deg, transparent, #57E389, transparent)",
                animation: "scan 7s linear infinite",
                animationDelay: "2.4s",
                opacity: 0,
              }}
            />
          </div>

          {/* Particles */}
          <div className="pointer-events-none absolute inset-0">
            {PARTICLES.map((p, i) => (
              <span
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${p.left}%`,
                  bottom: "-10px",
                  width: p.size,
                  height: p.size,
                  background: p.isGreen ? "#57E389" : "#C77DFF",
                  boxShadow: p.isGreen ? "0 0 6px #57E389" : "0 0 6px #C77DFF",
                  animation: `pPart ${p.dur}s linear infinite`,
                  animationDelay: `${p.delay}s`,
                }}
              />
            ))}
          </div>

          {/* Center content */}
          <div
            className="relative z-[2] flex flex-col items-center gap-10"
            style={{ pointerEvents: "none" }}
          >
            {/* Brand name */}
            <div
              className="text-center"
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: "clamp(64px, 11vw, 140px)",
                color: "#fff",
                letterSpacing: "0.04em",
                textShadow: "none",
                animation: "preFloat 5s ease-in-out infinite",
              }}
            >
              StreetplayR
            </div>

            {/* Tagline */}
            <div
              className="font-hud text-center"
              style={{
                fontSize: "10px",
                letterSpacing: "0.6em",
                color: "rgba(255,255,255,0.55)",
                textTransform: "uppercase",
                marginTop: "-32px",
              }}
            >
              FW · 26 · DROP 01 · 8 PIECES
            </div>

            {ready ? (
              <button
                onClick={(e) => { e.stopPropagation(); handleEnter(); }}
                style={{ pointerEvents: "auto" }}
                className="font-mono text-[12px] tracking-[0.6em] uppercase text-white/85 hover:text-[#ddb7ff] bg-transparent border-none transition-all duration-300 cursor-pointer hover:scale-105 whitespace-nowrap"
              >
                [ CLICK TO ENTER ]
              </button>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div
                  className="font-hud text-[10px] tracking-[0.3em] uppercase"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  LOADING DROP · {Math.floor(progress).toString().padStart(2, "0")}%
                </div>
                <div
                  className="relative w-[240px] h-px overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      width: `${progress}%`,
                      background: "#b8a1ff",
                      transition: "width 0.18s ease",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom meta */}
          <div
            className="absolute bottom-[30px] left-9 right-9 flex justify-between font-hud text-[10px] tracking-[0.3em] uppercase select-none"
            style={{ color: "rgba(122,122,122,1)" }}
          >
            <span>v1.0.0 · STREET playR</span>
            <span>READY {ready ? "★" : " "}</span>
            <span>MUMBAI · 04:18 IST</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

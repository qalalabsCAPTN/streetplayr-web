"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";

const CHAPTERS = [
  { at: 0.00, eyebrow: "CH · 01", title: "DESIGN", sub: "YOUR REALITY" },
  { at: 0.33, eyebrow: "CH · 02", title: "GRIND", sub: "UNTIL YOU SHINE" },
  { at: 0.66, eyebrow: "CH · 03", title: "STREET", sub: "PLAYR · FW 26" },
];

const TICKER_ITEMS = [
  "DESIGN YOUR REALITY", "★", "GRIND UNTIL YOU SHINE", "★",
  "DROP 001 LIVE", "★", "WE ARE THE COMMUNITY", "★",
];

export default function Loader() {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);

  const DURATION = 6.5;

  const handleDone = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const hasSeenLoader = sessionStorage.getItem("streetplayr-loader-seen");
    if (hasSeenLoader) {
      setIsVisible(false);
      return;
    }
    sessionStorage.setItem("streetplayr-loader-seen", "true");
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (DURATION * 1000));
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setTimeout(handleDone, 250);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") handleDone();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKey);
    };
  }, [isVisible, handleDone]);

  const idx = CHAPTERS.reduce((acc, c, i) => (progress >= c.at ? i : acc), 0);
  const cur = CHAPTERS[idx];

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[100] overflow-hidden"
          style={{ background: "#000", animation: "filmIn 0.5s cubic-bezier(0.16,1,0.3,1)" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* Video background */}
          <video
            ref={videoRef}
            src="/assets/videos/WebAnimation_V1.mp4"
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Atmospheric overlays */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(157,78,221,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(157,78,221,0.06) 1px, transparent 1px)",
                backgroundSize: "80px 80px",
                animation: "filmGrid 22s linear infinite",
                WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 75%)",
                maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 75%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%), radial-gradient(60% 50% at 80% 10%, rgba(123,47,190,0.25), transparent 60%), radial-gradient(50% 40% at 10% 90%, rgba(26,74,46,0.20), transparent 60%)",
              }}
            />
            <div
              className="absolute left-0 right-0 h-px top-0"
              style={{
                background: "linear-gradient(90deg, transparent, #C77DFF, transparent)",
                animation: "filmScan 5s linear infinite",
                opacity: 0.55,
                willChange: "transform",
              }}
            />
            <div
              className="absolute left-0 right-0 h-px top-0"
              style={{
                background: "linear-gradient(90deg, transparent, #C77DFF, transparent)",
                animation: "filmScan 8s linear infinite",
                animationDelay: "-2s",
                opacity: 0.3,
                willChange: "transform",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
                backgroundSize: "256px",
                mixBlendMode: "overlay",
                opacity: 0.4,
                animation: "filmNoise 0.4s steps(3) infinite",
              }}
            />
          </div>

          {/* Center content — chapter titles */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-9"
            style={{ zIndex: 2 }}
          >
            <div key={idx} style={{ animation: "filmCopyIn 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
              <div
                className="font-hud text-center mb-[14px]"
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.6em",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                ★ {cur.eyebrow} · STREETPLAYR FILM
              </div>
              <div
                className="text-center font-display"
                style={{
                  fontSize: "clamp(64px, 12vw, 180px)",
                  lineHeight: 0.9,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  background: "linear-gradient(180deg, #fff 30%, #9a9a9a 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "none",
                }}
              >
                {cur.title}
              </div>
              <div
                className="font-hud text-center mt-[14px]"
                style={{
                  fontSize: "13px",
                  letterSpacing: "0.5em",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {cur.sub}
              </div>
            </div>
          </div>

          {/* HUD top-left */}
          <div
            className="absolute top-7 left-7 flex flex-col gap-[6px] z-[3] font-hud"
            style={{ fontSize: "10px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.55)" }}
          >
              <span className="inline-flex items-center gap-2" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.55)",
                  boxShadow: "none",
                  animation: "filmRec 1s ease-in-out infinite",
                }}
              />
              Film
            </span>
            <span>STREETPLAYR · DROP 001</span>
          </div>

          {/* HUD top-right */}
          <div
            className="absolute top-7 right-7 flex flex-col gap-[6px] items-end z-[3] font-hud"
            style={{ fontSize: "10px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.55)" }}
          >
            <span>
              {String(Math.floor(progress * DURATION)).padStart(2, "0")}:
              {String(Math.floor(((progress * DURATION) % 1) * 100)).padStart(2, "0")} / 00:06
            </span>
            <span>4K · 23.976</span>
          </div>

          {/* HUD bottom-left */}
          <div
            className="absolute bottom-12 left-7 flex flex-col gap-[6px] z-[3] font-hud max-sm:hidden"
            style={{ fontSize: "10px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.55)" }}
          >
            <span>MUMBAI · 04:18 IST</span>
            <span>FW26 · Mumbai</span>
          </div>

          {/* HUD bottom-right */}
          <div
            className="absolute bottom-12 right-7 flex flex-col gap-[6px] items-end z-[3] font-hud max-sm:hidden"
            style={{ fontSize: "10px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.55)" }}
          >
            <span>SCN {String(idx + 1).padStart(2, "0")}/03</span>
          </div>

          {/* Side ticker */}
          <div
            className="absolute right-[-50px] top-1/2 z-[3] font-hud max-sm:hidden"
            style={{
              transform: "translateY(-50%) rotate(90deg)",
              transformOrigin: "center",
              display: "flex",
              gap: "28px",
              fontSize: "10px",
              letterSpacing: "0.35em",
              color: "rgba(255,255,255,0.25)",
              whiteSpace: "nowrap",
            }}
          >
            {TICKER_ITEMS.map((s, i) => (
              <span key={i} className="inline-block">{s}</span>
            ))}
          </div>

          {/* Skip button */}
          <button
            onClick={handleDone}
            className="absolute bottom-[90px] right-7 z-[4] max-sm:bottom-10 max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:right-auto"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 22px",
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "rgba(255,255,255,0.85)",
              fontFamily: "var(--font-sp-mono), 'Courier New', monospace",
              fontSize: "10px",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              backdropFilter: "blur(10px)",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#C77DFF";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
              e.currentTarget.style.color = "rgba(255,255,255,0.85)";
            }}
          >
            <span
              className="relative w-[60px] h-[2px] overflow-hidden"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <span
                className="absolute inset-0"
                style={{
                  width: `${progress * 100}%`,
                  background: "linear-gradient(90deg, #7B2FBE, #C77DFF, #FF4D00)",
                  transition: "width 0.1s linear",
                }}
              />
            </span>
            <span>Skip Intro</span>
          </button>

          {/* Bottom progress bar */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] z-[4]"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full"
              style={{
                width: `${progress * 100}%`,
                background: "linear-gradient(90deg, #7B2FBE, #C77DFF, #FF4D00)",
                boxShadow: "0 0 12px #C77DFF",
                transition: "width 0.1s linear",
              }}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

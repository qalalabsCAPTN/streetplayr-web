"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const wordmark = "STREET PLAYR".split("");

export default function Loader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hasSeenLoader = sessionStorage.getItem("streetplayr-loader-seen");

    if (hasSeenLoader) {
      const skipTimeout = window.setTimeout(() => setIsVisible(false), 0);
      return () => window.clearTimeout(skipTimeout);
    }

    sessionStorage.setItem("streetplayr-loader-seen", "true");

    const timeout = window.setTimeout(
      () => setIsVisible(false),
      prefersReducedMotion ? 350 : 1550,
    );

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-black"
          exit={{ opacity: 0 }}
          initial={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <div className="flex flex-col items-center px-6 text-center">
            <motion.svg
              aria-hidden="true"
              className="h-28 w-40"
              fill="none"
              initial="hidden"
              viewBox="0 0 220 140"
            >
              <motion.path
                d="M26 82c19 8 45 11 78 10 35-1 64-7 88-18 8-4 15 6 10 14l-13 19c-5 7-12 11-21 11H66c-21 0-38-9-51-27-5-7 3-13 11-9Z"
                stroke="#ffffff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="5"
                variants={{
                  hidden: { pathLength: 0, opacity: 0 },
                  visible: {
                    pathLength: 1,
                    opacity: 1,
                    transition: { duration: 0.42, ease: "easeInOut" },
                  },
                }}
                animate="visible"
              />
              <motion.path
                d="M53 75c14-24 31-36 51-36 17 0 29 8 39 24m-72-6 20 19m5-28 25 28m8-20 21 16"
                stroke="var(--sp-accent)"
                strokeLinecap="round"
                strokeWidth="4"
                variants={{
                  hidden: { pathLength: 0, opacity: 0 },
                  visible: {
                    pathLength: 1,
                    opacity: 1,
                    transition: { delay: 0.22, duration: 0.36 },
                  },
                }}
                animate="visible"
              />
              <motion.circle
                animate={{ y: [0, -8, 0] }}
                cx="178"
                cy="56"
                fill="#ffffff"
                r="10"
                transition={{ delay: 0.35, duration: 0.52, ease: "easeOut" }}
              />
              <motion.path
                animate={{ rotate: [0, -12, 0] }}
                d="M174 48c-12-8-12-21 0-29"
                stroke="#ffffff"
                strokeLinecap="round"
                strokeWidth="4"
                style={{ originX: "80%", originY: "20%" }}
                transition={{ delay: 0.38, duration: 0.45, ease: "easeOut" }}
              />
            </motion.svg>

            <div
              aria-label="Street PlayR"
              className="mt-7 flex flex-wrap justify-center gap-x-1 font-display text-5xl leading-none tracking-[0.16em]"
            >
              {wordmark.map((letter, index) => (
                <motion.span
                  aria-hidden="true"
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 18 }}
                  key={`${letter}-${index}`}
                  transition={{
                    delay: 0.58 + index * 0.025,
                    duration: 0.24,
                    ease: "easeOut",
                  }}
                >
                  {letter === " " ? "\u00a0" : letter}
                </motion.span>
              ))}
            </div>

            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-white/56"
              initial={{ opacity: 0, y: 12 }}
              transition={{ delay: 1.02, duration: 0.24 }}
            >
              Let me put you in a better outfit.
            </motion.p>
          </div>

          <motion.div
            animate={{ scaleX: 1 }}
            className="absolute bottom-0 left-0 h-px w-full origin-left bg-[var(--sp-accent)]"
            initial={{ scaleX: 0 }}
            transition={{ duration: 1.45, ease: "easeInOut" }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

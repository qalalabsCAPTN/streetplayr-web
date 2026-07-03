"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function StoreTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    const frame = requestAnimationFrame(handleResize);
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleQuery = () => setPrefersReducedMotion(mediaQuery.matches);
    const frame = requestAnimationFrame(handleQuery);
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      cancelAnimationFrame(frame);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const isMobile = windowWidth !== null && windowWidth < 768;
  const isTablet = windowWidth !== null && windowWidth >= 768 && windowWidth < 1024;

  let duration = 0.35; // Desktop default (350ms)
  let yOffset = 15;     // Desktop vertical offset

  if (isMobile) {
    duration = 0.2;     // Phone fast fade (200ms)
    yOffset = 0;        // No Y translation
  } else if (isTablet) {
    duration = 0.3;     // Tablet smooth slide+fade (300ms)
    yOffset = 10;       // Reduced Y translation
  }

  // Honor prefers-reduced-motion accessibility setting
  if (prefersReducedMotion) {
    duration = 0.1;
    yOffset = 0;
  }

  const variants = {
    hidden: { opacity: 0, y: yOffset },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
      className="w-full flex-grow flex flex-col relative"
    >
      {children}
    </motion.div>
  );
}

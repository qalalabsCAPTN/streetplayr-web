"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Ported from Bluorng 2. NOT wired into app/layout.tsx by default — it duplicates
 * ScrollDamping.tsx's job (custom physics scroll + window.__scrollDampingY global
 * consumed by scroll-reactive 3D components). Enabling both simultaneously will
 * make them fight over wheel/scroll control. Swap one for the other deliberately;
 * do not mount both in the same layout.
 */
export default function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 2.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 5), // quintic ease-out for luxurious, lazy decay
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return null;
}

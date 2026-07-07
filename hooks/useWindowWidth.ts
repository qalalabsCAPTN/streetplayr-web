"use client";

import { useState, useEffect } from "react";

let cachedWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
const subscribers = new Set<(width: number) => void>();
let resizeRegistered = false;
let rafId: number | null = null;

const handleResize = () => {
  cachedWidth = window.innerWidth;
  subscribers.forEach((cb) => cb(cachedWidth));
  rafId = null;
};

const setupResize = () => {
  if (resizeRegistered || typeof window === "undefined") return;
  window.addEventListener("resize", () => {
    if (rafId === null) {
      rafId = requestAnimationFrame(handleResize);
    }
  });
  resizeRegistered = true;
};

export function useWindowWidth() {
  const [width, setWidth] = useState(cachedWidth);

  useEffect(() => {
    setupResize();
    const listener = (newWidth: number) => setWidth(newWidth);
    subscribers.add(listener);
    // Sync immediate width on mount
    if (typeof window !== "undefined") {
      setWidth(window.innerWidth);
    }
    return () => {
      subscribers.delete(listener);
    };
  }, []);

  return width;
}

"use client";

import { useState, useEffect } from "react";

/* eslint-disable react-hooks/set-state-in-effect */

const SSR_WIDTH = 1024;

const getBucket = (width: number) => {
  if (width < 768) return 0;
  if (width < 1024) return 1;
  return 2;
};

/** Always SSR-safe — never read window at module init (avoids hydration mismatch). */
let cachedWidth = SSR_WIDTH;
let cachedBucket = getBucket(cachedWidth);

const subscribers = new Set<(width: number) => void>();
let resizeRegistered = false;
let rafId: number | null = null;

const handleResize = () => {
  const currentWidth = window.innerWidth;
  const currentBucket = getBucket(currentWidth);
  if (currentBucket !== cachedBucket) {
    cachedWidth = currentWidth;
    cachedBucket = currentBucket;
    subscribers.forEach((cb) => cb(cachedWidth));
  }
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

/**
 * Returns viewport width. First client render matches SSR (1024), then syncs in effect.
 */
export function useWindowWidth() {
  const [width, setWidth] = useState(SSR_WIDTH);

  useEffect(() => {
    setupResize();
    const listener = (newWidth: number) => setWidth(newWidth);
    subscribers.add(listener);

    const currentWidth = window.innerWidth;
    cachedWidth = currentWidth;
    cachedBucket = getBucket(currentWidth);
    setWidth(currentWidth);

    return () => {
      subscribers.delete(listener);
    };
  }, []);

  return width;
}

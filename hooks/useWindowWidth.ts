"use client";

import { useState, useEffect } from "react";

/* eslint-disable react-hooks/set-state-in-effect */

const getBucket = (width: number) => {
  if (width < 768) return 0;
  if (width < 1024) return 1;
  return 2;
};

let cachedWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
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

export function useWindowWidth() {
  const [width, setWidth] = useState(cachedWidth);

  useEffect(() => {
    setupResize();
    const listener = (newWidth: number) => setWidth(newWidth);
    subscribers.add(listener);
    if (typeof window !== "undefined") {
      const currentWidth = window.innerWidth;
      const currentBucket = getBucket(currentWidth);
      if (currentBucket !== getBucket(width)) {
        setWidth(currentWidth);
      }
    }
    return () => {
      subscribers.delete(listener);
    };
  }, [width]);

  return width;
}

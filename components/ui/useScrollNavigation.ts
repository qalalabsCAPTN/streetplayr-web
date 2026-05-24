"use client";

import { useState, useEffect, useCallback, RefObject } from "react";

interface ScrollNavState {
  needsNavigation: boolean;
  canScrollPrev: boolean;
  canScrollNext: boolean;
}

/**
 * Tracks whether a scroll container has overflow and where the scroll position is.
 * Use this to conditionally show/hide prev/next navigation controls.
 *
 * Rules:
 *   needsNavigation = false → hide ALL nav controls (all items visible)
 *   canScrollPrev   = false → hide/disable prev button (at start)
 *   canScrollNext   = false → hide/disable next button (at end)
 */
export function useScrollNavigation(
  scrollRef: RefObject<HTMLElement | null>
): ScrollNavState {
  const [state, setState] = useState<ScrollNavState>({
    needsNavigation: false,
    canScrollPrev: false,
    canScrollNext: false,
  });

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 2;
    setState({
      needsNavigation: overflow,
      canScrollPrev: el.scrollLeft > 2,
      canScrollNext: el.scrollLeft < el.scrollWidth - el.clientWidth - 2,
    });
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    update();
    el.addEventListener("scroll", update, { passive: true });

    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update, scrollRef]);

  return state;
}

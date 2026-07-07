"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ScrollDamping() {
  const pathname = usePathname();
  const targetScrollY = useRef(0);
  const currentScrollY = useRef(0);
  const velocity = useRef(0);
  const isMoving = useRef(false);
  
  // Timing references for frame-rate independent physics updates
  const lastTime = useRef(0);
  const accumulator = useRef(0);

  // Cache targets to avoid layout thrashing during wheel scrolling
  const lastTarget = useRef<EventTarget | null>(null);
  const lastIsInsideScrollable = useRef(false);

  // Instantly reset scroll state on page navigation to avoid jumping or animating back
  useEffect(() => {
    targetScrollY.current = window.scrollY;
    currentScrollY.current = window.scrollY;
    velocity.current = 0;
    isMoving.current = false;
    lastTime.current = 0;
    accumulator.current = 0;
    lastTarget.current = null;
    lastIsInsideScrollable.current = false;
    if (typeof window !== "undefined") {
      (window as any).__scrollDampingY = window.scrollY;
    }
  }, [pathname]);

  useEffect(() => {
    // If the user prefers reduced motion, do not apply custom scroll interpolation
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    targetScrollY.current = window.scrollY;
    currentScrollY.current = window.scrollY;
    if (typeof window !== "undefined") {
      (window as any).__scrollDampingY = window.scrollY;
    }

    const syncScroll = () => {
      // Sync our tracking variables with the native scroll position.
      // If a non-wheel scroll occurs (drag, keys, anchor), the difference from currentScrollY
      // will be large. In that case, we cancel our animation and sync immediately.
      const diff = Math.abs(window.scrollY - currentScrollY.current);
      if (!isMoving.current || diff > 15) {
        targetScrollY.current = window.scrollY;
        currentScrollY.current = window.scrollY;
        velocity.current = 0;
        isMoving.current = false;
        lastTime.current = 0;
        accumulator.current = 0;
        if (typeof window !== "undefined") {
          (window as any).__scrollDampingY = window.scrollY;
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Don't intercept if body overflow is hidden (e.g. modals, navigation drawer open)
      if (document.body.style.overflow === "hidden") return;

      // Don't intercept if vertical scroll is zero (horizontal scroll only)
      if (e.deltaY === 0) return;

      // Check if target or any parent is scrollable to avoid hijacking nested scroll areas (modals, dropdowns, etc.)
      let isInsideScrollable = false;
      const eventTarget = e.target;
      if (eventTarget && eventTarget === lastTarget.current) {
        isInsideScrollable = lastIsInsideScrollable.current;
      } else {
        lastTarget.current = eventTarget;
        let target = eventTarget as HTMLElement | null;
        while (target && target !== document.body && target !== document.documentElement) {
          const style = window.getComputedStyle(target);
          const overflowY = style.overflowY;
          const isScrollable = overflowY === "auto" || overflowY === "scroll";
          const canScroll = target.scrollHeight > target.clientHeight;
          if (isScrollable && canScroll) {
            isInsideScrollable = true;
            break;
          }
          target = target.parentElement;
        }
        lastIsInsideScrollable.current = isInsideScrollable;
      }
      if (isInsideScrollable) return;

      // Prevent native browser scroll
      e.preventDefault();

      // Make scroll 30% slower -> scale distance by 0.7
      const scrollSpeedMultiplier = 0.7;
      const scrollAmount = e.deltaY * scrollSpeedMultiplier;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetScrollY.current = Math.max(0, Math.min(maxScroll, targetScrollY.current + scrollAmount));

      if (!isMoving.current) {
        isMoving.current = true;
        lastTime.current = 0;
        accumulator.current = 0;
        requestAnimationFrame(updateScroll);
      }
    };

    const updateScroll = (timestamp: number) => {
      if (!isMoving.current) return;

      if (!lastTime.current) {
        lastTime.current = timestamp;
        requestAnimationFrame(updateScroll);
        return;
      }

      const deltaTime = Math.min(timestamp - lastTime.current, 100); // cap elapsed time at 100ms
      lastTime.current = timestamp;

      // Integrate physics using a high-frequency fixed timestep (2ms / 500Hz)
      // This eliminates refresh rate dependency and visual stutter across 60Hz - 240Hz screens
      const timeStep = 2; // 2ms
      accumulator.current += deltaTime;

      const stepStiffness = 0.004; // scaled stiffness for 2ms step size
      const stepDamping = 0.98;    // scaled damping for 2ms step size

      let current = currentScrollY.current;
      const target = targetScrollY.current;
      let vel = velocity.current;

      while (accumulator.current >= timeStep) {
        const displacement = target - current;
        vel = (vel + displacement * stepStiffness) * stepDamping;
        current += vel;
        accumulator.current -= timeStep;
      }

      currentScrollY.current = current;
      velocity.current = vel;
      if (typeof window !== "undefined") {
        (window as any).__scrollDampingY = current;
      }

      const displacement = target - current;
      if (Math.abs(displacement) > 0.05 || Math.abs(vel) > 0.02) {
        window.scrollTo(0, current);
        requestAnimationFrame(updateScroll);
      } else {
        currentScrollY.current = target;
        window.scrollTo(0, target);
        if (typeof window !== "undefined") {
          (window as any).__scrollDampingY = target;
        }
        velocity.current = 0;
        isMoving.current = false;
        lastTime.current = 0;
        accumulator.current = 0;
      }
    };

    window.addEventListener("scroll", syncScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("scroll", syncScroll);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return null;
}

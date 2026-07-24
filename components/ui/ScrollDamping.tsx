"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { animationController } from "@/lib/AnimationController";

/**
 * ScrollDamping — root-cause fix for scroll lag:
 * Never hijack wheel with preventDefault + synthetic window.scrollTo.
 * That spring loop was the delay (input → rAF → scrollTo lag).
 *
 * Now: native browser scroll everywhere. We only lerp `__scrollDampingY`
 * for scroll-reactive 3D (NinjaStar) so parallax stays smooth without
 * fighting the compositor.
 */
export default function ScrollDamping() {
  const pathname = usePathname();
  const targetScrollY = useRef(0);
  const currentScrollY = useRef(0);
  const velocity = useRef(0);
  const isMoving = useRef(false);
  const lastTime = useRef(0);
  const accumulator = useRef(0);

  useEffect(() => {
    targetScrollY.current = window.scrollY;
    currentScrollY.current = window.scrollY;
    velocity.current = 0;
    isMoving.current = false;
    lastTime.current = 0;
    accumulator.current = 0;
    if (typeof window !== "undefined") {
      (window as any).__scrollDampingY = window.scrollY;
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname?.startsWith("/product")) {
      if (typeof window !== "undefined") {
        (window as any).__scrollDampingY = window.scrollY;
      }
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      const handleReducedMotionScroll = () => {
        if (typeof window !== "undefined") {
          (window as any).__scrollDampingY = window.scrollY;
        }
      };
      window.addEventListener("scroll", handleReducedMotionScroll, { passive: true });
      (window as any).__scrollDampingY = window.scrollY;
      return () => window.removeEventListener("scroll", handleReducedMotionScroll);
    }

    targetScrollY.current = window.scrollY;
    currentScrollY.current = window.scrollY;
    (window as any).__scrollDampingY = window.scrollY;

    const handleNativeScroll = () => {
      targetScrollY.current = window.scrollY;
      if (!isMoving.current) {
        isMoving.current = true;
        lastTime.current = 0;
        accumulator.current = 0;
        animationController.register("scroll-damping", updateNativeScrollAnimation);
      }
    };

    const updateNativeScrollAnimation = (_deltaTime: number, timestamp: number) => {
      if (!isMoving.current) {
        animationController.unregister("scroll-damping");
        return;
      }

      if (!lastTime.current) {
        lastTime.current = timestamp;
        return;
      }

      const delta = Math.min(timestamp - lastTime.current, 100);
      lastTime.current = timestamp;

      const timeStep = 2;
      accumulator.current += delta;

      // Snappy follow — only for 3D parallax value, not for moving the page
      const stepStiffness = 0.04;
      const stepDamping = 0.86;

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
      (window as any).__scrollDampingY = current;

      const displacement = target - current;
      if (Math.abs(displacement) <= 0.05 && Math.abs(vel) <= 0.02) {
        currentScrollY.current = target;
        (window as any).__scrollDampingY = target;
        velocity.current = 0;
        isMoving.current = false;
        lastTime.current = 0;
        accumulator.current = 0;
        animationController.unregister("scroll-damping");
      }
    };

    window.addEventListener("scroll", handleNativeScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleNativeScroll);
      animationController.unregister("scroll-damping");
    };
  }, [pathname]);

  return null;
}

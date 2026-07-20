"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { animationController } from "@/lib/AnimationController";

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
    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (prefersReducedMotion) {
      // In reduced motion mode, we still sync scroll position directly on scroll events
      // to keep dependent animations updated immediately rather than frozen.
      const handleReducedMotionScroll = () => {
        if (typeof window !== "undefined") {
          (window as any).__scrollDampingY = window.scrollY;
        }
      };
      
      window.addEventListener("scroll", handleReducedMotionScroll, { passive: true });
      if (typeof window !== "undefined") {
        (window as any).__scrollDampingY = window.scrollY;
      }
      return () => {
        window.removeEventListener("scroll", handleReducedMotionScroll);
      };
    }

    // Detect Safari or Apple platforms (where trackpad/inertial scrolling are common)
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
    const isApplePlatform = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || "");
    const useNativeScroll = isSafari || isApplePlatform;

    targetScrollY.current = window.scrollY;
    currentScrollY.current = window.scrollY;
    if (typeof window !== "undefined") {
      (window as any).__scrollDampingY = window.scrollY;
    }

    if (useNativeScroll) {
      // ─── SAFARI / APPLE NATIVE SCROLL MODE ───
      // We do not hijack wheel events (no preventDefault). This keeps trackpad and inertial scrolling
      // buttery smooth using the browser's native engine. We only run the spring simulation to
      // interpolate __scrollDampingY so that scroll-reactive 3D elements animate smoothly.
      const handleNativeScroll = () => {
        targetScrollY.current = window.scrollY;
        if (!isMoving.current) {
          isMoving.current = true;
          lastTime.current = 0;
          accumulator.current = 0;
          // Register with unified animation controller instead of RAF
          animationController.register("scroll-damping", updateNativeScrollAnimation);
        }
      };

      const updateNativeScrollAnimation = (deltaTime: number, timestamp: number) => {
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

        const timeStep = 2; // 2ms fixed timestep
        accumulator.current += delta;

        const stepStiffness = 0.004;
        const stepDamping = 0.98;

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
        if (Math.abs(displacement) <= 0.05 && Math.abs(vel) <= 0.02) {
          currentScrollY.current = target;
          if (typeof window !== "undefined") {
            (window as any).__scrollDampingY = target;
          }
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
      };
    } else {
      // ─── HIJACKED WHEEL SCROLL MODE (Chrome/Firefox/Windows etc) ───
      const syncScroll = () => {
        // Sync our tracking variables with the native scroll position.
        // If a non-wheel scroll occurs (drag, keys, anchor), the difference from currentScrollY
        // will be large. In that case, we cancel our animation and sync immediately.
        const diff = Math.abs(window.scrollY - currentScrollY.current);
        if (!isMoving.current || diff > 25) { // Increased threshold slightly to prevent premature cancellation on frame drops
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
          // Register with unified animation controller instead of RAF
          animationController.register("scroll-damping", updateScroll);
        }
      };

      const updateScroll = (deltaTime: number, timestamp: number) => {
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

        const stepStiffness = 0.004;
        const stepDamping = 0.98;

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
        if (Math.abs(displacement) <= 0.05 && Math.abs(vel) <= 0.02) {
          currentScrollY.current = target;
          window.scrollTo(0, target);
          if (typeof window !== "undefined") {
            (window as any).__scrollDampingY = target;
          }
          velocity.current = 0;
          isMoving.current = false;
          lastTime.current = 0;
          accumulator.current = 0;
          animationController.unregister("scroll-damping");
        } else {
          window.scrollTo(0, current);
        }
      };

      window.addEventListener("scroll", syncScroll, { passive: true });
      window.addEventListener("wheel", handleWheel, { passive: false });

      return () => {
        window.removeEventListener("scroll", syncScroll);
        window.removeEventListener("wheel", handleWheel);
      };
    }
  }, []);

  return null;
}

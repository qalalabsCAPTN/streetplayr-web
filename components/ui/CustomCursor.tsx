"use client";

import { useEffect, useState, useRef } from "react";

type CursorType = "default" | "button" | "product" | "video" | "drag" | "cart" | "zoom";

const LABELS: Partial<Record<CursorType, string>> = {
  product: "VIEW",
  video: "PLAY",
  drag: "DRAG",
  cart: "ADD TO CART",
  zoom: "ZOOM",
};

const CURSOR_STYLES: Record<CursorType, string> = {
  default: "w-3 h-3 bg-white/100",
  button:
    "w-8 h-8 border border-purple-400 bg-purple-500/10 backdrop-blur-sm",
  product:
    "w-16 h-16 border border-white/30 bg-white/5 backdrop-blur-md",
  video:
    "w-16 h-16 bg-purple-500/90 border-none",
  drag:
    "w-[72px] h-[72px] border border-white/40 bg-white/5 backdrop-blur-lg",
  cart:
    "w-[86px] h-[86px] bg-purple-500/90 border-none",
  zoom:
    "w-16 h-16 border border-white/30 bg-white/5 backdrop-blur-md",
};

export default function CustomCursor() {
  const [cursorType, setCursorType] = useState<CursorType>("default");
  const [isVisible, setIsVisible] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);
  const pos = useRef({ x: 0, y: 0 });
  const isMoving = useRef(false);
  const stopTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const tick = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      if (isMoving.current) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        rafId.current = 0;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;

      // Determine cursor type
      const target = e.target as HTMLElement;
      const el = target.closest("[data-cursor]");
      if (el) {
        setCursorType((el.getAttribute("data-cursor") || "default") as CursorType);
      } else if (
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a")
      ) {
        setCursorType("button");
      } else {
        setCursorType("default");
      }

      // Sync position on mousemove using RAF, ticking only when mouse is active
      if (!isMoving.current) {
        isMoving.current = true;
        if (!rafId.current) {
          rafId.current = requestAnimationFrame(tick);
        }
      }

      // Suspend ticking 100ms after mouse stops moving to conserve CPU/GPU
      if (stopTimeout.current) clearTimeout(stopTimeout.current);
      stopTimeout.current = setTimeout(() => {
        isMoving.current = false;
      }, 100);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (stopTimeout.current) clearTimeout(stopTimeout.current);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isVisible]);

  const label = LABELS[cursorType];
  const labelDark = cursorType === "video" || cursorType === "cart";

  return (
    <div
      ref={dotRef}
      className={`pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center rounded-full mix-blend-difference transition-[width,height,background,border,backdrop-filter] duration-150 ease-out will-change-transform ${CURSOR_STYLES[cursorType]}`}
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {label && (
        <span
          className={`pointer-events-none text-[10px] font-bold tracking-wider ${labelDark ? "text-black" : "text-white"}`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [cursorType, setCursorType] = useState("default");
  
  const [isVisible, setIsVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Softer, heavier easing for luxury feel
  const springConfig = { damping: 45, stiffness: 120, mass: 1.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement;
      // Traverse up to find data-cursor attribute
      const elementWithCursor = target.closest("[data-cursor]");
      if (elementWithCursor) {
        setCursorType(elementWithCursor.getAttribute("data-cursor") || "default");
      } else if (
        target.tagName.toLowerCase() === "button" ||
        target.tagName.toLowerCase() === "a" ||
        target.closest("button") ||
        target.closest("a")
      ) {
        setCursorType("button");
      } else {
        setCursorType("default");
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouseX, mouseY, isVisible]);

  // Define variants for different cursor states
  const variants = {
    default: {
      width: 12,
      height: 12,
      backgroundColor: "rgba(255, 255, 255, 1)",
      border: "0px solid rgba(255,255,255,0)",
      backdropFilter: "blur(0px)",
      x: "-50%",
      y: "-50%",
      opacity: 1,
    },
    button: {
      width: 32,
      height: 32,
      backgroundColor: "rgba(157, 78, 221, 0.1)",
      border: "1px solid rgba(157, 78, 221, 0.8)",
      backdropFilter: "blur(2px)",
      x: "-50%",
      y: "-50%",
      opacity: 1,
    },
    product: {
      width: 64,
      height: 64,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(6px)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      x: "-50%",
      y: "-50%",
      opacity: 1,
    },
    video: {
      width: 64,
      height: 64,
      backgroundColor: "rgba(157, 78, 221, 0.9)",
      backdropFilter: "blur(0px)",
      border: "none",
      x: "-50%",
      y: "-50%",
      opacity: 1,
      color: "#000",
    },
    drag: {
      width: 72,
      height: 72,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255, 255, 255, 0.4)",
      x: "-50%",
      y: "-50%",
      opacity: 1,
    },
    cart: {
      width: 86,
      height: 86,
      backgroundColor: "rgba(157, 78, 221, 0.9)",
      backdropFilter: "blur(0px)",
      border: "none",
      x: "-50%",
      y: "-50%",
      opacity: 1,
    },
    zoom: {
      width: 64,
      height: 64,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(6px)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      x: "-50%",
      y: "-50%",
      opacity: 1,
    },
  };

  const getCursorText = () => {
    switch (cursorType) {
      case "product":
        return "VIEW";
      case "video":
        return "PLAY";
      case "drag":
        return "DRAG";
      case "cart":
        return "ADD TO CART";
      case "zoom":
        return "ZOOM";
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center rounded-full text-[10px] font-bold tracking-wider mix-blend-difference sm:mix-blend-normal"
      style={{
        left: cursorX,
        top: cursorY,
        opacity: isVisible ? 1 : 0,
      }}
      variants={variants}
      animate={cursorType}
      initial="default"
      transition={{ type: "spring", stiffness: 200, damping: 35, mass: 0.8 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: getCursorText() ? 1 : 0 }}
        className="pointer-events-none"
        style={{ color: (cursorType === "video" || cursorType === "cart") ? "#000" : "#fff", textAlign: "center", lineHeight: "1.2" }}
      >
        {getCursorText()}
      </motion.span>
    </motion.div>
  );
}

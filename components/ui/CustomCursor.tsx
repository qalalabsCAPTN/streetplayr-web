"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [cursorType, setCursorType] = useState("default");
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out the mouse movement
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
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
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [mouseX, mouseY]);

  // Define variants for different cursor states
  const variants = {
    default: {
      width: 16,
      height: 16,
      backgroundColor: "rgba(255, 255, 255, 1)",
      border: "0px solid rgba(255,255,255,0)",
      x: "-50%",
      y: "-50%",
      opacity: 1,
    },
    button: {
      width: 48,
      height: 48,
      backgroundColor: "rgba(212, 255, 30, 0.2)",
      border: "1px solid rgba(212, 255, 30, 1)",
      x: "-50%",
      y: "-50%",
      opacity: 1,
    },
    product: {
      width: 80,
      height: 80,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(4px)",
      border: "1px solid rgba(255, 255, 255, 0.5)",
      x: "-50%",
      y: "-50%",
      opacity: 1,
    },
    video: {
      width: 80,
      height: 80,
      backgroundColor: "rgba(212, 255, 30, 0.9)",
      border: "none",
      x: "-50%",
      y: "-50%",
      opacity: 1,
      color: "#000",
    },
    drag: {
      width: 64,
      height: 64,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      border: "1px solid rgba(255, 255, 255, 0.8)",
      x: "-50%",
      y: "-50%",
      opacity: 1,
    },
  };

  // Text inside the cursor based on type
  const getCursorText = () => {
    switch (cursorType) {
      case "product":
        return "VIEW";
      case "video":
        return "PLAY";
      case "drag":
        return "DRAG";
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center rounded-full text-[10px] font-bold tracking-wider mix-blend-difference sm:mix-blend-normal"
      style={{
        x: cursorX,
        y: cursorY,
      }}
      variants={variants}
      animate={cursorType}
      initial="default"
      transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: getCursorText() ? 1 : 0 }}
        className="pointer-events-none"
        style={{ color: cursorType === "video" ? "#000" : "#fff" }}
      >
        {getCursorText()}
      </motion.span>
    </motion.div>
  );
}

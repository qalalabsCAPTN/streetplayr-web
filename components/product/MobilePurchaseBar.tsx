"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";

export default function MobilePurchaseBar({ price }: { price: string }) {
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    return scrollY.onChange((latest) => {
      // Show bar after scrolling past the hero (roughly 800px or when product info goes out)
      if (latest > 800) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    });
  }, [scrollY]);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: isVisible ? "0%" : "100%" }}
      transition={{ type: "spring", stiffness: 120, damping: 40, mass: 1 }}
      className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-between border-t border-white/5 bg-[#050505]/95 p-3 backdrop-blur-md lg:hidden"
    >
      <div className="flex flex-col">
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/50">
          Total
        </span>
        <span className="font-mono text-sm text-white">{price}</span>
      </div>
      <button
        className="h-10 w-40 bg-[#f5f5f5] font-mono text-[10px] uppercase tracking-widest text-black active:bg-white"
      >
        Add To Cart
      </button>
    </motion.div>
  );
}

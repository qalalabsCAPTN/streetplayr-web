"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import { useCartStore } from "../../store/cartStore";

export default function MobilePurchaseBar({ price, productId, title, image, selectedSize, selectedColor, quantity }: {
  price: string;
  productId?: string;
  title?: string;
  image?: string;
  selectedSize?: string;
  selectedColor?: string;
  quantity?: number;
}) {
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    const priceNum = parseFloat(price.replace(/[^0-9.-]+/g, ""));
    const itemId = productId || title || "unknown";
    const size = selectedSize || "M";
    const color = selectedColor || "Onyx Black";
    const qty = quantity || 1;
    addItem({
      id: `${itemId}-${color}-${size}`,
      productId: itemId,
      name: title || "Product",
      price: priceNum,
      quantity: qty,
      color,
      size,
      image: image || "/assets/placeholder.jpg",
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

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
      transition={{ type: "tween", duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-between bg-gradient-to-t from-[#050505] to-[#050505]/80 px-6 py-6 pb-8 backdrop-blur-xl lg:hidden"
    >
      <div className="flex flex-col">
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
          Value
        </span>
        <span className="font-mono text-sm text-white">{price}</span>
      </div>
      <button
        onClick={handleAddToCart}
        className={`h-12 px-8 font-mono text-[9px] uppercase tracking-[0.3em] transition-colors ${
          isAdded 
            ? "bg-white/10 text-white/60" 
            : "bg-white/5 text-white hover:bg-[var(--sp-accent)] hover:text-black"
        }`}
      >
        {isAdded ? "Secured" : "Acquire"}
      </button>
    </motion.div>
  );
}

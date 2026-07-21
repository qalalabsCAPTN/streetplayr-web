"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import { useCartStore } from "../../store/cartStore";

type VariantInfo = {
  id: string;
  size: string;
  color: string;
  stockQuantity: number;
};

export default function MobilePurchaseBar({ price, productId, title, image, selectedSize, selectedColor, quantity, variants }: {
  price: string;
  productId?: string;
  title?: string;
  image?: string;
  selectedSize?: string;
  selectedColor?: string;
  quantity?: number;
  variants?: VariantInfo[];
}) {
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    const priceNum = parseFloat(price.replace(/[^0-9.-]+/g, ""));
    const size = selectedSize || "M";
    const color = selectedColor || "Onyx Black";
    const qty = quantity || 1;

    const matchingVariant = variants?.find(v => v.size === size);

    // Client-side stock check
    if (!matchingVariant || matchingVariant.stockQuantity < qty) {
      return;
    }

    const variantId = matchingVariant.id;

    addItem({
      id: variantId,
      productId: productId || variantId,
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
      const visible = latest > 800;
      setIsVisible((prev) => {
        if (prev === visible) return prev;
        return visible;
      });
    });
  }, [scrollY]);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: isVisible ? "0%" : "100%" }}
      transition={{ type: "tween", duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-[92px] left-4 right-4 z-40 flex items-center justify-between gap-4 rounded-full bg-gradient-to-t from-[#16111b] to-[#16111b]/90 px-6 py-4 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] lg:hidden"
    >
      <div className="flex flex-col">
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
          Value
        </span>
        <span className="font-mono text-sm text-white">{price}</span>
      </div>
      <button
        onClick={handleAddToCart}
        className={`rounded-full h-10 px-6 font-mono text-[9px] uppercase tracking-[0.3em] transition-colors ${
          isAdded 
            ? "bg-white/10 text-white/60" 
            : "bg-white/5 text-white hover:bg-[#ddb7ff] hover:text-[#16111b]"
        }`}
      >
        {isAdded ? "Secured" : "Acquire"}
      </button>
    </motion.div>
  );
}

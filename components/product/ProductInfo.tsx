"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import ColorSelector from "./ColorSelector";
import SizeSelector from "./SizeSelector";
import QuantitySelector from "./QuantitySelector";
import { useCartStore } from "../../store/cartStore";

type ProductInfoProps = {
  title: string;
  tagline: string;
  price: string;
  description: string;
  dropMetadata: {
    dropNumber: string;
    releaseType: string;
    fabricDetails: string;
    gsmInfo: string;
  };
  fitIntelligence: {
    modelInfo: string;
    fitType: string;
    trueToSize: boolean;
  };
  colors: { id: string; name: string; hex: string }[];
  sizes: string[];
};

export default function ProductInfo({
  title,
  tagline,
  price,
  description,
  dropMetadata,
  fitIntelligence,
  colors,
  sizes,
}: ProductInfoProps) {
  const [selectedColor, setSelectedColor] = useState(colors[0]?.id);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a size.");
      return;
    }

    const priceNum = parseFloat(price.replace(/[^0-9.-]+/g, ""));
    const colorName = colors.find(c => c.id === selectedColor)?.name || selectedColor;

    addItem({
      id: `${title}-${selectedColor}-${selectedSize}`,
      productId: title,
      name: title,
      price: priceNum,
      quantity,
      color: colorName,
      size: selectedSize,
      image: "/assets/srh-jersey.jpg", // Using main mock image for now
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-32 flex flex-col gap-10 lg:gap-16"
    >
      {/* Drop Metadata */}
      <div className="flex flex-wrap items-center gap-4 opacity-60">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--sp-accent)]">
          {dropMetadata.dropNumber}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          // {dropMetadata.releaseType}
        </span>
      </div>

      {/* Header */}
      <div className="space-y-6">
        <h1 className="font-display text-6xl uppercase leading-[0.8] tracking-wide text-white md:text-7xl lg:text-[7rem]">
          {title.split(' ').map((word, i) => (
            <span key={i} className="block">{word}</span>
          ))}
        </h1>
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-white/40">
          {tagline}
        </p>
        <div className="pt-6 font-mono text-xl text-white/90">{price}</div>
      </div>

      {/* Description */}
      <div className="max-w-md pr-8">
        <p className="text-base leading-loose text-white/60">
          {description}
        </p>
      </div>

      {/* Selectors */}
      <div className="space-y-8">
        <ColorSelector
          colors={colors}
          selectedColorId={selectedColor}
          onSelect={setSelectedColor}
        />
        <SizeSelector
          sizes={sizes}
          selectedSize={selectedSize}
          onSelect={setSelectedSize}
          fitIntelligence={fitIntelligence.modelInfo}
          fitType={fitIntelligence.fitType}
          trueToSize={fitIntelligence.trueToSize}
        />
        <div className="space-y-3">
          <span className="block font-mono text-[11px] uppercase tracking-widest text-white/60">
            Quantity
          </span>
          <QuantitySelector
            quantity={quantity}
            onIncrease={() => setQuantity((prev) => prev + 1)}
            onDecrease={() => setQuantity((prev) => Math.max(1, prev - 1))}
          />
        </div>
      </div>

      {/* Fabric Drop Meta */}
      <div className="flex gap-12 border-t border-white/5 pt-8 mt-4">
        <div className="space-y-2">
          <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
            Fabric
          </span>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-white/60">
            {dropMetadata.fabricDetails}
          </span>
        </div>
        <div className="space-y-2">
          <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
            Weight
          </span>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-white/60">
            {dropMetadata.gsmInfo}
          </span>
        </div>
      </div>

      {/* Desktop Add to Cart CTA */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleAddToCart}
        className={`hidden h-16 w-full items-center justify-center font-mono text-xs uppercase tracking-[0.2em] transition-colors lg:flex ${
          isAdded 
            ? "bg-white/20 text-white" 
            : "bg-white text-black hover:bg-[var(--sp-accent)]"
        }`}
        data-cursor="cart"
      >
        {isAdded ? "Secured" : "Acquire"}
      </motion.button>
    </motion.div>
  );
}

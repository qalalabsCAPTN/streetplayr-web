"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import ColorSelector from "./ColorSelector";
import SizeSelector from "./SizeSelector";
import QuantitySelector from "./QuantitySelector";

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

  return (
    <div className="sticky top-24 flex flex-col gap-10 lg:gap-14">
      {/* Drop Metadata */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="border border-[var(--sp-accent)] bg-black/50 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-[var(--sp-accent)]">
          {dropMetadata.dropNumber}
        </span>
        <span className="bg-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
          {dropMetadata.releaseType}
        </span>
      </div>

      {/* Header */}
      <div className="space-y-4">
        <h1 className="font-display text-5xl uppercase leading-[0.85] tracking-wide text-white lg:text-7xl">
          {title}
        </h1>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/50">
          {tagline}
        </p>
        <div className="pt-4 font-mono text-lg text-white">{price}</div>
      </div>

      {/* Description */}
      <div className="max-w-md">
        <p className="text-sm leading-relaxed text-white/70">
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
      <div className="flex gap-8 border-y border-white/10 py-6">
        <div className="space-y-1">
          <span className="block font-mono text-[9px] uppercase tracking-widest text-white/40">
            Fabric
          </span>
          <span className="block font-mono text-[11px] uppercase tracking-wider text-white">
            {dropMetadata.fabricDetails}
          </span>
        </div>
        <div className="space-y-1">
          <span className="block font-mono text-[9px] uppercase tracking-widest text-white/40">
            Weight
          </span>
          <span className="block font-mono text-[11px] uppercase tracking-wider text-white">
            {dropMetadata.gsmInfo}
          </span>
        </div>
      </div>

      {/* Desktop Add to Cart CTA */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="hidden h-16 w-full items-center justify-center bg-white font-mono text-sm uppercase tracking-widest text-black transition-colors hover:bg-[var(--sp-accent)] lg:flex"
        data-cursor="cart"
      >
        Add To Cart
      </motion.button>
    </div>
  );
}

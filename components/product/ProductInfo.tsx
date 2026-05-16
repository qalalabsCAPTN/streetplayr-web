"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import ColorSelector from "./ColorSelector";
import SizeSelector from "./SizeSelector";
import QuantitySelector from "./QuantitySelector";
import { useCartStore } from "../../store/cartStore";

type VariantInfo = {
  id: string;
  size: string;
  color: string;
  stockQuantity: number;
};

type ProductInfoProps = {
  productId: string;
  title: string;
  price: string;
  description: string;
  points: string;
  colors: { id: string; name: string; hex: string }[];
  sizes: string[];
  variants: VariantInfo[];
  image: string;
  selectedColor?: string;
  selectedSize?: string;
  quantity?: number;
  onColorSelect?: (id: string) => void;
  onSizeSelect?: (size: string) => void;
  onQuantityChange?: (qty: number) => void;
};

export default function ProductInfo({
  productId,
  title,
  price,
  description,
  points,
  colors,
  sizes,
  variants,
  image,
  selectedColor: controlledColor,
  selectedSize: controlledSize,
  quantity: controlledQuantity,
  onColorSelect,
  onSizeSelect,
  onQuantityChange,
}: ProductInfoProps) {
  const [localColor, setLocalColor] = useState(colors[0]?.id);
  const [localSize, setLocalSize] = useState("");
  const [localQuantity, setLocalQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const selectedColor = controlledColor ?? localColor;
  const selectedSize = controlledSize ?? localSize;
  const quantity = controlledQuantity ?? localQuantity;

  const handleColorSelect = (id: string) => {
    if (onColorSelect) onColorSelect(id);
    else setLocalColor(id);
  };

  const handleSizeSelect = (size: string) => {
    if (onSizeSelect) onSizeSelect(size);
    else setLocalSize(size);
  };

  const handleQuantityChange = (qty: number) => {
    if (onQuantityChange) onQuantityChange(qty);
    else setLocalQuantity(qty);
  };

  const handleIncrease = () => handleQuantityChange(quantity + 1);
  const handleDecrease = () => handleQuantityChange(Math.max(1, quantity - 1));

  const handleAddToCart = async () => {
    if (!selectedSize) {
      alert("Please select a size.");
      return;
    }

    // Find matching variant and validate stock
    const colorName = colors.find(c => c.id === selectedColor)?.name || selectedColor;
    const matchingVariant = variants.find(v => v.size === selectedSize);

    if (!matchingVariant) {
      alert('Selected size is not available. Please choose another size.');
      return;
    }

    const variantId = matchingVariant.id;
    const variantStock = matchingVariant.stockQuantity;

    if (variantStock < quantity) {
      alert(`Insufficient stock. Only ${variantStock} available.`);
      return;
    }

    // Cross-check with server-side available stock for extra safety
    try {
      const { getVariantStockAction } = await import('@/app/actions/stock');
      const stockResult = await getVariantStockAction(variantId);
      if (stockResult.success && stockResult.data && stockResult.data.available < quantity) {
        alert(`Insufficient stock. Only ${stockResult.data.available} available.`);
        return;
      }
    } catch {}

    const priceNum = parseFloat(price.replace(/[^0-9.-]+/g, ""));

    addItem({
      id: variantId,
      productId,
      name: title,
      price: priceNum,
      quantity,
      color: colorName,
      size: selectedSize,
      image: image || "/assets/placeholder.jpg",
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
      {/* Header */}
      <div className="space-y-6">
        <h1 className="font-display text-6xl uppercase leading-[0.8] tracking-wide text-white md:text-7xl lg:text-[7rem]">
          {title.split(' ').map((word, i) => (
            <span key={i} className="block">{word}</span>
          ))}
        </h1>
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
          onSelect={handleColorSelect}
        />
        <SizeSelector
          sizes={sizes}
          selectedSize={selectedSize}
          onSelect={handleSizeSelect}
        />
        <div className="space-y-3">
          <QuantitySelector
            quantity={quantity}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
          />
        </div>
      </div>

      {/* Trust Signals */}
      <div className="trust-signals">
        <div className="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <span>Free Shipping Over 5000</span>
        </div>
        <div className="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Authentic Limited Edition</span>
        </div>
        <div className="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 20h20" />
            <path d="M4 16l4-12 4 12" />
            <path d="M16 16l4-6 4 6" />
          </svg>
          <span>Earn {points} Points</span>
        </div>
      </div>

      {/* Desktop Add to Cart CTA */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleAddToCart}
        className={`hidden h-16 w-full items-center justify-center rounded-xl font-mono text-xs uppercase tracking-[0.2em] transition-colors lg:flex ${
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

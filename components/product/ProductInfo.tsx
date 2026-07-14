"use client";

import { useState } from "react";
import { useCartStore } from "../../store/cartStore";
import dynamic from "next/dynamic";

const AITryOn = dynamic(() => import("./AITryOn"), { ssr: false });

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
  // points,
  colors,
  sizes,
  variants,
  image,
  selectedColor: controlledColor,
  selectedSize: controlledSize,
  quantity: controlledQuantity,
  // onColorSelect,
  onSizeSelect,
  // onQuantityChange,
}: ProductInfoProps) {
  const [localSize, setLocalSize] = useState("");
  const [isAdded, setIsAdded] = useState(false);
  const [expandedSpec, setExpandedSpec] = useState<string | null>(null);
  const [spCredits, setSpCredits] = useState(500);
  const addItem = useCartStore((state) => state.addItem);

  const selectedSize = controlledSize ?? localSize;
  const priceNum = parseFloat(price.replace(/[^0-9.-]+/g, ""));
  const selectedStock = selectedSize
    ? variants.filter((v) => v.size === selectedSize).reduce((sum, v) => sum + v.stockQuantity, 0)
    : 0;
  const isLowStock = selectedSize ? selectedStock > 0 && selectedStock <= 10 : false;

  const handleSizeSelect = (size: string) => {
    if (onSizeSelect) onSizeSelect(size);
    else setLocalSize(size);
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      alert("Please select a size.");
      return;
    }

    const colorName = colors.find((c) => c.id === controlledColor)?.name || controlledColor || "Onyx Black";
    const matchingVariant = variants.find((v) => v.size === selectedSize);

    if (!matchingVariant) {
      alert("Selected size is not available. Please choose another size.");
      return;
    }

    const variantId = matchingVariant.id;
    const variantStock = matchingVariant.stockQuantity;
    const qty = controlledQuantity ?? 1;

    if (variantStock < qty) {
      alert(`Insufficient stock. Only ${variantStock} available.`);
      return;
    }

    try {
      const { getVariantStockAction } = await import("@/app/actions/stock");
      const stockResult = await getVariantStockAction(variantId);
      if (stockResult.success && stockResult.data && stockResult.data.available < qty) {
        alert(`Insufficient stock. Only ${stockResult.data.available} available.`);
        return;
      }
    } catch {}

    addItem({
      id: variantId,
      productId,
      name: title,
      price: priceNum,
      quantity: qty,
      color: colorName,
      size: selectedSize,
      image: image || "/assets/placeholder.jpg",
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="bg-[#1f1a23] border border-white/[0.10] p-8 shadow-[0_28px_72px_-20px_rgba(0,0,0,0.6)]">
      <div className="space-y-8">
        {/* Pricing */}
        <div>
          <p className="font-display text-[56px] text-white tracking-tight leading-none">{price}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[rgba(234,223,237,0.62)] font-medium mt-1">Limited Release</p>
          {isLowStock && (
            <div className="mt-5 pt-4 border-t border-white/[0.06]">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[rgba(234,223,237,0.65)] font-medium">
                Only {selectedStock} units remaining
              </p>
            </div>
          )}
        </div>


        {/* Sizing */}
        <div>
          <div className="flex justify-between mb-4">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-[rgba(234,223,237,0.65)] font-medium">Select Size</label>
            <button className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/60 hover:text-white/80 transition-colors underline underline-offset-4">Size Guide</button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {sizes.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  className={`py-3.5 font-mono text-xs transition-all ${
                    isSelected
                      ? "border border-white/80 bg-white/5 text-white"
                      : "border border-white/[0.14] hover:border-white/35 hover:bg-white/[0.04] text-white/65"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Credits */}
        <div className="p-5 bg-[#16111b] border border-white/[0.06]">
          <div className="flex justify-between items-center mb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[rgba(234,223,237,0.65)] font-medium">Member Credits</span>
            <span className="font-mono text-[10px] font-medium text-white/75">{spCredits} / 2500</span>
          </div>
          <input
            type="range"
            min="0"
            max="2500"
            value={spCredits}
            onChange={(e) => setSpCredits(Number(e.target.value))}
            className="w-full h-[3px] bg-white/[0.08] appearance-none cursor-pointer accent-white/80 rounded-none"
          />
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleAddToCart}
            className="rounded-none bg-white text-black font-semibold py-5 hover:bg-[#ddb7ff] hover:text-[#16111b] transition-all flex items-center justify-center uppercase font-mono text-xs tracking-[0.2em]"
          >
            {isAdded ? "Added" : "Add To Cart"}
          </button>
        </div>

        {/* AI Try-On */}
        <AITryOn
          productImageUrl={image}
          productTitle={title}
        />

        {/* Accordion */}
        <div className="border-t border-white/[0.06] pt-2">
          {[
            { id: "details", label: "Product Details", content: description || "Tri-layer GORE-TEX membrane with liquid-chrome finish. Reinforced 500D Cordura panels." },
            { id: "shipping", label: "Delivery & Returns", content: "Standard delivery: 5-7 business days. Express: 2-3 business days. International shipping available." },
            { id: "care", label: "Care Instructions", content: "Machine wash cold, gentle cycle. Hang to dry. Do not bleach, iron, or dry clean." },
          ].map((spec) => (
            <div key={spec.id} className="border-b border-white/[0.06]">
              <button
                onClick={() => setExpandedSpec(expandedSpec === spec.id ? null : spec.id)}
                className="w-full flex justify-between items-center py-5 font-mono text-[10px] uppercase tracking-[0.15em] font-medium text-white/60 hover:text-white/85 transition-colors"
              >
                <span>{spec.label}</span>
                <span className="font-mono text-xs transition-opacity duration-300">
                  {expandedSpec === spec.id ? "[-]" : "[+]"}
                </span>
              </button>
              {expandedSpec === spec.id && (
                <div className="pb-6 text-white/70 text-xs leading-relaxed pr-8">
                  {spec.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

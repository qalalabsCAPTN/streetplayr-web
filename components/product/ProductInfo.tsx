"use client";

import { useState } from "react";
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

function getStockForSize(variants: VariantInfo[], size: string): number {
  return variants
    .filter((v) => v.size === size)
    .reduce((sum, v) => sum + v.stockQuantity, 0);
}

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
  const [localSize, setLocalSize] = useState("");
  const [isAdded, setIsAdded] = useState(false);
  const [expandedSpec, setExpandedSpec] = useState<string | null>(null);
  const [spCredits, setSpCredits] = useState(500);
  const addItem = useCartStore((state) => state.addItem);

  const selectedSize = controlledSize ?? localSize;
  const priceNum = parseFloat(price.replace(/[^0-9.-]+/g, ""));
  const ethPrice = (priceNum * 0.00045).toFixed(4);

  const selectedStock = selectedSize ? getStockForSize(variants, selectedSize) : 0;
  const totalStock = Math.max(...sizes.map((s) => getStockForSize(variants, s)));
  const lowStockThreshold = 10;
  const isLowStock = selectedStock > 0 && selectedStock <= lowStockThreshold;

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
    <div className="bg-[var(--surface-container-low)] border-l border-white/10 p-8">
      <div className="space-y-8">
        {/* Pricing & Metadata */}
        <div>
          <div className="flex justify-between items-start mb-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">UNIT_VALUATION</span>
            <p className="font-mono text-[10px] text-white/40">35.6895° N, 139.6917° E</p>
          </div>
          <div className="flex justify-between items-baseline mb-4">
            <p className="font-display text-5xl text-white">{price}</p>
            <p className="font-mono text-xs text-[var(--sp-accent)]">~ {ethPrice} ETH</p>
          </div>
          <div className="flex items-center gap-3 py-3 border-y border-white/10">
            <span className="material-symbols-outlined text-[var(--sp-accent)] animate-pulse text-sm">warning</span>
            <p className="font-mono text-[10px] uppercase text-[var(--sp-accent)]">
              {isLowStock
                ? `Stock Protocol Critical: ${selectedStock} units remaining`
                : `Stock Protocol Active: ${totalStock}+ units`}
            </p>
          </div>
        </div>

        {/* Color Selector */}
        {colors.length > 0 && (
          <div>
            <label className="font-mono text-xs text-white/40 uppercase mb-4 block">Colorway</label>
            <div className="flex flex-wrap gap-3">
              {colors.map((color) => {
                const isSelected = (controlledColor ?? colors[0]?.id) === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => onColorSelect?.(color.id)}
                    className="group relative flex h-10 w-10 items-center justify-center border transition-colors duration-300"
                    style={{
                      borderColor: isSelected ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.2)",
                    }}
                    aria-label={`Select color ${color.name}`}
                  >
                    <span
                      className="h-[80%] w-[80%] transition-transform duration-300 group-hover:scale-90"
                      style={{ backgroundColor: color.hex }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sizing */}
        <div>
          <div className="flex justify-between mb-4">
            <label className="font-mono text-xs text-white/40 uppercase">Matrix_Sizing</label>
            <button className="font-mono text-[10px] text-white underline underline-offset-4 uppercase">GUIDE</button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {sizes.map((size) => {
              const stock = getStockForSize(variants, size);
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  className={`py-3 font-mono text-xs transition-all flex flex-col items-center ${
                    isSelected
                      ? "border-2 border-white bg-white/5 text-white"
                      : "border border-white/20 hover:bg-white/10 text-white/60"
                  }`}
                >
                  <span>{size}</span>
                  <span className="text-[8px] opacity-50">LTD: {stock}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SP Credits */}
        <div className="p-4 bg-[var(--surface-container-lowest)] border border-white/10">
          <div className="flex justify-between mb-2">
            <span className="font-mono text-[10px] uppercase text-white/40">SP_CREDITS_APPLIED</span>
            <span className="font-mono text-[10px] text-white">{spCredits} / 2500</span>
          </div>
          <input
            type="range"
            min="0"
            max="2500"
            value={spCredits}
            onChange={(e) => setSpCredits(Number(e.target.value))}
            className="w-full h-1 bg-white/20 appearance-none cursor-pointer accent-white"
          />
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleAddToCart}
            className="bg-white text-black font-bold py-4 hover:bg-[var(--sp-accent)] hover:shadow-[0_0_20px_rgba(255,183,77,0.4)] transition-all flex items-center justify-center gap-3 group uppercase font-mono text-xs tracking-widest"
          >
            {isAdded ? "SECURED" : "INITIALIZE_PURCHASE"}
            {!isAdded && (
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">bolt</span>
            )}
          </button>
          <button className="border border-white/20 text-white font-mono text-[10px] uppercase tracking-[0.3em] py-3 hover:bg-white/10 transition-colors flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-sm">center_focus_strong</span>
            AI_VIRTUAL_TRY_ON
          </button>
        </div>

        {/* Technical Specs — Accordion */}
        <div className="border-t border-white/10 pt-2">
          {[
            { id: "material", label: "[01] MATERIAL_COMPOSITION", content: description || "Tri-layer GORE-TEX membrane with liquid-chrome finish. Reinforced 500D Cordura panels." },
            { id: "shipping", label: "[02] SHIP_LOGISTICS", content: "Standard delivery: 5-7 business days. Express: 2-3 business days. International shipping available." },
            { id: "care", label: "[03] CARE_INSTRUCTIONS", content: "Machine wash cold, gentle cycle. Hang to dry. Do not bleach, iron, or dry clean." },
          ].map((spec) => (
            <div key={spec.id} className="border-b border-white/10">
              <button
                onClick={() => setExpandedSpec(expandedSpec === spec.id ? null : spec.id)}
                className="w-full flex justify-between items-center py-4 font-mono text-[10px] uppercase text-white/40 hover:text-white transition-colors"
              >
                <span>{spec.label}</span>
                <span className="material-symbols-outlined text-sm transition-transform duration-300"
                  style={{ transform: expandedSpec === spec.id ? "rotate(45deg)" : "rotate(0)" }}
                >
                  add
                </span>
              </button>
              {expandedSpec === spec.id && (
                <div className="pb-4 text-white/60 text-xs leading-relaxed">
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

"use client";

import { useState, useEffect } from "react";
import { RealtimeSubscriptions } from "@/lib/realtime/subscriptions";
import ProductInfo from "@/components/product/ProductInfo";
import ProductGallery from "@/components/product/ProductGallery";

type Color = { id: string; name: string; hex: string };

type VariantInfo = {
  id: string;
  size: string;
  color: string;
  stockQuantity: number;
};

type ProductDetailClientProps = {
  productId: string;
  title: string;
  price: string;
  description: string;
  points: string;
  image: string;
  images: string[];
  colors: Color[];
  sizes: string[];
  variants: VariantInfo[];
};

export default function ProductDetailClient(props: ProductDetailClientProps) {
  const [selectedColor, setSelectedColor] = useState(props.colors[0]?.id);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [liveStock, setLiveStock] = useState<Record<string, number>>({});

  const colorName =
    props.colors.find((c) => c.id === selectedColor)?.name || selectedColor;

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    for (const v of props.variants) {
      try {
        const unsub = RealtimeSubscriptions.subscribeToStock(v.id, (stock: number) => {
          setLiveStock(prev => ({ ...prev, [v.id]: stock }));
        });
        unsubs.push(unsub);
      } catch {}
    }
    return () => unsubs.forEach(fn => fn());
  }, [props.variants]);

  const liveVariants = props.variants.map(v => ({
    ...v,
    stockQuantity: liveStock[v.id] ?? v.stockQuantity,
  }));

  return (
    <main className="pt-24">
      <div className="flex flex-col lg:flex-row w-full">
        {/* Gallery — Left 2/3 (Sticky on desktop) */}
        <div className="lg:w-2/3 lg:sticky lg:top-24 lg:self-start lg:h-[calc(100vh-96px)]">
          <ProductGallery
            images={props.images}
            title={props.title}
            heroImage={props.image}
          />
        </div>

        {/* Product Info — Right 1/3 (Scrolls with page) */}
        <div className="lg:w-1/3">
          <ProductInfo
            productId={props.productId}
            title={props.title}
            price={props.price}
            description={props.description}
            points={props.points}
            colors={props.colors}
            sizes={props.sizes}
            variants={liveVariants}
            image={props.image}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            quantity={quantity}
            onColorSelect={setSelectedColor}
            onSizeSelect={setSelectedSize}
            onQuantityChange={setQuantity}
          />
        </div>
      </div>
    </main>
  );
}

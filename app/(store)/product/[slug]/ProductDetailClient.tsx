"use client";

import { useState, useEffect } from "react";
import { RealtimeSubscriptions } from "@/lib/realtime/subscriptions";
import ProductInfo from "@/components/product/ProductInfo";
import MobilePurchaseBar from "@/components/product/MobilePurchaseBar";
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

  // Subscribe to realtime stock updates for the product's variants
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

  // Merge live stock into variant data
  const liveVariants = props.variants.map(v => ({
    ...v,
    stockQuantity: liveStock[v.id] ?? v.stockQuantity,
  }));

  return (
    <>
      <div className="relative pt-24 md:pt-32">
        <div className="mx-auto max-w-[1800px] px-0 md:px-8 lg:px-12">
          <div className="flex flex-col-reverse lg:flex-row lg:items-end lg:gap-0">
            <div className="relative z-20 w-full px-6 pb-24 pt-12 lg:sticky lg:bottom-12 lg:w-[45%] lg:px-0 lg:pb-12 lg:-mr-12 xl:-mr-24">
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

            <div className="relative z-10 w-full lg:w-[55%]">
              <ProductGallery images={props.images} />
            </div>
          </div>
        </div>
      </div>

      <MobilePurchaseBar
        price={props.price}
        productId={props.productId}
        title={props.title}
        image={props.image}
        selectedSize={selectedSize}
        selectedColor={colorName}
        quantity={quantity}
        variants={liveVariants}
      />
    </>
  );
}

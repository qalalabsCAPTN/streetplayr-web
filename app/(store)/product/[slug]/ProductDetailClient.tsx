"use client";

import { useState } from "react";
import ProductInfo from "@/components/product/ProductInfo";
import MobilePurchaseBar from "@/components/product/MobilePurchaseBar";
import ProductGallery from "@/components/product/ProductGallery";

type DropMetadata = {
  dropNumber: string;
  releaseType: string;
  fabricDetails: string;
  gsmInfo: string;
};

type FitIntelligence = {
  modelInfo: string;
  fitType: string;
  trueToSize: boolean;
};

type Color = { id: string; name: string; hex: string };

type ProductDetailClientProps = {
  productId: string;
  title: string;
  tagline: string;
  price: string;
  description: string;
  image: string;
  images: string[];
  dropMetadata: DropMetadata;
  fitIntelligence: FitIntelligence;
  colors: Color[];
  sizes: string[];
};

export default function ProductDetailClient(props: ProductDetailClientProps) {
  const [selectedColor, setSelectedColor] = useState(props.colors[0]?.id);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  const colorName =
    props.colors.find((c) => c.id === selectedColor)?.name || selectedColor;

  return (
    <>
      <div className="relative pt-24 md:pt-32">
        <div className="mx-auto max-w-[1800px] px-0 md:px-8 lg:px-12">
          <div className="flex flex-col-reverse lg:flex-row lg:items-end lg:gap-0">
            <div className="relative z-20 w-full px-6 pb-24 pt-12 lg:sticky lg:bottom-12 lg:w-[45%] lg:px-0 lg:pb-12 lg:-mr-12 xl:-mr-24">
              <ProductInfo
                productId={props.productId}
                title={props.title}
                tagline={props.tagline}
                price={props.price}
                description={props.description}
                dropMetadata={props.dropMetadata}
                fitIntelligence={props.fitIntelligence}
                colors={props.colors}
                sizes={props.sizes}
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
      />
    </>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";

interface Product {
  id: string | number;
  name: string;
  price: string | number;
  image: string;
  slug?: string;
  category?: string;
}

interface ProductCarouselProps {
  products: Product[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: false,
    skipSnaps: false,
    dragFree: false,
    loop: true,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!products.length) return null;

  return (
    <div className="w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex" style={{ marginLeft: "-10px" }}>
          {products.map((product, index) => {
            const isActive = index === selectedIndex;
            return (
              <div
                key={product.id}
                style={{
                  flex: "0 0 65%",
                  minWidth: 0,
                  paddingLeft: "10px",
                  transition: "transform 0.4s ease, opacity 0.4s ease",
                  transform: isActive ? "scale(1)" : "scale(0.88)",
                  opacity: isActive ? 1 : 0.55,
                  willChange: "transform, opacity",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <Link
                  href={product.slug ? `/product/${product.slug}` : "/collections"}
                  className="group relative block aspect-[4/5] bg-[#231e27] overflow-hidden"
                  style={{ borderRadius: 16 }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover saturate-[0.92]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#16111b]/90 via-[#16111b]/15 to-transparent p-6">
                    <h3 className="font-display text-[22px] uppercase leading-none text-[#eadfed]">
                      {product.name}
                    </h3>
                    <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(234,223,237,0.64)]">
                      {typeof product.price === "number"
                        ? `Rs. ${product.price}`
                        : product.price}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

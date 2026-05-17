"use client";

import { motion, Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export interface ProductMockData {
  id: string;
  slug: string;
  title: string;
  price: string;
  image1: string;
  image2: string;
  category: string;
  metadata: {
    drop: string;
    fabric: string;
  };
  layoutType: "tall" | "square" | "landscape";
}

interface ProductCardProps {
  product: ProductMockData;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Staggered reveal based on index
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  // Assign aspect ratios based on layoutType to create the editorial asymmetry
  const aspectClass = 
    product.layoutType === "tall" ? "aspect-[3/4] md:aspect-[2/3]" : 
    product.layoutType === "landscape" ? "aspect-[4/3] md:aspect-[16/9]" : 
    "aspect-square";

  return (
    <motion.div
      variants={itemVariants}
      className="group relative flex flex-col gap-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.slug}`} className="block w-full outline-none">
        <div 
          className={`relative w-full overflow-hidden bg-[#111111] border border-white/[0.08] ${aspectClass}`}
          data-cursor="product"
        >
          {/* Default Image */}
          <Image
            src={product.image1}
            alt={product.title}
            fill
            priority={index < 2}
            className={`object-cover transition-transform duration-[2s] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isHovered ? "scale-[1.025]" : "scale-100"
            }`}
          />
          
          {/* Hover Reveal Image */}
          <div
            className={`absolute inset-0 transition-opacity duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={product.image2}
              alt={`${product.title} Alternate View`}
              fill
              className="object-cover"
            />
          </div>

          {/* metadata/subtext removed */}
        </div>
      </Link>

      {/* Product Info: Mobile recomposed for breathing room */}
      <div className="flex flex-col gap-2 px-1 mt-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-0">
          <Link href={`/product/${product.slug}`} className="outline-none">
            <h3 className="font-body text-base font-medium leading-relaxed text-white transition-colors duration-300 group-hover:text-white/60 md:text-lg">
              {product.title}
            </h3>
          </Link>
          <span className="font-mono text-[11px] tracking-[0.16em] text-white/55">
            {product.price}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

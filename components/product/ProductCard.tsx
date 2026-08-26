"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export type Product = {
  name: string;
  category: string;
  price: string;
  spPrice?: string;
  image: string;
  imageAlt: string;
  badge?: string;
  href: string;
  sizes: string[];
  hot?: boolean;
};

type ProductCardProps = {
  product: Product;
  className?: string;
  featured?: boolean;
  priority?: boolean;
};

export default function ProductCard({
  product,
  className = "",
  featured = false,
  priority = false,
}: ProductCardProps) {
  return (
    <motion.article
      className={`group relative overflow-hidden border border-white/[0.08] bg-[#0c0c0c] shadow-[0_18px_60px_rgba(0,0,0,0.35)] rounded-xl ${className}`}
      transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
      whileHover={{ y: -4 }}
    >
      <Link aria-label={`View ${product.name}`} className="block" href={product.href}>
        <div
          className={`relative overflow-hidden bg-black ${
            featured ? "aspect-[4/5] md:aspect-[7/6]" : "aspect-[3/4]"
          }`}
        >
          <Image
            alt={product.imageAlt}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
            fill
            priority={priority}
            sizes={
              featured
                ? "(min-width: 1024px) 58vw, 100vw"
                : "(min-width: 1024px) 25vw, 50vw"
            }
            src={product.image}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/[0.74] via-black/10 to-transparent opacity-[0.88] transition-opacity duration-300 group-hover:opacity-70" />
        </div>

        <div className="p-4">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-price">{product.price}</p>
        </div>
      </Link>
    </motion.article>
  );
}

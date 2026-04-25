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
      className={`group relative overflow-hidden border border-white/10 bg-[var(--sp-bg-surface)] ${className}`}
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
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]"
            fill
            priority={priority}
            sizes={
              featured
                ? "(min-width: 1024px) 58vw, 100vw"
                : "(min-width: 1024px) 25vw, 50vw"
            }
            src={product.image}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/[0.78] via-black/10 to-transparent opacity-[0.88] transition-opacity duration-300 group-hover:opacity-70" />

          <div className="absolute left-3 top-3 flex gap-2">
            {product.badge ? (
              <span className="bg-[var(--sp-accent)] px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-black">
                {product.badge}
              </span>
            ) : null}
            {product.hot ? (
              <span className="border border-[var(--sp-accent)] bg-black/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--sp-accent)]">
                Hot
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">
                {product.category}
              </p>
              <h3 className="mt-1 font-display text-2xl leading-none tracking-[0.09em] text-white sm:text-3xl">
                {product.name}
              </h3>
            </div>
            <p
              aria-label={`Price: ${product.price}${
                product.spPrice ? `. Street PlayR points price: ${product.spPrice}` : ""
              }`}
              className="shrink-0 text-right font-semibold"
            >
              <span className="block text-sm text-white">{product.price}</span>
              {product.spPrice ? (
                <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--sp-accent)]">
                  {product.spPrice}
                </span>
              ) : null}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
            {product.sizes.map((size, index) => (
              <span
                className={`h-1.5 w-5 rounded-full ${
                  index < 3 ? "bg-white/70" : "bg-white/20"
                }`}
                key={size}
              />
            ))}
          </div>
        </div>
      </Link>

      <button
        aria-label={`Quick add ${product.name}`}
        className="absolute bottom-[104px] right-4 grid h-11 w-11 translate-y-3 place-items-center border border-white/25 bg-black/80 text-xl leading-none opacity-0 backdrop-blur transition-all duration-200 hover:border-white hover:bg-white hover:text-black group-hover:translate-y-0 group-hover:opacity-100"
        type="button"
      >
        +
      </button>
    </motion.article>
  );
}

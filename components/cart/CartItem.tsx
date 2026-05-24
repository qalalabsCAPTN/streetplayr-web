"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCartStore, CartItem as CartItemType } from "../../store/cartStore";
import { formatPrice, formatProductTitle } from "@/lib/utils/format";

interface CartItemProps {
  item: CartItemType;
  index?: number;
}

export default function CartItem({ item, index = 0 }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: index * 0.12 }}
    >
      <div className="group relative flex gap-3 md:gap-4 p-3 md:p-5 bg-[#1f1a23] border border-white/[0.08] hover:border-[#ddb7ff] transition-all duration-500 rounded-xl">
        {/* Image */}
        <Link
          href={`/product/${item.productId}`}
          className="w-[88px] md:w-48 shrink-0 self-start aspect-square md:aspect-[4/5] bg-[#231e27] overflow-hidden"
        >
          <Image
            src={item.image || "/images/placeholder.jpg"}
            alt={item.name}
            width={300}
            height={375}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        </Link>

        {/* Details */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Title + Price */}
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-display text-sm md:text-3xl lg:text-4xl uppercase tracking-wide text-[#eadfed] leading-tight min-w-0">
              <Link href={`/product/${item.productId}`} className="hover:text-white/70 transition-colors duration-300">
                {formatProductTitle(item.name)}
              </Link>
            </h3>
            <span className="shrink-0 font-display text-sm md:text-2xl lg:text-3xl tracking-wide text-[#eadfed] tabular-nums">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 md:gap-2 mt-0.5 md:mt-3 mb-0 md:mb-5">
            <span className="px-1.5 py-[1px] md:px-2 md:py-0.5 border border-white/[0.12] font-mono text-[10px] uppercase text-white/45">{item.color}</span>
            <span className="px-1.5 py-[1px] md:px-2 md:py-0.5 border border-white/[0.12] font-mono text-[10px] uppercase text-white/45">{item.size}</span>
          </div>

          {/* Controls — pushed to bottom */}
          <div className="flex items-center justify-between mt-auto pt-1 md:pt-0 md:mt-2">
            <div className="flex items-center border border-white/[0.1] rounded-md md:rounded-lg">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="w-11 h-11 flex items-center justify-center font-mono text-sm md:text-3xl text-white hover:text-white/60 hover:bg-white/[0.05] transition-colors disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-white/40"
              >
                −
              </button>
              <span className="w-12 text-center font-mono text-[11px] md:text-sm text-white/80 tabular-nums">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-11 h-11 flex items-center justify-center font-mono text-sm md:text-3xl text-white hover:text-white/60 hover:bg-white/[0.05] transition-colors"
              >
                +
              </button>
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-[#ff3b30] transition-colors flex items-center gap-1.5"
            >
              <span className="text-[8px]">✕</span>
              Discard
            </button>
          </div>
        </div>

        {/* Corner accents */}
        <div className="pointer-events-none absolute top-0 right-0 w-8 h-8 border-t border-r border-[#ddb7ff]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-8 h-8 border-b border-l border-[#ddb7ff]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </motion.div>
  );
}

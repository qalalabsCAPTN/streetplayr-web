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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
      transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.15 }}
      className={`group relative flex gap-6 sm:gap-10 pb-16 pt-8 ${
        index % 2 !== 0 ? "sm:ml-12 lg:ml-24" : ""
      }`}
    >
      {/* Oversized Image */}
      <Link href={`/product/${item.productId}`} className={`relative block shrink-0 bg-[#0a0a0a] overflow-hidden ${
        index % 2 === 0 ? "w-32 sm:w-56 aspect-[3/4]" : "w-28 sm:w-48 aspect-square"
      }`}>
        <Image
          src={item.image || "/images/placeholder.jpg"}
          alt={item.name}
          fill
          className={`object-cover object-center transition-all duration-1000 group-hover:opacity-100 ${
            index % 2 === 0 ? "opacity-90" : "opacity-60 grayscale group-hover:grayscale-0"
          }`}
          sizes="(max-width: 768px) 128px, 224px"
        />
      </Link>

      {/* Item Details */}
      <div className="flex flex-1 flex-col justify-between py-1">
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="font-display text-2xl uppercase tracking-wide text-white">
                <Link href={`/product/${item.productId}`} className="hover:text-white/80 transition-colors">
                  {formatProductTitle(item.name)}
                </Link>
              </h3>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-widest text-white/40">
                <span>Color: {item.color}</span>
                <span>Size: {item.size}</span>
              </div>
            </div>
            
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/30">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-8">
          <div className="flex items-center border border-white/10 px-4 py-2 gap-6">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="text-white/40 hover:text-white transition-colors p-1"
              data-cursor="edit"
            >
              -
            </button>
            <span className="font-mono text-xs w-4 text-center">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="text-white/40 hover:text-white transition-colors p-1"
              data-cursor="edit"
            >
              +
            </button>
          </div>

          <button
            onClick={() => removeItem(item.id)}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-white/100"
            data-cursor="remove"
          >
            Remove
          </button>
        </div>
      </div>
    </motion.div>
  );
}

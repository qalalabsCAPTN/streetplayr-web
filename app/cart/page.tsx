"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCartStore } from "../../store/cartStore";
import CartItem from "../../components/cart/CartItem";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { items, getCartTotal } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-24 px-6 sm:px-12 lg:px-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[1400px] mx-auto"
      >
        <div className="mb-16">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="font-display text-5xl sm:text-7xl uppercase tracking-wide text-white"
          >
            Cart
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-6 font-mono text-sm uppercase tracking-[0.3em] text-white/40"
          >
            {items.length} {items.length === 1 ? 'Item' : 'Items'}
          </motion.p>
        </div>

        {items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-col items-start justify-center py-24 border-t border-white/5"
          >
            <p className="font-mono text-lg text-white/60 mb-8 uppercase tracking-widest">
              Your cart is empty.
            </p>
            <Link 
              href="/collection"
              className="group inline-flex items-center gap-4 border border-white/20 px-8 py-4 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-white hover:text-black"
            >
              <span>Explore Collection</span>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 lg:gap-24 items-start">
            {/* Items List */}
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Embedded Order Summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 0.2, ease: "easeOut" }}
              className="lg:sticky lg:top-32 space-y-10"
            >
              <div className="border-b border-white/5 pb-6 space-y-4">
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-white/30">
                  <span>Subtotal</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-white/30">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/20">Value</span>
                <span className="font-mono text-sm tracking-widest text-white/70">${getCartTotal().toFixed(2)}</span>
              </div>

              <Link
                href="/checkout"
                data-cursor="checkout"
                className="group relative flex w-full h-16 items-center justify-center overflow-hidden bg-white text-black transition-transform active:scale-[0.98]"
              >
                <span className="relative z-10 font-mono text-xs uppercase tracking-[0.2em] text-white mix-blend-difference">
                  Secure Allocation
                </span>
                <div className="absolute inset-0 z-0 bg-white transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-0 origin-bottom" />
              </Link>
              
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 text-center">
                Complimentary shipping on orders over $500
              </p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

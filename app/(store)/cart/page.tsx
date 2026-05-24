"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import CartItem from "@/components/cart/CartItem";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils/format";
import Navbar from "@/components/layout/Navbar";

export default function CartPage() {
  const { items, getCartTotal } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const total = getCartTotal();
  const itemCount = items.length;

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-[#16111b] pt-20 md:pt-32 pb-24 px-4 md:px-8 lg:px-12">
      {/* ── Environmental background layers ── */}
      {/* Vignette */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />
      {/* Side columns */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.25)_0%,transparent_10%,transparent_90%,rgba(0,0,0,0.25)_100%)]" />
      {/* Center atmosphere */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(221,183,255,0.05)_0%,transparent_55%)]" />
      {/* Surface grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Warm lower accent */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,87,26,0.03)_0%,transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[min(98vw,2560px)] mx-auto relative z-10"
      >
        {/* ── Left vertical framing rail ── */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-white/[0.04]" />
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-white/[0.02] translate-x-[7px]" />

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 md:mb-12 border-l-2 border-[#ddb7ff] pl-6">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff] mb-2"
            >
              / CART / {itemCount} {itemCount === 1 ? "ITEM" : "ITEMS"}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl md:text-8xl lg:text-9xl uppercase tracking-tight text-[#eadfed] leading-none"
            >
              Shopping Cart
            </motion.h1>
          </div>
        </div>

        {itemCount === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start py-36 border-t border-white/[0.05]"
          >
            <p className="text-3xl text-white/40 font-light mb-12 tracking-wider leading-relaxed">
              Your cart is empty.
            </p>
            <Link
              href="/collections"
              className="rounded-xl inline-flex items-center justify-center border border-white/[0.14] px-14 py-5 text-sm uppercase tracking-[0.15em] text-[#eadfed] transition-all duration-500 hover:bg-[#ddb7ff] hover:text-[#16111b] hover:border-[#ddb7ff]"
            >
              Explore Collection
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* ── Left Column — Cart Items ── */}
            <div className="lg:col-span-8 space-y-6">
              {items.map((item, index) => (
                <CartItem key={item.id} item={item} index={index} />
              ))}
            </div>

            {/* ── Right Column — Summary Module ── */}
            <div className="lg:col-span-4 space-y-6">
              {/* Primary summary panel */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="lg:sticky lg:top-32"
              >
                <div className="bg-[#2e2832] border border-white/[0.06] p-4 md:p-6 shadow-[0_32px_100px_rgba(0,0,0,0.4)] relative overflow-hidden rounded-xl">
                  {/* Blur accent */}
                  <div className="pointer-events-none absolute -top-20 -right-20 w-40 h-40 bg-[#ddb7ff]/5 blur-[100px] rounded-full" />

                  <div className="relative z-10">
                    {/* Heading */}
                    <div className="flex items-center gap-3 mb-4 md:mb-8 pb-3 md:pb-6 border-b border-white/[0.06]">
                      <div className="w-3 h-3 md:w-4 md:h-4 border border-[#ddb7ff]/60 flex items-center justify-center">
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#ddb7ff]/80" />
                      </div>
                      <h2 className="font-display text-base md:text-2xl uppercase tracking-wide text-[#eadfed]">Summary</h2>
                    </div>

                    {/* Rows */}
                    <div className="space-y-3 md:space-y-5 mb-4 md:mb-8">
                      <div className="flex justify-between items-baseline font-mono text-[11px] md:text-xs uppercase tracking-[0.15em]">
                        <span className="text-white/40">Subtotal</span>
                        <span className="text-white/70 tabular-nums">{formatPrice(total)}</span>
                      </div>
                      <div className="flex justify-between items-baseline font-mono text-[11px] md:text-xs uppercase tracking-[0.15em]">
                        <span className="text-white/40">Shipping</span>
                        <span className="text-white/30">Calculated at checkout</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="pt-4 md:pt-6 border-t border-white/[0.06] mb-0 md:mb-8">
                      <div className="flex justify-between items-end">
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Total</span>
                        <span className="font-display text-2xl md:text-5xl tracking-wide text-[#eadfed] tabular-nums leading-none">
                          {formatPrice(total)}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="hidden md:block">
                      <Link
                        href="/checkout"
                        className="rounded-xl group relative block w-full py-6 text-center overflow-hidden transition-all active:scale-[0.98]"
                      >
                        <span className="absolute inset-0 bg-[#ddb7ff] transition-transform duration-500 group-hover:scale-y-0 origin-bottom" />
                        <span className="absolute inset-0 bg-[#eadfed] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />
                        <span className="relative z-10 text-sm uppercase tracking-[0.2em] text-[#16111b] font-light">
                          Complete Order
                        </span>
                      </Link>
                    </div>


                  </div>
                </div>
              </motion.div>


            </div>
          </div>
        )}
      </motion.div>

      {/* Mobile sticky checkout bar */}
      <div className="md:hidden fixed bottom-28 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="bg-[#2e2832] border border-white/[0.08] rounded-xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/40">Subtotal</span>
              <span className="block font-display text-lg tracking-wide text-[#eadfed] tabular-nums leading-none mt-0.5">{formatPrice(total)}</span>
            </div>
            <Link
              href="/checkout"
              className="inline-flex items-center gap-1.5 bg-[#ddb7ff] text-[#16111b] rounded-lg px-5 py-3.5 text-xs uppercase tracking-[0.15em] font-medium hover:opacity-90 transition-opacity"
            >
              Checkout
              <span className="text-sm">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer architecture ── */}
      <footer className="relative z-10 max-w-[min(98vw,2560px)] mx-auto mt-24 pt-12 pb-12 border-t border-white/[0.05]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <span className="font-display text-lg uppercase tracking-wide text-white/60">Street PlayR</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/15 mt-2">
              &copy; 2024 Street PlayR
            </span>
          </div>
          {/* Nav links */}
          <div className="flex gap-8 font-mono text-[9px] uppercase tracking-[0.2em]">
            <Link href="/collections" className="text-white/30 hover:text-white/60 transition-colors">Collections</Link>
            <Link href="/about" className="text-white/30 hover:text-white/60 transition-colors">About</Link>
            <Link href="/contact" className="text-white/30 hover:text-white/60 transition-colors">Contact</Link>
            <Link href="/faq" className="text-white/30 hover:text-white/60 transition-colors">FAQ</Link>
          </div>
          {/* Social */}
          <div className="flex gap-3">
            <div className="w-7 h-7 border border-white/[0.1] flex items-center justify-center hover:border-[#ddb7ff]/40 transition-colors cursor-pointer rounded">
              <span className="text-[10px] text-white/40">IG</span>
            </div>
            <div className="w-7 h-7 border border-white/[0.1] flex items-center justify-center hover:border-[#ddb7ff]/40 transition-colors cursor-pointer rounded">
              <span className="text-[10px] text-white/40">X</span>
            </div>
            <div className="w-7 h-7 border border-white/[0.1] flex items-center justify-center hover:border-[#ddb7ff]/40 transition-colors cursor-pointer rounded">
              <span className="text-[10px] text-white/40">YT</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}

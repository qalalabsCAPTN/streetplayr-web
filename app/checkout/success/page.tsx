"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCartStore } from "../../../store/cartStore";

export default function CheckoutSuccessPage() {
  const { clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Clear cart after a delay to allow for any exit animations if needed
    const timeout = setTimeout(() => {
      clearCart();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [clearCart]);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-[#050505] overflow-hidden flex items-center justify-center">
      {/* Atmospheric Background Image */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 4, ease: "linear" }}
        className="absolute inset-0 z-0"
      >
        <Image
          src="/images/hero-1.jpg" // Using an existing campaign image
          alt="Campaign"
          fill
          className="object-cover object-center grayscale opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-[#050505]/30" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 w-full px-6 sm:px-12 flex flex-col items-center text-center py-32">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3, delay: 1, ease: "easeOut" }}
          className="space-y-16"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/20">
            Acquisition Complete
          </p>
          
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl uppercase tracking-[0.1em] text-white/90 leading-[1.1]">
            Allocation <br className="hidden sm:block" />
            <span className="text-white/60">Secured</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3, delay: 2.5, ease: "easeOut" }}
          className="mt-32 space-y-6 max-w-sm mx-auto"
        >
          <p className="font-mono text-[10px] leading-relaxed tracking-[0.1em] text-white/30">
            A dossier detailing your acquisition has been transmitted.
          </p>
          
          <div className="pt-24">
            <Link
              href="/"
              data-cursor="hover"
              className="group inline-flex flex-col items-center gap-2"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors duration-700">
                Return to Surface
              </span>
              <div className="w-px h-12 bg-white/20 group-hover:bg-white group-hover:h-16 transition-all duration-700" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

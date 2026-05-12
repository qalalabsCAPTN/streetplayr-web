"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  const orderId = searchParams.get('order_id');
  const clientSecret = searchParams.get('payment_intent_client_secret');
  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    setMounted(true);
    const timeout = setTimeout(() => clearCart(), 1000);

    // Verify payment
    if (redirectStatus === 'succeeded' || clientSecret) {
      setVerified(true);
    } else if (redirectStatus === 'failed') {
      setVerified(false);
    } else {
      setVerified(true);
    }

    return () => clearTimeout(timeout);
  }, [clearCart, redirectStatus, clientSecret]);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-[#050505] overflow-hidden flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 4, ease: "linear" }}
        className="absolute inset-0 z-0"
      >
        <Image
          src="/images/hero-1.jpg"
          alt="Campaign"
          fill
          className="object-cover object-center grayscale opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-[#050505]/30" />
      </motion.div>

      <div className="relative z-10 w-full px-6 sm:px-12 flex flex-col items-center text-center py-32">
        {verified === false ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="space-y-16"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-sp-error">
              Payment Failed
            </p>
            <h1 className="font-display text-5xl sm:text-7xl uppercase tracking-[0.1em] text-white/90 leading-[1.1]">
              Allocation <br />
              <span className="text-white/40">Declined</span>
            </h1>
            <div className="mt-16">
              <Link
                href="/checkout"
                className="border border-white/20 px-8 py-4 font-mono text-xs uppercase tracking-[0.3em] text-white hover:bg-white hover:text-black transition-all"
              >
                Retry Payment
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
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
              {orderId && (
                <p className="font-mono text-[10px] tracking-[0.1em] text-white/20">
                  Order #{orderId.slice(0, 8)}
                </p>
              )}
              <p className="font-mono text-[10px] leading-relaxed tracking-[0.1em] text-white/30">
                A dossier detailing your acquisition has been transmitted.
              </p>

              <div className="pt-24">
                <Link
                  href="/profile/orders"
                  data-cursor="hover"
                  className="group inline-flex flex-col items-center gap-2"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors duration-700">
                    View Order History
                  </span>
                  <div className="w-px h-12 bg-white/20 group-hover:bg-white group-hover:h-16 transition-all duration-700" />
                </Link>
              </div>

              <div className="pt-8">
                <Link
                  href="/"
                  className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/20 hover:text-white/60 transition-colors"
                >
                  Return to Surface
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

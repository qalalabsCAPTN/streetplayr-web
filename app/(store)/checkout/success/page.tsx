"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";

type VerificationState = 'verifying' | 'succeeded' | 'failed' | 'pending' | 'not_found';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [verification, setVerification] = useState<VerificationState>('verifying');

  const orderId = searchParams.get('order_id');
  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    setMounted(true);

    if (!orderId) {
      setVerification('not_found');
      return;
    }

    const resolvedOrderId: string = orderId;

    // Verify payment by checking order status from DB
    async function verify() {
      try {
        const { getOrderAction } = await import('@/app/actions/order');
        const result = await getOrderAction(resolvedOrderId);

        if (!result.success || !result.data) {
          setVerification('not_found');
          return;
        }

        const status = result.data.status;

        if (status === 'confirmed' || status === 'processing' || status === 'shipped' || status === 'delivered') {
          setVerification('succeeded');
          clearCart();
          return;
        }

        if (status === 'cancelled' || status === 'refunded') {
          setVerification('failed');
          return;
        }

        if (status === 'pending_payment') {
          // Payment was initiated but may still be processing.
          // Check redirect_status for more context.
          if (redirectStatus === 'succeeded') {
            setVerification('succeeded');
            clearCart();
          } else if (redirectStatus === 'failed') {
            setVerification('failed');
          } else {
            setVerification('pending');
          }
          return;
        }

        // draft or on_hold — unexpected at this point
        if (status === 'draft') {
          setVerification('failed');
          return;
        }

        setVerification('succeeded');
        clearCart();
      } catch {
        // If verification fails (e.g. network), trust redirect_status
        if (redirectStatus === 'succeeded') {
          setVerification('succeeded');
          clearCart();
        } else if (redirectStatus === 'failed') {
          setVerification('failed');
        } else {
          setVerification('pending');
        }
      }
    }

    verify();
  }, [orderId, redirectStatus, clearCart]);

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
        {verification === 'verifying' && (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="font-mono text-xs uppercase tracking-[0.3em] text-white/40"
          >
            Verifying Acquisition
          </motion.div>
        )}

        {verification === 'pending' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="space-y-16"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/30">
              Processing
            </p>
            <h1 className="font-display text-5xl sm:text-7xl uppercase tracking-[0.1em] text-white/90 leading-[1.1]">
              Allocation <br />
              <span className="text-white/40">Pending</span>
            </h1>
            <p className="font-mono text-[10px] tracking-[0.1em] text-white/30 max-w-sm">
              Your payment is being processed. This typically completes within a few minutes.
            </p>
            <div className="pt-16">
              <Link
                href="/profile/orders"
                className="border border-white/20 px-8 py-4 font-mono text-xs uppercase tracking-[0.3em] text-white hover:bg-white hover:text-black transition-all"
              >
                View Orders
              </Link>
            </div>
          </motion.div>
        )}

        {verification === 'failed' && (
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
        )}

        {verification === 'not_found' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="space-y-16"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/30">
              Order Not Found
            </p>
            <h1 className="font-display text-5xl sm:text-7xl uppercase tracking-[0.1em] text-white/90 leading-[1.1]">
              No <br />
              <span className="text-white/40">Dossier</span>
            </h1>
            <div className="mt-16">
              <Link
                href="/"
                className="border border-white/20 px-8 py-4 font-mono text-xs uppercase tracking-[0.3em] text-white hover:bg-white hover:text-black transition-all"
              >
                Return to Surface
              </Link>
            </div>
          </motion.div>
        )}

        {verification === 'succeeded' && (
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
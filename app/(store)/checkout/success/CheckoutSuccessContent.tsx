'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils/format";
import { trackPurchase } from "@/lib/analytics/ecommerce";

interface OrderData {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus?: string;
}

const PAID = new Set(['confirmed', 'processing', 'fulfilling', 'shipped', 'delivered']);


export default function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<'verifying' | 'confirmed' | 'pending' | 'not_found'>('verifying');
  const [order, setOrder] = useState<OrderData | null>(null);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    setMounted(true);

    if (!orderId) {
      setState('not_found');
      return;
    }

    const resolvedOrderId: string = orderId;

    async function verify() {
      try {
        const { getOrderAction } = await import('@/app/actions/order');
        const result = await getOrderAction(resolvedOrderId);

        if (!result.success || !result.data) {
          setState('not_found');
          return;
        }

        const data = result.data;
        setOrder({
          id: data.id,
          orderNumber: data.orderNumber,
          total: data.total,
          status: data.status,
          paymentStatus: data.paymentStatus,
        });

        if (PAID.has(data.status) && data.paymentStatus === 'paid') {
          setState('confirmed');
          clearCart();
          void import('@/app/actions/order').then(({ ensureUniwareForwardAction }) =>
            ensureUniwareForwardAction(resolvedOrderId).catch(() => undefined)
          );
          trackPurchase(
            data.orderNumber || data.id,
            data.total,
            data.items.map((i) => ({
              item_id: i.productId,
              item_name: i.productTitle ?? i.productId,
              price: i.price,
              quantity: i.quantity,
            }))
          );
        } else if (data.status === 'pending') {
          setState('pending');
        } else {
          setState('not_found');
        }
      } catch {
        setState('not_found');
      }
    }

    verify();
  }, [orderId, clearCart]);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-transparent overflow-hidden flex items-center justify-center">
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#16111b] via-[#16111b]/80 to-[#16111b]/30" />
      </motion.div>

      <div className="relative z-10 w-full px-6 sm:px-12 flex flex-col items-center text-center py-32">
        {state === 'verifying' && (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="font-mono text-xs uppercase tracking-[0.3em] text-white/40"
          >
            Verifying Acquisition
          </motion.div>
        )}

        {state === 'not_found' && (
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
            <div className="pt-8">
              <Link
                href="/home"
                className="rounded-xl border border-white/[0.14] px-8 py-4 font-mono text-xs uppercase tracking-[0.3em] text-[#eadfed] hover:bg-[#ddb7ff] hover:text-[#16111b] transition-all"
              >
                Return to Surface
              </Link>
            </div>
          </motion.div>
        )}

        {state === 'pending' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12 max-w-md"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/30">
              Payment pending
            </p>
            <h1 className="font-display text-4xl sm:text-6xl uppercase tracking-[0.1em] text-white/90 leading-[1.1]">
              Not confirmed yet
            </h1>
            <p className="font-mono text-xs text-white/50">
              Your cart is still intact. Complete payment to secure this order.
            </p>
            {order && (
              <Link
                href={`/checkout?error=payment_failed&order_id=${order.id}`}
                className="inline-block rounded-xl border border-white/[0.14] px-8 py-4 font-mono text-xs uppercase tracking-[0.3em] text-[#eadfed] hover:bg-[#ddb7ff] hover:text-[#16111b] transition-all"
              >
                Retry payment
              </Link>
            )}
          </motion.div>
        )}

        {state === 'confirmed' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 3, delay: 1, ease: "easeOut" }}
              className="space-y-12"
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
              className="mt-16 space-y-8 max-w-sm mx-auto"
            >
              {order && (
                <div className="border border-white/[0.08] bg-[#0c0c0c]/80 p-5 space-y-3 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Order</span>
                    <span className="font-mono text-[10px] text-white/60">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Total</span>
                    <span className="font-display text-2xl text-[#eadfed]">{formatPrice(order.total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Status</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-green-400 border border-green-500/30 px-2 py-0.5 rounded">
                      {order.status}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-8 space-y-6">
                <Link
                  href={order ? `/profile/orders/${order.id}` : '/profile/orders'}
                  className="group inline-flex flex-col items-center gap-2"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors duration-700">
                    View Order
                  </span>
                  <div className="w-px h-12 bg-white/20 group-hover:bg-white group-hover:h-16 transition-all duration-700" />
                </Link>

                <div className="pt-4">
                  <Link
                    href="/collections"
                    className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/20 hover:text-white/60 transition-colors"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

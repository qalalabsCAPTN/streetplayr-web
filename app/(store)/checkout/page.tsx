"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PremiumInput from "@/components/checkout/PremiumInput";
import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import { formatPrice, formatProductTitle } from "@/lib/utils/format";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutFormContent({ clientSecret, setClientSecret }: {
  clientSecret: string | null;
  setClientSecret: (s: string | null) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [phase, setPhase] = useState<'form' | 'processing' | 'payment' | 'error'>('form');
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const handleFormSubmit = useCallback(async () => {
    if (!email || !firstName || !lastName || !address || !city || !country) {
      setError("Please fill in all required fields.");
      return;
    }
    setPhase('processing');
    setError(null);

    try {
      const { initiateCheckoutAction } = await import('@/app/actions/checkout');
      const { createPaymentIntentAction } = await import('@/app/actions/payment');
      const { confirmCheckoutPaymentAction } = await import('@/app/actions/checkout');

      const totalPaise = Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100);

      const checkoutItems = items.map(i => ({
        productId: i.productId,
        variantId: i.id,
        quantity: i.quantity,
        price: i.price,
      }));

      const checkout = await initiateCheckoutAction(checkoutItems, {
        line1: address,
        city,
        state: "",
        postalCode: "",
        country,
      });

      if (!checkout.success) {
        setError(checkout.error ?? "Checkout failed.");
        setPhase('form');
        return;
      }

      setOrderId(checkout.data!.orderId);

      const payment = await createPaymentIntentAction(totalPaise);
      if ('error' in payment) {
        setError(payment.error ?? "Payment setup failed.");
        setPhase('form');
        return;
      }

      const confirm = await confirmCheckoutPaymentAction(
        checkout.data!.orderId,
        payment.paymentIntentId
      );

      if (!confirm.success) {
        setError(confirm.error ?? "Payment confirmation failed.");
        setPhase('form');
        return;
      }

      setClientSecret(payment.clientSecret);
      setPhase('payment');
    } catch (e: any) {
      setError(e.message ?? "An unexpected error occurred.");
      setPhase('form');
    }
  }, [email, firstName, lastName, address, city, country, items, setClientSecret]);

  const handlePay = useCallback(async () => {
    if (!stripe || !elements || !clientSecret || !orderId) return;
    setPhase('processing');
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?order_id=${orderId}`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed.");
      setPhase('payment');
    } else {
      clearCart();
      router.push(`/checkout/success?order_id=${orderId}`);
    }
  }, [stripe, elements, clientSecret, orderId, router, clearCart]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Phase: server-side processing spinner
  if (phase === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-48">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="font-mono text-xs uppercase tracking-[0.3em] text-white/40"
        >
          Processing Allocation
        </motion.div>
      </div>
    );
  }

  // Phase: error (retry available)
  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-sp-error">{error}</p>
        <button
          onClick={() => { setPhase('form'); setError(null); }}
          className="border border-white/20 px-8 py-4 font-mono text-xs uppercase tracking-[0.3em] text-white hover:bg-white hover:text-black transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Phase: Stripe PaymentElement (card form)
  if (phase === 'payment') {
    return (
      <div className="space-y-12">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-widest text-white/40 mb-12 border-b border-white/5 pb-4">
            Complete Payment
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 mb-8">
            Total: {formatPrice(total)}
          </p>
          <PaymentElement />
        </div>
        {error && (
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-sp-error">{error}</p>
        )}
        <motion.button
          onClick={handlePay}
          disabled={!stripe || !elements}
          className="w-full mt-8 py-8 bg-white text-black font-mono text-xs uppercase tracking-[0.3em] transition-all duration-500 hover:opacity-90 disabled:opacity-30"
        >
          Confirm Payment
        </motion.button>
      </div>
    );
  }

  // Phase: form (collect contact + shipping)
  return (
    <div className="space-y-32">
      <div>
        <h2 className="font-mono text-xs uppercase tracking-widest text-white/40 mb-12 border-b border-white/5 pb-4">
          Contact
        </h2>
        <PremiumInput
          id="email"
          type="email"
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <h2 className="font-mono text-xs uppercase tracking-widest text-white/40 mb-12 border-b border-white/5 pb-4">
          Shipping
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-12">
          <PremiumInput
            id="firstName"
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <PremiumInput
            id="lastName"
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <div className="sm:col-span-2">
            <PremiumInput
              id="address"
              label="Street Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <PremiumInput
            id="city"
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <PremiumInput
            id="country"
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-sp-error">{error}</p>
      )}

      <motion.button
        onClick={handleFormSubmit}
        className="w-full mt-8 py-8 bg-transparent border border-white/20 font-mono text-xs uppercase tracking-[0.3em] text-white transition-all duration-500 hover:bg-white hover:text-black"
      >
        Secure Allocation — {formatPrice(total)}
      </motion.button>

      <div className="pt-32 mt-32 border-t border-white/5">
        <h3 className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/20 mb-16 text-center">
          Dossier Summary
        </h3>
        <div className="space-y-12">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center group opacity-40 hover:opacity-100 transition-opacity duration-1000">
              <div className="flex items-center gap-8">
                <div className="relative w-16 h-24 bg-[#050505] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000">
                  <Image
                    src={item.image || "/images/placeholder.jpg"}
                    alt={item.name}
                    fill
                    className="object-cover opacity-60 mix-blend-screen"
                    sizes="64px"
                  />
                </div>
                <div>
                  <p className="font-display text-xs tracking-[0.2em] uppercase text-white/80">{formatProductTitle(item.name)}</p>
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mt-2">
                    {item.color} // {item.size} // QTY {item.quantity}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div className="pt-12 mt-12 border-t border-white/5 flex flex-col items-end gap-4">
            <div className="flex gap-12 font-mono text-[9px] uppercase tracking-[0.3em] text-white/20">
              <span>Value</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex gap-12 font-mono text-[9px] uppercase tracking-[0.3em] text-white/20">
              <span>Shipping</span>
              <span>Complimentary</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { items } = useCartStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (items.length === 0) {
      router.push("/cart");
    }
  }, [items.length, router]);

  if (!mounted || items.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-32 px-6 sm:px-12">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <span className="font-display text-xl tracking-[0.16em] text-white">
            STREET PLAYR
          </span>
          <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.4em] text-white/30">
            Secure Checkout
          </p>
        </motion.div>

        <Elements
          key={retryKey}
          stripe={stripePromise}
          options={{
            clientSecret: clientSecret ?? undefined,
            appearance: { theme: 'night', variables: { colorPrimary: '#9D4EDD' } },
          }}
        >
          <CheckoutFormContent
            clientSecret={clientSecret}
            setClientSecret={setClientSecret}
          />
        </Elements>
      </div>
    </div>
  );
}

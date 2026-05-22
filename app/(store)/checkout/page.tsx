"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, formatProductTitle } from "@/lib/utils/format";
import Navbar from "@/components/layout/Navbar";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

/* ── Custom styled input matching reference ── */
function CheckoutInput({ label, id, type = "text", value, onChange, placeholder }: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full bg-transparent border-b border-white/[0.1] py-2.5 font-mono text-sm text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-[#ddb7ff]/60"
      />
    </div>
  );
}

/* ── Left column form content ── */
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
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
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
      const { createPaymentAndConfirmAction } = await import('@/app/actions/payment');

      const totalPaise = Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100);

      const checkoutItems = items.map(i => ({
        productId: i.productId,
        variantId: i.id,
        quantity: i.quantity,
        price: i.price,
      }));

      const { validateCartStockAction } = await import('@/app/actions/stock');
      const stockCheck = await validateCartStockAction(
        checkoutItems.map(i => ({ variantId: i.variantId, quantity: i.quantity }))
      );

      if (stockCheck.success && !stockCheck.data!.valid) {
        const failures = stockCheck.data!.failures;
        const msg = failures.map(f => `Insufficient stock for item (requested ${f.requested}, available ${f.available})`).join('; ');
        setError(msg);
        setPhase('form');
        return;
      }

      const checkout = await initiateCheckoutAction(checkoutItems, {
        line1: address,
        city,
        state,
        postalCode: postalCode,
        country,
      });

      if (!checkout.success) {
        setError(checkout.error ?? "Checkout failed.");
        setPhase('form');
        return;
      }

      const createdOrderId = checkout.data!.orderId;
      setOrderId(createdOrderId);

      const result = await createPaymentAndConfirmAction(createdOrderId, totalPaise);

      if (!result.success) {
        setError(result.error ?? "Payment setup failed.");
        setPhase('form');
        return;
      }

      setClientSecret(result.data!.clientSecret);
      setPhase('payment');
    } catch (e: any) {
      setError(e.message ?? "An unexpected error occurred.");
      setPhase('form');
    }
  }, [email, firstName, lastName, address, city, state, postalCode, country, items, setClientSecret]);

  const handlePay = useCallback(async () => {
    if (!stripe || !elements || !clientSecret || !orderId) return;
    if (paymentSubmitted) return;
    setPaymentSubmitted(true);
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
      try {
        const { releaseOrderReservationsAction } = await import('@/app/actions/payment');
        await releaseOrderReservationsAction(orderId);
      } catch {}
      setPaymentSubmitted(false);
      setPhase('payment');
    } else {
      clearCart();
      router.push(`/checkout/success?order_id=${orderId}`);
    }
  }, [stripe, elements, clientSecret, orderId, router, clearCart, paymentSubmitted]);

  /* ── Processing ── */
  if (phase === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-32 border border-white/[0.06] bg-[#1f1a23]/50">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="font-mono text-xs uppercase tracking-[0.3em] text-white/40"
        >
          Processing
        </motion.div>
      </div>
    );
  }

  /* ── Error ── */
  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-32 border border-white/[0.06] bg-[#1f1a23]/50 gap-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#ff3b30]">{error}</p>
        <button
          onClick={() => { setPhase('form'); setError(null); }}
          className="rounded-none border border-white/[0.14] px-8 py-4 font-mono text-xs uppercase tracking-[0.3em] text-[#eadfed] hover:bg-[#ddb7ff] hover:text-[#16111b] transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  /* ── Payment (Stripe card form) ── */
  if (phase === 'payment') {
    return (
      <div className="border border-white/[0.06] p-6 bg-[#1f1a23]/50">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/[0.06]">
          <div className="w-4 h-4 border border-[#ddb7ff]/60 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[#ddb7ff]/80" />
          </div>
          <h2 className="font-display text-2xl uppercase tracking-wide text-[#eadfed]">Complete Payment</h2>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 mb-6">
          Total: {formatPrice(items.reduce((sum, i) => sum + i.price * i.quantity, 0))}
        </p>
        <PaymentElement />
        {error && (
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-[#ff3b30]">{error}</p>
        )}
        <button
          onClick={handlePay}
          disabled={!stripe || !elements}
          className="rounded-none group relative w-full mt-8 py-5 text-center overflow-hidden transition-all active:scale-[0.98] disabled:opacity-30"
        >
          <span className="absolute inset-0 bg-[#ddb7ff] transition-transform duration-500 group-hover:scale-y-0 origin-bottom" />
          <span className="absolute inset-0 bg-[#eadfed] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />
          <span className="relative z-10 text-sm uppercase tracking-[0.2em] text-[#16111b] font-light">
            Confirm Payment
          </span>
        </button>
      </div>
    );
  }

  /* ── Form (shipping) ── */
  return (
    <div className="border border-white/[0.06] p-6 bg-[#1f1a23]/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10" />
        </svg>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff]">[</span>
        <h2 className="font-display text-3xl uppercase tracking-wide text-[#eadfed]">Shipping</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff]">]</span>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CheckoutInput
            id="firstName" label="Full Name" placeholder="FIRST NAME"
            value={firstName} onChange={setFirstName}
          />
          <CheckoutInput
            id="lastName" label="Last Name" placeholder="LAST NAME"
            value={lastName} onChange={setLastName}
          />
        </div>
        <CheckoutInput
          id="email" type="email" label="Email" placeholder="EMAIL@ADDRESS.COM"
          value={email} onChange={setEmail}
        />
        <CheckoutInput
          id="address" label="Street Address" placeholder="ADDRESS"
          value={address} onChange={setAddress}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CheckoutInput id="city" label="City" placeholder="CITY" value={city} onChange={setCity} />
          <CheckoutInput id="state" label="State" placeholder="STATE" value={state} onChange={setState} />
          <CheckoutInput id="postalCode" label="Postal Code" placeholder="POSTAL CODE" value={postalCode} onChange={setPostalCode} />
        </div>
        <div className="space-y-2">
          <label htmlFor="country" className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Country</label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full bg-transparent border-b border-white/[0.1] py-2.5 font-mono text-sm text-white/80 outline-none focus:border-[#ddb7ff]/60"
          >
            <option value="" className="bg-[#16111b]">SELECT COUNTRY</option>
            <option value="IN" className="bg-[#16111b]">India</option>
            <option value="US" className="bg-[#16111b]">United States</option>
            <option value="GB" className="bg-[#16111b]">United Kingdom</option>
            <option value="AE" className="bg-[#16111b]">UAE</option>
            <option value="SG" className="bg-[#16111b]">Singapore</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-[#ff3b30]">{error}</p>
      )}
    </div>
  );
}

/* ── Wallet / Loyalty Module ── */
function WalletModule() {
  return (
    <div className="border border-white/[0.06] p-6 bg-[#1f1a23]/50">
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff]">[</span>
        <h2 className="font-display text-3xl uppercase tracking-wide text-[#eadfed]">Loyalty</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff]">]</span>
      </div>
      <div className="p-4 border border-[#ddb7ff]/15 bg-[#ddb7ff]/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#ddb7ff]/10 border border-[#ddb7ff]/30 flex items-center justify-center">
            <span className="text-[#ddb7ff] text-sm">✦</span>
          </div>
          <div>
            <div className="font-mono text-xs text-white/80">Member Balance</div>
            <div className="font-mono text-[10px] text-[#ddb7ff]/70 mt-0.5">2,450 Reward Points</div>
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">Active</span>
      </div>
    </div>
  );
}

/* ── Order Summary ── */
function OrderSummary({ items, total }: { items: any[]; total: number }) {
  return (
    <div className="border border-white/[0.06] bg-[#2e2832]/40 p-6 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#ddb7ff]/40 to-transparent" />
      <div className="absolute bottom-0 right-0 p-1 font-mono text-[8px] opacity-20 rotate-90 origin-bottom-right translate-y-8">SECURE CHECKOUT</div>

      <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff] mb-8 flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 bg-[#ddb7ff]" />
        Order Summary ({items.length})
      </h3>

      <div className="space-y-5 mb-8">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 group">
            <div className="w-20 h-24 bg-[#231e27] border border-white/[0.06] overflow-hidden shrink-0 relative">
              <Image
                src={item.image || "/images/placeholder.jpg"}
                alt={item.name}
                width={80}
                height={96}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute bottom-0 right-0 bg-[#ddb7ff] text-[#16111b] text-[10px] px-1 font-mono">
                x{item.quantity}
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
              <div>
                <p className="font-mono text-xs text-white/80 uppercase leading-tight">{formatProductTitle(item.name)}</p>
                <p className="font-mono text-[10px] text-white/35 mt-1">
                  {item.size} / {item.color}
                </p>
              </div>
              <p className="font-mono text-sm text-[#ddb7ff]">{formatPrice(item.price)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06] pt-5 space-y-3">
        <div className="flex justify-between font-mono text-xs text-white/40">
          <span>Subtotal</span>
          <span className="text-white/70">{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between font-mono text-xs text-white/40">
          <span>Shipping</span>
          <span className="text-white/30">Calculated at checkout</span>
        </div>
      </div>

      <div className="flex justify-between items-end mt-5 pt-5 border-t border-white/[0.06]">
        <span className="font-display text-2xl uppercase text-white/60">Total</span>
        <div className="text-right">
          <span className="font-display text-4xl text-[#eadfed] tracking-wide tabular-nums leading-none">{formatPrice(total)}</span>
        </div>
      </div>

      <div className="mt-6 p-3 bg-black/40 border border-white/[0.06] flex items-center gap-3">
        <span className="text-white/40 text-[10px]">🔒</span>
        <p className="font-mono text-[9px] text-white/25 uppercase leading-tight tracking-[0.1em]">
          Encrypted checkout. Your information is secure.
        </p>
      </div>
    </div>
  );
}

/* ── Promo Code ── */
function PromoCode() {
  const [code, setCode] = useState("");
  return (
    <div className="flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="PROMO CODE"
        className="flex-1 bg-[#1f1a23] border border-white/[0.06] px-4 py-3 font-mono text-xs text-white/60 outline-none focus:border-[#ddb7ff]/40 transition-colors placeholder:text-white/20"
      />
      <button className="rounded-none px-6 bg-[#2e2832] border border-white/[0.06] font-mono text-xs uppercase tracking-[0.15em] text-white/50 hover:bg-[#ddb7ff] hover:text-[#16111b] hover:border-[#ddb7ff] transition-all">
        Apply
      </button>
    </div>
  );
}

/* ── Main Checkout Page ── */
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

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.length;

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-[#16111b] pt-32 pb-24 px-6 sm:px-12 lg:px-16">
      {/* ── Environmental background layers ── */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.25)_0%,transparent_10%,transparent_90%,rgba(0,0,0,0.25)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(221,183,255,0.05)_0%,transparent_55%)]" />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,87,26,0.03)_0%,transparent_60%)]" />

      <div className="max-w-[1440px] mx-auto relative z-10">
        {/* ── Left vertical framing rail ── */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-white/[0.04]" />
        <div className="absolute left-0 top-0 bottom-0 w-px bg-white/[0.02] translate-x-[7px]" />

        {/* ── Header with progress bar ── */}
        <div className="flex items-center justify-between mb-12 border-b border-white/[0.05] pb-6">
          <div className="flex items-center gap-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ddb7ff] border border-[#ddb7ff]/40 px-3 py-1 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-[#ddb7ff]" />
              01 Shipping
            </div>
            <div className="w-6 h-px bg-white/[0.1]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">02 Payment</span>
            <div className="w-6 h-px bg-white/[0.1]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">03 Confirmation</span>
          </div>
          <div className="hidden md:block font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">
            {itemCount} Items
          </div>
        </div>

        {/* ── Grid: form (7) / summary (5) ── */}
        <Elements
          key={retryKey}
          stripe={stripePromise}
          options={{
            clientSecret: clientSecret ?? undefined,
            appearance: { theme: 'night', variables: { colorPrimary: '#ddb7ff', colorBackground: '#231e27', colorText: '#eadfed' } },
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── Left Column: Shipping Form + Wallet ── */}
            <div className="lg:col-span-7 space-y-6">
              <CheckoutFormContent
                clientSecret={clientSecret}
                setClientSecret={setClientSecret}
              />
              <WalletModule />
            </div>

            {/* ── Right Column: Summary + Promo ── */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-32">
              <OrderSummary items={items} total={total} />
              <PromoCode />
            </div>
          </div>
        </Elements>

        {/* ── Bottom navigation ── */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/[0.05]">
          <Link
            href="/cart"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors"
          >
            ← Return to Cart
          </Link>
          {clientSecret ? null : (
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/15">
              Secure checkout
            </span>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 max-w-[1440px] mx-auto mt-24 pt-10 pb-10 border-t border-white/[0.05]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-display text-lg uppercase tracking-wide text-white/60">Street PlayR</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/15 mt-2">&copy; 2024 Street PlayR</span>
          </div>
          <div className="flex gap-8 font-mono text-[9px] uppercase tracking-[0.2em]">
            <Link href="/collections" className="text-white/30 hover:text-white/60 transition-colors">Collections</Link>
            <Link href="/about" className="text-white/30 hover:text-white/60 transition-colors">About</Link>
            <Link href="/contact" className="text-white/30 hover:text-white/60 transition-colors">Contact</Link>
            <Link href="/faq" className="text-white/30 hover:text-white/60 transition-colors">FAQ</Link>
          </div>
          <div className="flex gap-3">
            <div className="w-7 h-7 border border-white/[0.1] flex items-center justify-center hover:border-[#ddb7ff]/40 transition-colors cursor-pointer">
              <span className="text-[10px] text-white/40">IG</span>
            </div>
            <div className="w-7 h-7 border border-white/[0.1] flex items-center justify-center hover:border-[#ddb7ff]/40 transition-colors cursor-pointer">
              <span className="text-[10px] text-white/40">X</span>
            </div>
            <div className="w-7 h-7 border border-white/[0.1] flex items-center justify-center hover:border-[#ddb7ff]/40 transition-colors cursor-pointer">
              <span className="text-[10px] text-white/40">YT</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Fixed HUD environmental elements ── */}
      <div className="fixed bottom-10 left-10 hidden xl:block pointer-events-none z-0">
        <div className="font-mono text-[10px] text-white/20 flex flex-col gap-1">
          <span>Free shipping over {formatPrice(50000)}</span>
          <span>14-day return policy</span>
        </div>
      </div>
      <div className="fixed top-1/2 right-10 -translate-y-1/2 hidden xl:block pointer-events-none z-0">
        <div className="font-mono text-[10px] text-white/15 tracking-tighter" style={{ writingMode: 'vertical-rl' }}>
          STREET PLAYR // SECURE CHECKOUT
        </div>
      </div>
    </div>
    </>
  );
}

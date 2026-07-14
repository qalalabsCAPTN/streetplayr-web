"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, formatProductTitle } from "@/lib/utils/format";
import Navbar from "@/components/layout/Navbar";

function CheckoutInput({ label, id, type = "text", value, onChange, placeholder }: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border border-white/[0.06] rounded-lg px-3 py-4 font-mono text-sm text-white/80 outline-none transition-colors placeholder:text-white/30 focus:border-[#ddb7ff]/60"
      />
    </div>
  );
}

const CheckoutFormContent = forwardRef<{ completeOrder: () => Promise<void> }>(function CheckoutFormContent(props, ref) {
  const router = useRouter();
  const { items } = useCartStore();
  const [phase, setPhase] = useState<'form' | 'processing' | 'error'>('form');
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'demo' | 'razorpay'>('demo');

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  const handleCompleteOrder = useCallback(async () => {
    if (!email || !firstName || !lastName || !address || !city || !country) {
      setError("Please fill in all required fields.");
      return;
    }
    setPhase('processing');
    setError(null);

    try {
      const { initiateCheckoutAction } = await import('@/app/actions/checkout');
      const { validateCartStockAction } = await import('@/app/actions/stock');

      const checkoutItems = items.map(i => ({
        productId: i.productId,
        variantId: i.id,
        quantity: i.quantity,
        price: i.price,
      }));

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

      const { confirmDemoOrderAction } = await import('@/app/actions/demo-checkout');
      const result = await confirmDemoOrderAction(createdOrderId);

      if (!result.success) {
        setError(result.error ?? "Order confirmation failed.");
        setPhase('form');
        return;
      }

      router.push(`/checkout/success?order_id=${createdOrderId}`);
    } catch (e: unknown) {
      setError((e as Error).message ?? "An unexpected error occurred.");
      setPhase('form');
    }
  }, [email, firstName, lastName, address, city, state, postalCode, country, items, router]);

  useImperativeHandle(ref, () => ({ completeOrder: handleCompleteOrder }), [handleCompleteOrder]);

  if (phase === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-32 border border-white/[0.06] bg-[#1f1a23]/50 rounded-xl">
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

  return (
    <div className="space-y-6">
      {/* ── Shipping Form ── */}
      <div className="border border-white/[0.06] p-5 bg-[#1f1a23]/50 rounded-xl">
        <div className="flex items-center gap-3 mb-8">
          <span className="inline-block w-1.5 h-1.5 bg-[#ddb7ff]" />
          <h2 className="font-display text-3xl uppercase tracking-wide text-[#eadfed]">Shipping</h2>
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
            <label htmlFor="country" className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">Country</label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-transparent border border-white/[0.06] rounded-lg px-3 py-2.5 font-mono text-sm text-white/80 outline-none focus:border-[#ddb7ff]/60"
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

      {/* ── Payment Method ── */}
      <div className="border border-white/[0.06] p-5 bg-[#1f1a23]/50 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-block w-1.5 h-1.5 bg-[#ddb7ff]" />
          <h2 className="font-display text-3xl uppercase tracking-wide text-[#eadfed]">Payment</h2>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setPaymentMethod('demo')}
              className={`w-full flex items-center justify-between p-4 border transition-colors text-left rounded-xl ${
              paymentMethod === 'demo'
                ? 'border-[#ddb7ff]/40 bg-[#ddb7ff]/5'
                : 'border-white/[0.08] bg-transparent hover:border-white/[0.15]'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                paymentMethod === 'demo' ? 'border-[#ddb7ff]' : 'border-white/20'
              }`}>
                {paymentMethod === 'demo' && <div className="w-2.5 h-2.5 bg-[#ddb7ff]" />}
              </div>
              <div>
                <span className="font-mono text-xs uppercase text-white/70">Demo Payment</span>
                <span className="font-mono text-[9px] uppercase text-green-400/70 block mt-0.5">Active</span>
              </div>
            </div>
            <span className="font-mono text-[9px] uppercase text-white/35">Test Mode</span>
          </button>

          <button
            disabled
            className="w-full flex items-center justify-between p-4 border border-white/[0.05] bg-transparent opacity-50 cursor-not-allowed text-left rounded-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 border-2 border-white/10" />
              <div>
                <span className="font-mono text-xs uppercase text-white/55">Razorpay</span>
                <span className="font-mono text-[9px] uppercase text-white/35 block mt-0.5">Coming Soon</span>
              </div>
            </div>
            <span className="font-mono text-[9px] uppercase text-white/25">Unavailable</span>
          </button>
        </div>
      </div>
    </div>
  );
});

function WalletModule() {
  return (
    <div className="border border-white/[0.06] p-5 bg-[#1f1a23]/50 rounded-xl">
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-block w-1.5 h-1.5 bg-[#ddb7ff]" />
        <h2 className="font-display text-3xl uppercase tracking-wide text-[#eadfed]">Loyalty</h2>
      </div>
      <div className="p-4 border border-[#ddb7ff]/15 bg-[#ddb7ff]/5 flex items-center justify-between rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#ddb7ff]/10 border border-[#ddb7ff]/30 flex items-center justify-center rounded-lg">
            <span className="text-[#ddb7ff] text-sm">✦</span>
          </div>
          <div>
            <div className="font-mono text-xs text-white/80">Member Balance</div>
            <div className="font-mono text-[10px] text-[#ddb7ff]/70 mt-0.5">2,450 Reward Points</div>
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/55">Active</span>
      </div>
    </div>
  );
}

function MultiStoreOffers() {
  const addItem = useCartStore((s) => s.addItem);
  const [appliedPromo, setAppliedPromo] = useState(false);

  const handleAddCrossSell = () => {
    addItem({
      id: "snb-beanie-default-os",
      productId: "prod_beanie_001",
      name: "SNB Beanie",
      price: 499,
      quantity: 1,
      color: "Default",
      size: "O/S",
      image: "/assets/products/stick-no-bills/image-1.jpg",
    });
  };

  const handleAddRecommended = () => {
    addItem({
      id: "run-shorts-black-m",
      productId: "prod_shorts_001",
      name: "playR Run Shorts",
      price: 1499,
      quantity: 1,
      color: "Black",
      size: "M",
      image: "/assets/run-shorts.jpeg",
    });
  };

  const handleAddBundle = () => {
    addItem({
      id: "snb-socks-white-m",
      productId: "prod_socks_001",
      name: "SNB Socks (Bundle)",
      price: 399,
      quantity: 1,
      color: "White",
      size: "M",
      image: "/assets/products/inspired/image-1.jpg",
    });
    addItem({
      id: "snb-cap-black-os",
      productId: "prod_cap_001",
      name: "SNB Cap (Bundle)",
      price: 500,
      quantity: 1,
      color: "Black",
      size: "O/S",
      image: "/assets/products/inspired/image-2.jpg",
    });
  };

  return (
    <div className="border border-white/[0.06] p-5 bg-[#1f1a23]/50 rounded-xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="inline-block w-1.5 h-1.5 bg-[#ddb7ff]" />
        <h2 className="font-display text-3xl uppercase tracking-wide text-[#eadfed]">Special Offers</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cross Sell */}
        <div className="p-4 border border-white/[0.05] bg-black/20 rounded-xl flex flex-col justify-between gap-4">
          <div>
            <div className="font-mono text-[9px] text-[#ddb7ff] uppercase tracking-wider">Cross-Sell Deal</div>
            <h4 className="font-display text-lg text-white uppercase mt-1">SNB Beanie</h4>
            <p className="font-mono text-[10px] text-white/50 mt-1">Add matching beanie for only Rs. 499 (Save 50%)</p>
          </div>
          <button
            onClick={handleAddCrossSell}
            className="w-full py-2.5 bg-white/10 hover:bg-[#ddb7ff] hover:text-[#16111b] border border-white/[0.08] rounded-lg font-mono text-[10px] uppercase tracking-wider text-white transition-all cursor-pointer"
          >
            Add to Order
          </button>
        </div>

        {/* Recommended */}
        <div className="p-4 border border-white/[0.05] bg-black/20 rounded-xl flex flex-col justify-between gap-4">
          <div>
            <div className="font-mono text-[9px] text-[#ddb7ff] uppercase tracking-wider">Recommended</div>
            <h4 className="font-display text-lg text-white uppercase mt-1">playR Run Shorts</h4>
            <p className="font-mono text-[10px] text-white/50 mt-1">Complete your look with our lightweight shorts</p>
          </div>
          <button
            onClick={handleAddRecommended}
            className="w-full py-2.5 bg-white/10 hover:bg-[#ddb7ff] hover:text-[#16111b] border border-white/[0.08] rounded-lg font-mono text-[10px] uppercase tracking-wider text-white transition-all cursor-pointer"
          >
            Add to Order
          </button>
        </div>

        {/* Bundle */}
        <div className="p-4 border border-white/[0.05] bg-black/20 rounded-xl flex flex-col justify-between gap-4 md:col-span-2">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <div>
              <div className="font-mono text-[9px] text-[#ddb7ff] uppercase tracking-wider">Bundle Deal</div>
              <h4 className="font-display text-lg text-white uppercase mt-1">Socks + Cap Archive Bundle</h4>
              <p className="font-mono text-[10px] text-white/50 mt-1">Add both signature accessories for only Rs. 899</p>
            </div>
            <button
              onClick={handleAddBundle}
              className="md:w-auto px-6 py-2.5 bg-white/10 hover:bg-[#ddb7ff] hover:text-[#16111b] border border-white/[0.08] rounded-lg font-mono text-[10px] uppercase tracking-wider text-white transition-all cursor-pointer"
            >
              Add Bundle
            </button>
          </div>
        </div>

        {/* Special Code Offer */}
        <div className="p-4 border border-[#ddb7ff]/20 bg-[#ddb7ff]/5 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:col-span-2">
          <div>
            <div className="font-mono text-[9px] text-[#ddb7ff] uppercase tracking-wider">Member Privilege</div>
            <h4 className="font-display text-md text-white uppercase mt-0.5">Apply NECTAR10 (10% Off order)</h4>
          </div>
          <button
            onClick={() => {
              if (appliedPromo) return;
              setAppliedPromo(true);
            }}
            disabled={appliedPromo}
            className={`px-6 py-2 border rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
              appliedPromo 
                ? "border-green-500/30 bg-green-500/10 text-green-400 cursor-default" 
                : "border-[#ddb7ff]/30 bg-[#ddb7ff]/10 text-[#ddb7ff] hover:bg-[#ddb7ff] hover:text-[#16111b]"
            }`}
          >
            {appliedPromo ? "Applied" : "Apply Code"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CheckoutItemSummary {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size: string;
  color: string;
}

function OrderSummary({ items, total }: { items: CheckoutItemSummary[]; total: number }) {
  return (
    <div className="border border-white/[0.06] bg-[#2e2832]/40 p-5 backdrop-blur-xl relative overflow-hidden rounded-xl">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#ddb7ff]/40 to-transparent" />

      <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff] mb-8 flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 bg-[#ddb7ff]" />
        Order Summary ({items.length})
      </h3>

      <div className="space-y-5 mb-8">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 group">
            <div className="w-20 h-24 bg-transparent border border-white/[0.12] overflow-hidden shrink-0 relative rounded-lg">
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
                <p className="font-mono text-[10px] text-white/50 mt-1">
                  {item.size} / {item.color}
                </p>
              </div>
              <p className="font-mono text-sm text-[#ddb7ff]">{formatPrice(item.price)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06] pt-5 space-y-3">
        <div className="flex justify-between font-mono text-xs text-white/55">
          <span>Subtotal</span>
          <span className="text-white/70">{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between font-mono text-xs text-white/55">
          <span>Shipping</span>
          <span className="text-white/45">Calculated at checkout</span>
        </div>
      </div>

      <div className="flex justify-between items-end mt-5 pt-5 border-t border-white/[0.06]">
        <span className="font-display text-2xl uppercase text-white/60">Total</span>
        <div className="text-right">
          <span className="font-display text-4xl text-[#eadfed] tracking-wide tabular-nums leading-none">{formatPrice(total)}</span>
        </div>
      </div>

      <div className="mt-6 p-3 bg-black/40 border border-white/[0.06] flex items-center gap-3 rounded-lg">
        <span className="text-white/50 text-[10px]">🔒</span>
        <p className="font-mono text-[9px] text-white/40 uppercase leading-tight tracking-[0.1em]">
          Encrypted checkout. Your information is secure.
        </p>
      </div>
    </div>
  );
}

function PromoCode() {
  const [code, setCode] = useState("");
  return (
    <div className="flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="PROMO CODE"
        className="flex-1 bg-[#1f1a23] border border-white/[0.06] px-4 py-3 font-mono text-xs text-white/60 outline-none focus:border-[#ddb7ff]/40 transition-colors placeholder:text-white/30 rounded-lg"
      />
      <button className="rounded-xl px-6 py-4 bg-[#2e2832] border border-white/[0.06] font-mono text-xs uppercase tracking-[0.15em] text-white/50 hover:bg-[#ddb7ff] hover:text-[#16111b] hover:border-[#ddb7ff] transition-all">
        Apply
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const { items } = useCartStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const formRef = useRef<{ completeOrder: () => Promise<void> }>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
    if (items.length === 0) {
      router.push("/cart");
    }
  }, [items.length, router]);

  if (!mounted || items.length === 0) return null;

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.length;

  const handleCheckout = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await formRef.current?.completeOrder();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-transparent pt-20 md:pt-32 pb-24 px-4 md:px-8 lg:px-12">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.25)_0%,transparent_10%,transparent_90%,rgba(0,0,0,0.25)_100%)]" />
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(221,183,255,0.05)_0%,transparent_55%)]" />
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,87,26,0.03)_0%,transparent_60%)]" />

        <div className="max-w-[min(98vw,2560px)] mx-auto relative z-10">
          <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-white/[0.04]" />
          <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-white/[0.02] translate-x-[7px]" />

          <div className="flex items-center justify-between mb-6 md:mb-12 border-b border-white/[0.05] pb-6">
            <div className="flex items-center gap-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ddb7ff] border border-[#ddb7ff]/40 px-3 py-1 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-[#ddb7ff]" />
                01 Shipping
              </div>
              <div className="w-6 h-px bg-white/[0.1]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">02 Payment</span>
              <div className="w-6 h-px bg-white/[0.1]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">03 Confirmation</span>
            </div>
            <div className="hidden md:block font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
              {itemCount} Items
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <CheckoutFormContent ref={formRef} />
              <WalletModule />
              <MultiStoreOffers />
              {/* CTA — always last on mobile */}
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="rounded-xl group relative block w-full py-6 text-center overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 bg-[#ddb7ff] transition-transform duration-500 group-hover:scale-y-0 origin-bottom" />
                <span className="absolute inset-0 bg-[#eadfed] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />
                <span className="relative z-10 text-sm uppercase tracking-[0.2em] text-[#16111b] font-light">
                  Complete Order
                </span>
              </button>
            </div>
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-32">
              <OrderSummary items={items} total={total} />
              <PromoCode />
            </div>
          </div>

          <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/[0.05]">
            <Link
              href="/cart"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 hover:text-white transition-colors"
            >
              ← Return to Cart
            </Link>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25">
              Secure checkout
            </span>
          </div>
        </div>

        <footer className="relative z-10 max-w-[min(98vw,2560px)] mx-auto mt-20 pt-10 pb-10 border-t border-white/[0.05]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start">
              <span className="font-display text-lg uppercase tracking-wide text-white/60">Street PlayR</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/25 mt-2">&copy; 2024 Street PlayR</span>
            </div>
            <div className="flex gap-8 font-mono text-[9px] uppercase tracking-[0.2em]">
              <Link href="/collections" className="text-white/30 hover:text-white/60 transition-colors">Collections</Link>
              <Link href="/about" className="text-white/30 hover:text-white/60 transition-colors">About</Link>
              <Link href="/contact" className="text-white/30 hover:text-white/60 transition-colors">Contact</Link>
              <Link href="/faq" className="text-white/30 hover:text-white/60 transition-colors">FAQ</Link>
            </div>
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

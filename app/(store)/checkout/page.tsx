"use client";

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatProductTitle } from "@/lib/utils/format";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

function CheckoutInput({ label, id, type = "text", value, onChange, placeholder }: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="checkout-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

const CheckoutFormContent = forwardRef<{ completeOrder: () => Promise<void> }>(function CheckoutFormContent(props, ref) {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
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
    } catch (e: any) {
      setError(e.message ?? "An unexpected error occurred.");
      setPhase('form');
    }
  }, [email, firstName, lastName, address, city, state, postalCode, country, items, router, clearCart]);

  useImperativeHandle(ref, () => ({ completeOrder: handleCompleteOrder }), [handleCompleteOrder]);

  if (phase === 'processing') {
    return (
      <div className="checkout-panel checkout-panel--processing">
        <span>Processing…</span>
      </div>
    );
  }

  return (
    <div className="checkout-stack">
      {/* ── Shipping Form ── */}
      <div className="checkout-panel">
        <h2 className="checkout-panel__title">Shipping</h2>

        <div className="checkout-fields">
          <div className="checkout-fields-row">
            <CheckoutInput id="firstName" label="First name" placeholder="First name" value={firstName} onChange={setFirstName} />
            <CheckoutInput id="lastName" label="Last name" placeholder="Last name" value={lastName} onChange={setLastName} />
          </div>
          <CheckoutInput id="email" type="email" label="Email" placeholder="email@address.com" value={email} onChange={setEmail} />
          <CheckoutInput id="address" label="Street address" placeholder="Address" value={address} onChange={setAddress} />
          <div className="checkout-fields-row checkout-fields-row--3">
            <CheckoutInput id="city" label="City" placeholder="City" value={city} onChange={setCity} />
            <CheckoutInput id="state" label="State" placeholder="State" value={state} onChange={setState} />
            <CheckoutInput id="postalCode" label="Postal code" placeholder="Postal code" value={postalCode} onChange={setPostalCode} />
          </div>
          <div className="checkout-field">
            <label htmlFor="country">Country</label>
            <select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">Select country</option>
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="AE">UAE</option>
              <option value="SG">Singapore</option>
            </select>
          </div>
        </div>

        {error && <p className="checkout-error">{error}</p>}
      </div>

      {/* ── Payment Method ── */}
      <div className="checkout-panel">
        <h2 className="checkout-panel__title">Payment</h2>

        <div className="checkout-payment-options">
          <button
            type="button"
            onClick={() => setPaymentMethod('demo')}
            className={`checkout-payment-option ${paymentMethod === 'demo' ? 'active' : ''}`}
          >
            <span className="checkout-payment-option__radio" />
            <span className="checkout-payment-option__label">
              <span>Demo Payment</span>
              <small>Active</small>
            </span>
            <span className="checkout-payment-option__tag">Test Mode</span>
          </button>

          <button type="button" disabled className="checkout-payment-option disabled">
            <span className="checkout-payment-option__radio" />
            <span className="checkout-payment-option__label">
              <span>Razorpay</span>
              <small>Coming Soon</small>
            </span>
            <span className="checkout-payment-option__tag">Unavailable</span>
          </button>
        </div>
      </div>
    </div>
  );
});

function WalletModule() {
  return (
    <div className="checkout-panel">
      <h2 className="checkout-panel__title">Loyalty</h2>
      <div className="checkout-loyalty">
        <div className="checkout-loyalty__icon">✦</div>
        <div className="checkout-loyalty__info">
          <div>Member balance</div>
          <small>2,450 Reward Points</small>
        </div>
        <span className="checkout-loyalty__status">Active</span>
      </div>
    </div>
  );
}

function OrderSummary({ items, total }: { items: any[]; total: number }) {
  return (
    <div className="checkout-summary">
      <h3 className="checkout-summary__title">Order summary ({items.length})</h3>

      <div className="checkout-summary__lines">
        {items.map((item) => (
          <div key={item.id} className="checkout-summary__line">
            <div className="checkout-summary__thumb">
              <Image src={item.image || "/images/placeholder.jpg"} alt={item.name} width={64} height={80} className="object-cover rounded" />
              <span>x{item.quantity}</span>
            </div>
            <div className="checkout-summary__line-info">
              <p>{formatProductTitle(item.name)}</p>
              <p className="checkout-summary__line-meta">{item.size} / {item.color}</p>
              <p className="checkout-summary__line-price">{formatPrice(item.price)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="checkout-summary__rows">
        <div>
          <span>Subtotal</span>
          <span>{formatPrice(total)}</span>
        </div>
        <div>
          <span>Shipping</span>
          <span className="muted">Calculated at checkout</span>
        </div>
      </div>

      <div className="checkout-summary__total">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      <p className="checkout-summary__secure">🔒 Encrypted checkout. Your information is secure.</p>
    </div>
  );
}

function PromoCode() {
  const [code, setCode] = useState("");
  return (
    <div className="checkout-promo">
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Promo code" />
      <button type="button" className="pill">Apply</button>
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
    setMounted(true);
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
      <div className="listing">
        <div className="checkout-steps">
          <span className="checkout-step active">01 Shipping</span>
          <span className="checkout-step-sep" />
          <span className="checkout-step">02 Payment</span>
          <span className="checkout-step-sep" />
          <span className="checkout-step">03 Confirmation</span>
          <span className="checkout-step-count">{itemCount} items</span>
        </div>

        <div className="checkout-grid">
          <div className="checkout-main">
            <CheckoutFormContent ref={formRef} />
            <WalletModule />
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isProcessing}
              className="checkout-submit"
            >
              {isProcessing ? 'Placing order…' : 'Complete order'}
            </button>
          </div>
          <div className="checkout-aside">
            <OrderSummary items={items} total={total} />
            <PromoCode />
          </div>
        </div>

        <div className="checkout-footer-row">
          <Link href="/cart">← Return to cart</Link>
          <span>Secure checkout</span>
        </div>
      </div>
      <Footer />
    </>
  );
}

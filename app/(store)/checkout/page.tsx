"use client";

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatProductTitle } from "@/lib/utils/format";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { maxRedeemableCredits } from "@/lib/loyalty/redemption";
import { trackBeginCheckout } from "@/lib/analytics/ecommerce";
import type { TotalsResult } from "@/lib/commerce/totals";
import type { AddressData } from "@/app/actions/address";
import { OrderPriceBreakdown } from "@/components/commerce/OrderPriceBreakdown";

function CheckoutInput({ label, id, type = "text", value, onChange, placeholder, required = false }: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
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
        required={required}
        aria-required={required}
      />
    </div>
  );
}

type QuoteView = TotalsResult & { couponDiscount: number; creditsApplied: number };

const CheckoutFormContent = forwardRef<{ completeOrder: () => Promise<void> }, {
  couponCode: string;
  onQuote: (quote: QuoteView | null) => void;
}>(function CheckoutFormContent({ couponCode, onQuote }, ref) {
  const router = useRouter();
  const { items } = useCartStore();
  const [phase, setPhase] = useState<'form' | 'processing' | 'error'>('form');
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'demo' | 'easebuzz'>('easebuzz');
  const [creditsToApply, setCreditsToApply] = useState(0);
  const [memberBalance, setMemberBalance] = useState(0);
  const [memberTier, setMemberTier] = useState<'ROOKIE' | 'PRO' | 'LEGEND' | 'CREATORS' | 'TALENT'>('ROOKIE');
  const [savedAddresses, setSavedAddresses] = useState<AddressData[]>([]);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("IN");
  const [gstin, setGstin] = useState("");

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const maxCredits = maxRedeemableCredits(memberBalance, subtotal, memberTier);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getProfileAction } = await import('@/app/actions/auth');
        const profile = await getProfileAction();
        if (!cancelled) {
          const balance = profile?.sprrBalance ?? 0;
          const tier = (profile?.tier as 'ROOKIE' | 'PRO' | 'LEGEND' | 'CREATORS' | 'TALENT') || 'ROOKIE';
          setMemberBalance(balance);
          setMemberTier(tier);
          setCreditsToApply((prev) => Math.min(prev, maxRedeemableCredits(balance, subtotal, tier)));
          if (profile?.email) setEmail((prev) => prev || profile.email || '');
          if (profile?.name) {
            const parts = String(profile.name).split(' ');
            setFirstName((prev) => prev || parts[0] || '');
            setLastName((prev) => prev || parts.slice(1).join(' '));
          }
        }
      } catch {
        if (!cancelled) setMemberBalance(0);
      }
      try {
        const { getAddressesAction } = await import('@/app/actions/address');
        const result = await getAddressesAction();
        if (!cancelled && result.success && result.data) {
          setSavedAddresses(result.data);
          const primary = result.data.find((a) => a.is_primary) ?? result.data[0];
          if (primary) applySaved(primary);
        }
      } catch { /* no saved addresses */ }
    })();
    return () => {
      cancelled = true;
    };
  }, [subtotal]);

  const applySaved = (row: AddressData) => {
    setAddress(row.line1);
    setCity(row.city);
    setState(row.state);
    setPostalCode(row.pincode);
    setPhone(row.phone || phone);
    const parts = (row.name || '').split(' ');
    if (parts[0]) setFirstName(parts[0]);
    if (parts.length > 1) setLastName(parts.slice(1).join(' '));
    setCountry('IN');
  };

  useEffect(() => {
    if (!items.length) {
      onQuote(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const { quoteCheckoutAction } = await import('@/app/actions/checkout');
        const result = await quoteCheckoutAction({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.id,
            quantity: i.quantity,
            price: i.price,
          })),
          country,
          state,
          gstin: gstin.trim() || undefined,
          creditsToApply,
          couponCode: couponCode || undefined,
        });
        if (!cancelled) onQuote(result.success && result.data ? result.data : null);
      } catch {
        if (!cancelled) onQuote(null);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [items, country, state, gstin, creditsToApply, couponCode, onQuote]);

  const handleCompleteOrder = useCallback(async () => {
    // GSTIN is optional (B2B) — never part of this required check.
    if (!email || !firstName || !lastName || !address || !city || !country) {
      setError("Please fill in all required fields.");
      return;
    }
    if (paymentMethod === 'easebuzz' && !phone) {
      setError("Phone number is required for card/UPI/netbanking payment.");
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
        name: `${firstName} ${lastName}`.trim(),
        line1: address,
        city,
        state,
        postalCode,
        country,
        phone,
        email,
        gstin: gstin.trim() || undefined,
      }, undefined, creditsToApply, couponCode || undefined);

      if (!checkout.success) {
        setError(checkout.error ?? "Checkout failed.");
        setPhase('form');
        return;
      }

      const createdOrderId = checkout.data!.orderId;

      if (paymentMethod === 'easebuzz') {
        const { createEasebuzzPaymentAction } = await import('@/app/actions/easebuzz');
        const session = await createEasebuzzPaymentAction({
          orderId: createdOrderId,
          customerName: `${firstName} ${lastName}`.trim(),
          customerEmail: email,
          customerPhone: phone,
        });

        if (!session.success || !session.data) {
          setError(session.error ?? "Could not start payment. Please try again.");
          setPhase('form');
          return;
        }

        window.location.href = session.data.paymentUrl;
        return;
      }

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
  }, [email, firstName, lastName, phone, address, city, state, postalCode, country, gstin, items, router, paymentMethod, creditsToApply, couponCode]);

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
      <div className="checkout-panel">
        <h2 className="checkout-panel__title">Shipping</h2>
        {error && <p className="checkout-error" role="alert">{error}</p>}

        {savedAddresses.length > 0 && (
          <div className="checkout-fields" style={{ marginBottom: 16 }}>
            <label htmlFor="savedAddress">Saved address</label>
            <select
              id="savedAddress"
              onChange={(e) => {
                const row = savedAddresses.find((a) => a.id === e.target.value);
                if (row) applySaved(row);
              }}
              defaultValue={savedAddresses.find((a) => a.is_primary)?.id ?? savedAddresses[0]?.id}
            >
              {savedAddresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label || a.line1} · {a.pincode}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="checkout-fields">
          <div className="checkout-fields-row">
            <CheckoutInput id="firstName" label="First name" placeholder="First name" value={firstName} onChange={setFirstName} />
            <CheckoutInput id="lastName" label="Last name" placeholder="Last name" value={lastName} onChange={setLastName} />
          </div>
          <div className="checkout-fields-row">
            <CheckoutInput id="email" type="email" label="Email" placeholder="email@address.com" value={email} onChange={setEmail} />
            <CheckoutInput id="phone" type="tel" label="Phone" placeholder="10-digit mobile number" value={phone} onChange={setPhone} />
          </div>
          <CheckoutInput id="address" label="Street address" placeholder="Address" value={address} onChange={setAddress} />
          <div className="checkout-fields-row checkout-fields-row--3">
            <CheckoutInput id="city" label="City" placeholder="City" value={city} onChange={setCity} />
            <CheckoutInput id="state" label="State" placeholder="State" value={state} onChange={setState} />
            <CheckoutInput id="postalCode" label="PIN / Postal code" placeholder="560001" value={postalCode} onChange={setPostalCode} />
          </div>
          <div className="checkout-field">
            <label htmlFor="country">Country</label>
            <select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="AE">UAE</option>
              <option value="SG">Singapore</option>
            </select>
          </div>
          <CheckoutInput
            id="gstin"
            label="GSTIN (optional, B2B)"
            placeholder="22AAAAA0000A1Z5"
            value={gstin}
            onChange={setGstin}
            required={false}
          />
        </div>
      </div>

      <div className="checkout-panel">
        <h2 className="checkout-panel__title">Loyalty</h2>
        <div className="checkout-loyalty">
          <div className="checkout-loyalty__icon">✦</div>
          <div className="checkout-loyalty__info">
            <div>Member balance</div>
            <small>{memberBalance.toLocaleString('en-IN')} credits · max {maxCredits.toLocaleString('en-IN')} this order (50%)</small>
          </div>
          <span className="checkout-loyalty__status">{memberBalance > 0 ? 'Active' : 'Empty'}</span>
        </div>
        {maxCredits > 0 && (
          <label className="checkout-loyalty-apply">
            Apply credits
            <input
              type="range"
              min={0}
              max={maxCredits}
              step={1}
              value={Math.min(creditsToApply, maxCredits)}
              onChange={(e) => setCreditsToApply(Number(e.target.value))}
              className="pdp__credits-range"
              aria-label="Member credits to redeem"
            />
            <span>{Math.min(creditsToApply, maxCredits)} / {maxCredits}</span>
          </label>
        )}
      </div>

      <div className="checkout-panel">
        <h2 className="checkout-panel__title">Payment</h2>

        <div className="checkout-payment-options">
          <button
            type="button"
            onClick={() => setPaymentMethod('easebuzz')}
            className={`checkout-payment-option ${paymentMethod === 'easebuzz' ? 'active' : ''}`}
          >
            <span className="checkout-payment-option__radio" />
            <span className="checkout-payment-option__label">
              <span>Card / UPI / NetBanking</span>
              <small>Powered by Easebuzz</small>
            </span>
            <span className="checkout-payment-option__tag">Secure</span>
          </button>

          {process.env.NODE_ENV !== 'production' && (
            <button
              type="button"
              onClick={() => setPaymentMethod('demo')}
              className={`checkout-payment-option ${paymentMethod === 'demo' ? 'active' : ''}`}
            >
              <span className="checkout-payment-option__radio" />
              <span className="checkout-payment-option__label">
                <span>Demo Payment</span>
                <small>Skips real gateway</small>
              </span>
              <span className="checkout-payment-option__tag">Test Mode</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

function OrderSummary({ items, quote }: {
  items: any[];
  quote: QuoteView | null;
}) {
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
        <OrderPriceBreakdown
          subtotal={quote?.subtotal ?? 0}
          discount={quote?.discount ?? 0}
          shipping={quote?.shipping ?? null}
          tax={quote?.tax ?? null}
          grandTotal={quote?.grandTotal ?? null}
          pending={!quote}
          includeTotal={false}
        />
      </div>

      <div className="checkout-summary__total">
        <span>Total</span>
        <span>{quote ? formatPrice(quote.grandTotal) : '…'}</span>
      </div>

      <p className="checkout-summary__secure">
        Shipping and GST are calculated on the server.
      </p>
    </div>
  );
}

function PromoCode({ onApplied }: { onApplied: (code: string, error?: string) => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const { items } = useCartStore();
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="checkout-promo">
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Promo code" />
      <button
        type="button"
        className="pill"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const { applyCouponQuoteAction } = await import('@/app/actions/order');
            const result = await applyCouponQuoteAction(code, subtotal);
            if (result.ok) onApplied(result.data.code);
            else onApplied('', result.error);
          } finally {
            setBusy(false);
          }
        }}
      >
        Apply
      </button>
    </div>
  );
}

function CheckoutPageInner() {
  const { items } = useCartStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const formRef = useRef<{ completeOrder: () => Promise<void> }>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteView | null>(null);
  const [retryBusy, setRetryBusy] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const retryOrderId = searchParams.get('order_id');
  const paymentFailed = searchParams.get('error') === 'payment_failed';
  const paymentPending = searchParams.get('pending') === '1';

  useEffect(() => {
    setMounted(true);
    if (items.length === 0 && !retryOrderId) {
      router.push("/cart");
    }
    if (items.length > 0) {
      trackBeginCheckout(
        items.reduce((s, i) => s + i.price * i.quantity, 0),
        items.map((i) => ({ item_id: i.productId, item_name: i.name, price: i.price, quantity: i.quantity }))
      );
    }
  }, [items.length, router, retryOrderId, items]);

  if (!mounted || (items.length === 0 && !retryOrderId)) return null;

  const handleCheckout = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await formRef.current?.completeOrder();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    if (!retryOrderId || retryBusy) return;
    setRetryBusy(true);
    setRetryError(null);
    try {
      const { retryPaymentAction, getOrderAction } = await import('@/app/actions/order');
      const payable = await retryPaymentAction(retryOrderId);
      if (!payable.success) {
        setRetryError(payable.error ?? 'Order is not payable.');
        return;
      }
      const order = await getOrderAction(retryOrderId);
      const ship = (order.data?.shippingAddress ?? {}) as { name?: string; email?: string; phone?: string };
      const { createEasebuzzPaymentAction } = await import('@/app/actions/easebuzz');
      const session = await createEasebuzzPaymentAction({
        orderId: retryOrderId,
        customerName: ship.name || 'Customer',
        customerEmail: ship.email || '',
        customerPhone: ship.phone || '',
      });
      if (!session.success || !session.data) {
        setRetryError(session.error ?? 'Could not restart payment.');
        return;
      }
      window.location.href = session.data.paymentUrl;
    } catch (e: any) {
      setRetryError(e.message ?? 'Retry failed.');
    } finally {
      setRetryBusy(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="listing listing--checkout">
        <div className="checkout-steps">
          <div className="checkout-steps__track">
            <span className="checkout-step active">
              <span className="checkout-step__idx">01</span>
              <span className="checkout-step__name">Shipping</span>
            </span>
            <span className="checkout-step-sep" aria-hidden="true" />
            <span className="checkout-step">
              <span className="checkout-step__idx">02</span>
              <span className="checkout-step__name">Payment</span>
            </span>
            <span className="checkout-step-sep" aria-hidden="true" />
            <span className="checkout-step">
              <span className="checkout-step__idx">03</span>
              <span className="checkout-step__name">Confirmation</span>
            </span>
          </div>
        </div>

        {(paymentFailed || paymentPending) && retryOrderId && (
          <div className="checkout-panel" style={{ marginBottom: 24 }}>
            <h2 className="checkout-panel__title">
              {paymentFailed ? 'Payment failed' : 'Payment pending'}
            </h2>
            <p className="checkout-summary__secure">
              Your cart was not cleared. Retry payment for this order, or place a new one.
            </p>
            <button
              type="button"
              className="checkout-submit storefront-cta"
              disabled={retryBusy}
              onClick={handleRetry}
            >
              {retryBusy ? 'Restarting payment…' : 'Retry payment'}
            </button>
            {retryError && <p className="checkout-error">{retryError}</p>}
          </div>
        )}

        {items.length > 0 && (
          <div className="checkout-grid">
            <div className="checkout-main">
              <CheckoutFormContent ref={formRef} couponCode={couponCode} onQuote={setQuote} />
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isProcessing}
                className="checkout-submit storefront-cta"
              >
                {isProcessing ? 'Placing order…' : 'Complete order'}
              </button>
            </div>
            <div className="checkout-aside">
              <OrderSummary items={items} quote={quote} />
              <PromoCode
                onApplied={(code, err) => {
                  setCouponCode(code);
                  setCouponError(err ?? null);
                }}
              />
              {couponCode && <p className="checkout-summary__secure">Applied: {couponCode}</p>}
              {couponError && <p className="checkout-error">{couponError}</p>}
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="checkout-sticky-bar">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isProcessing}
              className="checkout-submit storefront-cta"
            >
              {isProcessing ? 'Placing order…' : 'Complete order'}
            </button>
          </div>
        )}

        <div className="checkout-footer-row">
          <Link href="/cart">← Return to cart</Link>
          <span>Secure checkout</span>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent" />}>
      <CheckoutPageInner />
    </Suspense>
  );
}

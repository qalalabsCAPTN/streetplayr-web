'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartContext';
import { formatPrice } from '@/lib/utils/format';
import { OrderPriceBreakdown } from '@/components/commerce/OrderPriceBreakdown';
import { percentFromTaxRate } from '@/lib/commerce/totals';
import { useServerCartQuote } from '@/components/cart/useServerCartQuote';

type Suggest = { handle: string; title: string; price: number; images: string[] };

export default function CartDrawer() {
  const cart = useCart();
  const [suggestions, setSuggestions] = useState<Suggest[]>([]);
  const quote = useServerCartQuote(cart.items.map((line: { key: string; qty: number }) => ({ key: line.key, qty: line.qty })));

  useEffect(() => {
    if (!cart.open || suggestions.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const { loadClientCatalog } = await import('@/lib/products/client-catalog');
        const catalog = await loadClientCatalog();
        if (cancelled) return;
        setSuggestions(
          catalog.slice(0, 6).map((p) => ({
            handle: p.slug,
            title: p.name,
            price: p.price,
            images: [p.image].filter(Boolean),
          }))
        );
      } catch (err) {
        console.warn('[CartDrawer] catalog load failed:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cart.open, suggestions.length]);

  return (
    <>
      <div className={`scrim ${cart.open ? 'open' : ''}`} onClick={() => cart.setOpen(false)} />
      <aside
        className={`drawer ${cart.open ? 'open' : ''}`}
        aria-hidden={!cart.open}
        inert={!cart.open ? true : undefined}
      >
        <div className="drawer__head">
          <h3>Your bag ({cart.count})</h3>
          <button
            type="button"
            className="drawer__close"
            onClick={() => cart.setOpen(false)}
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        <div className="drawer__body">
          {cart.items.length === 0 ? (
            <div className="drawer__empty">
              <h2>Your bag is empty!</h2>
              <p>Let&apos;s get started</p>
              <Link href="/collections" className="storefront-cta" onClick={() => cart.setOpen(false)}>
                Shop now
              </Link>
              {suggestions.length > 0 && (
                <div className="drawer__suggest">
                  <h4>Products you may like</h4>
                  <div className="drawer__suggest-track">
                    {suggestions.map((p) => (
                      <Link key={p.handle} href={`/product/${p.handle}`} onClick={() => cart.setOpen(false)}>
                        {p.images[0] ? (
                          <Image src={p.images[0]} alt={p.title} width={80} height={100} className="object-cover rounded" />
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            cart.items.map((line: any) => (
              <div key={line.key} className="cartline">
                <Image src={line.product.images[0]} alt={line.product.title} width={80} height={100} className="object-cover rounded" />
                <div className="cartline__info">
                  <div className="cartline__title">{line.product.title}</div>
                  <div className="cartline__meta">
                    Size: {line.size} · {formatPrice(line.product.price)}
                  </div>
                  <div className="cartline__actions">
                    <div className="qty">
                      <button type="button" onClick={() => cart.updateQty(line.key, -1)}>−</button>
                      <span>{line.qty}</span>
                      <button type="button" onClick={() => cart.updateQty(line.key, 1)}>+</button>
                    </div>
                    <button type="button" className="cartline__remove" onClick={() => cart.removeItem(line.key)}>
                      Remove
                    </button>
                  </div>
                </div>
                <div className="cartline__price">{formatPrice(line.product.price * line.qty)}</div>
              </div>
            ))
          )}
        </div>

        {cart.items.length > 0 && (
          <div className="drawer__foot">
            <div className="drawer__breakdown">
              <OrderPriceBreakdown
                subtotal={quote?.subtotal ?? 0}
                discount={quote?.discount ?? 0}
                shipping={quote?.shipping ?? null}
                tax={quote?.tax ?? null}
                grandTotal={quote?.grandTotal ?? null}
                taxPercent={quote ? percentFromTaxRate(quote.taxRate) : null}
                pending={!quote}
              />
            </div>
            <Link href="/checkout" className="drawer__checkout storefront-cta" onClick={() => cart.setOpen(false)}>
              Check out
            </Link>
          </div>
        )}
      </aside>
      <div className={`toast ${cart.toast ? 'show' : ''}`}>{cart.toast}</div>
    </>
  );
}

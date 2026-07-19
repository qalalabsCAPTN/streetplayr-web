'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import { LOCAL_PRODUCTS } from '@/lib/products/data';
import { formatPrice } from '@/lib/utils/format';

export default function CartDrawer() {
  const cart = useCart();
  
  const suggestions = LOCAL_PRODUCTS.slice(0, 6).map((p) => ({
    handle: p.slug,
    title: p.name,
    price: p.price,
    images: [p.image_url],
  }));

  return (
    <>
      <div className={`scrim ${cart.open ? 'open' : ''}`} onClick={() => cart.setOpen(false)} />
      <aside className={`drawer ${cart.open ? 'open' : ''}`}>
        <div className="drawer__head">
          <h3>Your bag ({cart.count})</h3>
          <button onClick={() => cart.setOpen(false)} aria-label="Close cart" style={{ fontSize: 22 }}>
            ×
          </button>
        </div>

        <div className="drawer__body">
          {cart.items.length === 0 ? (
            <div className="drawer__empty">
              <h2>Your bag is empty!</h2>
              <p>Let&apos;s get started</p>
              <Link href="/collections" className="pill" onClick={() => cart.setOpen(false)}>
                Shop now
              </Link>
              <div className="drawer__suggest">
                <h4>Products you may like</h4>
                <div className="drawer__suggest-track">
                  {suggestions.map((p) => (
                    <Link key={p.handle} href={`/product/${p.handle}`} onClick={() => cart.setOpen(false)}>
                      <img src={p.images[0]} alt={p.title} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            cart.items.map((line: any) => (
              <div key={line.key} className="cartline">
                <img src={line.product.images[0]} alt={line.product.title} />
                <div className="cartline__info">
                  <div className="cartline__title">{line.product.title}</div>
                  <div className="cartline__meta">
                    Size: {line.size} · {formatPrice(line.product.price)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="qty">
                      <button onClick={() => cart.updateQty(line.key, -1)}>−</button>
                      <span>{line.qty}</span>
                      <button onClick={() => cart.updateQty(line.key, 1)}>+</button>
                    </div>
                    <button className="cartline__remove" onClick={() => cart.removeItem(line.key)}>
                      Remove
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{formatPrice(line.product.price * line.qty)}</div>
              </div>
            ))
          )}
        </div>

        {cart.items.length > 0 && (
          <div className="drawer__foot">
            <div className="drawer__total">
              <span>Estimated total</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
            <p className="drawer__note">Taxes included. Discounts and shipping calculated at checkout.</p>
            <Link href="/checkout" className="drawer__checkout" style={{ display: 'block', textAlign: 'center', lineHeight: '46px', textDecoration: 'none' }} onClick={() => cart.setOpen(false)}>
              Check out
            </Link>
          </div>
        )}
      </aside>
      <div className={`toast ${cart.toast ? 'show' : ''}`}>{cart.toast}</div>
    </>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartContext';
import { formatPrice } from '@/lib/utils/format';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function CartPage() {
  const cart = useCart();

  return (
    <>
      <Navbar />
      <div className="listing">
      <div className="listing__head">
        <h1 className="listing__title">Shopping bag {cart.count > 0 ? `(${cart.count})` : ''}</h1>
      </div>

      {cart.items.length === 0 ? (
        <div style={{ padding: '60px 4px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, marginBottom: 20 }}>Your bag is empty.</p>
          <Link href="/collections" className="storefront-cta">
            Shop now
          </Link>
        </div>
      ) : (
        <div className="cart-page-grid">
          <div className="cart-page-lines">
            {cart.items.map((line: any) => (
              <div key={line.key} className="cartline">
                <Image src={line.product.images[0]} alt={line.product.title} width={80} height={100} className="object-cover rounded" />
                <div className="cartline__info">
                  <div className="cartline__title">{line.product.title}</div>
                  <div className="cartline__meta">
                    Size: {line.size} · {formatPrice(line.product.price)}
                  </div>
                  <div className="cartline__actions">
                    <div className="qty">
                      <button onClick={() => cart.updateQty(line.key, -1)}>−</button>
                      <span>{line.qty}</span>
                      <button onClick={() => cart.updateQty(line.key, 1)}>+</button>
                    </div>
                    <button type="button" className="cartline__remove" onClick={() => cart.removeItem(line.key)}>
                      Remove
                    </button>
                  </div>
                </div>
                <div className="cartline__price">{formatPrice(line.product.price * line.qty)}</div>
              </div>
            ))}
          </div>

          <aside className="cart-page-summary">
            <div className="drawer__total">
              <span>Estimated total</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
            <p className="drawer__note">Taxes included. Discounts and shipping calculated at checkout.</p>
            <Link href="/checkout" className="drawer__checkout storefront-cta">
              Check out
            </Link>
          </aside>
        </div>
      )}
      </div>
      <Footer />
    </>
  );
}

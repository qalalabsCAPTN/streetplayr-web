'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartContext';

const Icon = {
  compass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M15.2 8.8 12.9 12.9 8.8 15.2l2.3-4.1 4.1-2.3Z" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5 8h14l-1.2 12.2a1.8 1.8 0 0 1-1.8 1.8H8a1.8 1.8 0 0 1-1.8-1.8L5 8Z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </svg>
  ),
};

interface MobileNavProps {
  onSearch: () => void;
  onAccount: () => void;
}

export default function MobileNav({ onSearch, onAccount }: MobileNavProps) {
  const cart = useCart();

  return (
    <nav className="mobilenav" aria-label="Primary">
      <Link href="/" className="mobilenav__item" aria-label="Explore">
        {Icon.compass}
      </Link>
      <button className="mobilenav__item" aria-label="Account" onClick={onAccount}>
        {Icon.user}
      </button>
      <Link href="/collections" className="mobilenav__item" aria-label="Stores">
        {Icon.pin}
      </Link>
      <button className="mobilenav__item" aria-label="Search" onClick={onSearch}>
        {Icon.search}
      </button>
      <button className="mobilenav__item mobilenav__item--bag" aria-label="Bag" onClick={() => cart.setOpen(true)}>
        <span className="mobilenav__ring">{Icon.bag}</span>
        {cart.count > 0 && <span className="mobilenav__count">{cart.count}</span>}
      </button>
    </nav>
  );
}

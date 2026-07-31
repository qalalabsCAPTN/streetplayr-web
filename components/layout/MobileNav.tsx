'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import { stories } from '@/lib/bluorng-data';

const Icon = {
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
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
  onStories: () => void;
}

/**
 * Mobile dock: [ nav pill ] + separate Stories circle
 * (same avatar as Desktop Header `.iconbtn--story`).
 */
export default function MobileNav({ onSearch, onAccount, onStories }: MobileNavProps) {
  const cart = useCart();

  return (
    <div className="mobilenav-dock">
      <nav className="mobilenav" aria-label="Primary">
        <Link href="/collections" className="mobilenav__item" aria-label="Collections">
          {Icon.grid}
        </Link>
        <button type="button" className="mobilenav__item" aria-label="Search" onClick={onSearch}>
          {Icon.search}
        </button>
        <button type="button" className="mobilenav__item" aria-label="Account" onClick={onAccount}>
          {Icon.user}
        </button>
        <button
          type="button"
          className="mobilenav__item mobilenav__item--bag"
          aria-label="Bag"
          onClick={() => cart.setOpen(true)}
        >
          <span className="mobilenav__ring">{Icon.bag}</span>
          {cart.count > 0 && <span className="mobilenav__count">{cart.count}</span>}
        </button>
      </nav>

      <button
        type="button"
        className="iconbtn iconbtn--story mobilenav__lookbook"
        aria-label="Stories"
        onClick={onStories}
      >
        <img src={stories[0].image} alt="" />
      </button>
    </div>
  );
}

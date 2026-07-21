'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';
import { useAuthStore } from '@/store/authStore';
import { stories } from '@/lib/bluorng-data';
import StoryViewer from './StoryViewer';
import MobileNav from './MobileNav';
import LoginModal from '@/components/auth/LoginModal';

const Icon = {
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
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  ),
  bookmark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6 3.5A1.5 1.5 0 0 1 7.5 2h9A1.5 1.5 0 0 1 18 3.5V22l-6-4-6 4V3.5Z" />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5 8h14l-1.2 12.2a1.8 1.8 0 0 1-1.8 1.8H8a1.8 1.8 0 0 1-1.8-1.8L5 8Z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8h16M4 16h16" />
    </svg>
  ),
};

const menu = {
  featured: [
    { label: 'Latest Drop', href: '/collections?category=new-in' },
    { label: 'Topwear', href: '/collections?category=tees' },
    { label: 'Bottomwear', href: '/collections?category=pants' },
    { label: 'Tank Tops', href: '/collections?category=tanks' },
  ],
  tees: [
    { label: 'WARRIOR Graphic', href: '/product/black-warrior' },
    { label: 'INSPIRED Graphic', href: '/product/inspired' },
    { label: 'Waffle Textured', href: '/product/ctt-waffle' },
    { label: 'Stick No Bills', href: '/product/stick-no-bills' },
  ],
  pants: [
    { label: 'Carpenter Grey', href: '/product/carpenter-grey' },
    { label: 'Carpenter Olive', href: '/product/carpenter-grey' },
  ],
  shop: [
    { label: 'All Products', href: '/collections' },
    { label: 'New In', href: '/collections' },
  ],
};

export default function Navbar() {
  const [megaOpen, setMegaOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('dark');
  const [products, setProducts] = useState<any[]>([]);

  const cart = useCart();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loginOpen, setLoginOpen] = useState(false);
  const router = useRouter();

  const handleAccount = () => {
    if (isAuthenticated) {
      router.push('/profile');
    } else {
      setLoginOpen(true);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('playr-theme') || 'dark';
    setTheme(saved);
  }, []);

  useEffect(() => {
    const root = document.querySelector('.storefront-root');
    if (root) {
      if (theme === 'dark') {
        root.classList.add('theme-dark');
        document.body.classList.add('theme-dark');
      } else {
        root.classList.remove('theme-dark');
        document.body.classList.remove('theme-dark');
      }
    }
  }, [theme]);

  // Load products for dynamic search
  useEffect(() => {
    async function loadProducts() {
      try {
        const { getLocalActiveProducts } = await import('@/lib/products/data');
        const local = getLocalActiveProducts();
        
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!url || url.includes('mockproject')) {
          setProducts(local);
          return;
        }

        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('products')
          .select('id, title, slug, featured_image_url, metadata, status, product_variants(id, price)')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
          setProducts(local);
          return;
        }

        const mapped = data.map((p) => {
          const prices = (p.product_variants ?? []).map((v: any) => v.price).filter(Boolean);
          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
          return {
            id: p.id,
            name: p.title,
            price: minPrice,
            slug: p.slug,
            image: p.featured_image_url,
          };
        });
        setProducts(mapped);
      } catch (err) {
        console.error('Failed to load products for search:', err);
      }
    }
    loadProducts();
  }, []);

  const toggleTheme = () => {
    const next = theme === 'default' ? 'dark' : 'default';
    setTheme(next);
    localStorage.setItem('playr-theme', next);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // On mobile, the header stays transparent over the top of every page until
  // the user scrolls — desktop keeps the route-based solid background.
  const solid = scrolled || megaOpen || searchOpen || (!isMobile && pathname !== '/');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('hdr-solid', solid);
  }, [solid]);

  return (
    <>
      <header 
        className={`header ${solid ? 'header--solid' : ''}`} 
        onMouseLeave={() => {
          if (typeof window !== 'undefined' && window.innerWidth > 900) {
            setMegaOpen(false);
          }
        }}
      >
        <div className="header__inner">
          <nav className="header__nav header__nav--desktop">
            <Link href="/collections" className="header__link">
              Shop
            </Link>
            <button 
              className="header__link" 
              onMouseEnter={() => setMegaOpen(true)} 
              onClick={() => setMegaOpen((v) => !v)}
            >
              Collections
            </button>
          </nav>

          <div className="header__logo">
            <button className="header__pill-plus" onClick={() => setMegaOpen((v) => !v)} aria-label="Menu">
              +
            </button>
            <Link href="/home" className="header__pill-link">
              <img src="/playR.street logo.png" alt="playR" />
            </Link>
          </div>

          <div className="header__right">
            <div
              className="theme-toggle"
              onClick={toggleTheme}
              role="button"
              aria-label="Toggle dark theme"
            >
              <div className="theme-toggle__thumb">
                {theme === 'default' ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '10px', height: '10px', display: 'block' }}>
                    <path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0-7a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zM5.64 4.22a1 1 0 0 1 0 1.42l-1.42 1.41a1 1 0 0 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0zm14.14 14.14a1 1 0 0 1 0 1.42l-1.42 1.41a1 1 0 0 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0zM3 11a1 1 0 1 1 0 2H1a1 1 0 1 1 0-2h2zm18 0a1 1 0 1 1 0 2h-2a1 1 0 1 1 0-2h2zm-12.76 4.76a1 1 0 0 1 0 1.42l-1.42 1.41a1 1 0 0 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0zm14.14-14.14a1 1 0 0 1 0 1.42l-1.42 1.41a1 1 0 0 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '10px', height: '10px', display: 'block' }}>
                    <path d="M12.3 22h-.1c-5.5 0-10-4.5-10-10 0-4.8 3.5-8.9 8.2-9.8.6-.1 1.2.3 1.3.9.1.6-.2 1.2-.8 1.4-3.5 1.1-5.7 4.5-5.7 8.1 0 4.4 3.6 8 8 8 3.6 0 7-2.2 8.1-5.7.2-.6.8-.9 1.4-.8.6.1 1 .7.9 1.3-.9 4.7-5 8.2-9.8 8.2z" />
                  </svg>
                )}
              </div>
            </div>

            <button 
              className="iconbtn iconbtn--story hide-mobile" 
              onClick={() => setStoryOpen(true)} 
              aria-label="Stories"
            >
              <img src={stories[0].image} alt="" />
            </button>
            <Link href="/collections" className="iconbtn hide-mobile" aria-label="Stores">
              {Icon.pin}
            </Link>
            <button
              className={`iconbtn hide-mobile ${searchOpen ? 'active' : ''}`}
              onClick={() => {
                setSearchOpen((v) => !v);
                setMegaOpen(false);
                setSearchQuery('');
              }}
              aria-label="Search"
            >
              {Icon.search}
            </button>
            <button
              className="iconbtn hide-mobile"
              aria-label="Account"
              onClick={handleAccount}
            >
              {Icon.user}
            </button>
            <button 
              className="iconbtn" 
              aria-label="Wishlist" 
              onClick={() => cart.showToast('Wishlist feature coming soon')}
            >
              {Icon.bookmark}
            </button>
            <button className="iconbtn" onClick={() => cart.setOpen(true)} aria-label="Bag">
              {Icon.bag}
              {cart.count > 0 && <span className="iconbtn__count">{cart.count}</span>}
            </button>
            <button 
              className="iconbtn iconbtn--menu hide-mobile" 
              onClick={() => setMegaOpen((v) => !v)} 
              aria-label="Menu"
            >
              {Icon.menu}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="header__search-bar">
            <div className="header__search-input-wrap">
              <input
                type="text"
                placeholder="Search here....."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <span className="header__search-icon-inside">{Icon.search}</span>
            </div>
            <button 
              className="header__search-close" 
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
            >
              &times;
            </button>
          </div>
        )}

        {searchOpen && (
          <div className="header__search-dropdown">
            {searchQuery.trim() === '' ? (
              <div className="header__search-results-inner">
                <div className="header__search-title">Collections</div>
                <div className="header__search-list">
                  <Link href="/collections?category=tees" className="header__search-item" onClick={() => setSearchOpen(false)}>
                    <img src="/products al/WARRIOR Tee Black/bob warrior 1.jpg" alt="" />
                    <span>T-Shirts &amp; Tees</span>
                  </Link>
                  <Link href="/collections?category=pants" className="header__search-item" onClick={() => setSearchOpen(false)}>
                    <img src="/products al/Carpenter Pants Grey/track pant 1.jpg" alt="" />
                    <span>Pants &amp; Cargo</span>
                  </Link>
                  <Link href="/collections?category=tanks" className="header__search-item" onClick={() => setSearchOpen(false)}>
                    <img src="/products al/staar tank white/staar tank white_.jpg" alt="" />
                    <span>Tank Tops</span>
                  </Link>
                  <Link href="/collections" className="header__search-item" onClick={() => setSearchOpen(false)}>
                    <img src="/products al/playR Create Waffle Tee/CTT 1.jpg" alt="" />
                    <span>All Products</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="header__search-results-inner">
                <div className="header__search-title">Products</div>
                <div className="header__search-list">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.slice(0, 5).map((p) => (
                      <Link 
                        key={p.slug} 
                        href={`/product/${p.slug}`} 
                        className="header__search-item" 
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                      >
                        <img src={p.image} alt="" />
                        <div className="header__search-item-info">
                          <span className="header__search-item-title">{p.name}</span>
                          <span className="header__search-item-price">Rs. {p.price}</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="header__search-no-results">No products found matching &quot;{searchQuery}&quot;</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className={`mega ${megaOpen ? 'open' : ''}`}>
          <div>
            <h4>Featured</h4>
            {menu.featured.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setMegaOpen(false)}>
                {l.label}
              </Link>
            ))}
          </div>
          <div>
            <h4>T-Shirts</h4>
            {menu.tees.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setMegaOpen(false)}>
                {l.label}
              </Link>
            ))}
          </div>
          <div>
            <h4>Pants &amp; Bottoms</h4>
            {menu.pants.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setMegaOpen(false)}>
                {l.label}
              </Link>
            ))}
          </div>
          <div>
            <h4>Shop</h4>
            {menu.shop.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setMegaOpen(false)}>
                {l.label}
              </Link>
            ))}
          </div>
          <div>
            <h4>Support</h4>
            <Link href="/profile">Track your order</Link>
            <Link href="/contact">Returns & exchange</Link>
            <Link href="/contact">Shipping policy</Link>
          </div>
        </div>
      </header>

      {storyOpen && <StoryViewer onClose={() => setStoryOpen(false)} />}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <MobileNav
        onSearch={() => {
          setSearchOpen((v) => !v);
          setMegaOpen(false);
          setSearchQuery('');
        }}
        onAccount={handleAccount}
      />
    </>
  );
}

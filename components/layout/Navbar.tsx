'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import WishlistLoginBridge from '@/components/auth/WishlistLoginBridge';
import { stories } from '@/lib/bluorng-data';
import { productMatchesQuery } from '@/lib/products/search';
import MobileNav from './MobileNav';
import dynamic from 'next/dynamic';

const StoryViewer = dynamic(() => import('./StoryViewer'), { ssr: false });
const LoginModal = dynamic(() => import('@/components/auth/LoginModal'), { ssr: false });

const Icon = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  location: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
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
  topwear: [
    { label: 'Short Sleeve T-Shirts', href: '/collections?category=tees' },
    { label: 'Long Sleeve T-Shirts', href: '/collections?category=long-sleeve' },
    { label: 'Tanks', href: '/collections?category=tanks' },
  ],
  bottomwear: [
    { label: 'Sweatpants', href: '/collections?category=pants' },
  ],
  shopAndSupport: [
    { label: 'All Products', href: '/collections?category=all' },
    { label: 'Collaborations', href: '/collaborations' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Shipping Policy', href: '/shipping-policy' },
    { label: 'Refund Policy', href: '/refund-policy' },
  ],
};

export default function Navbar() {
  const [megaOpen, setMegaOpen] = useState(false);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('dark');
  const [products, setProducts] = useState<any[]>([]);

  const cart = useCart();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authHydrated = useAuthStore((s) => s.isHydrated);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginRedirect, setLoginRedirect] = useState(pathname || '/profile');
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const wishlistLoginOpen = useWishlistStore((s) => s.loginOpen);
  const wishlistPending = useWishlistStore((s) => s.pending);
  const setWishlistLogin = useWishlistStore((s) => s.setLoginOpen);
  const clearWishlistPending = useWishlistStore((s) => s.clearPending);
  const router = useRouter();

  const isProductPage = pathname ? pathname.startsWith('/product/') : false;
  const isCheckout = Boolean(pathname?.startsWith('/checkout'));
  const hideMobileNav = Boolean(isCheckout || pathname === '/cart');
  const [productTitle, setProductTitle] = useState('');

  useEffect(() => {
    if (isProductPage) {
      const slug = pathname.split('/').pop() || '';
      const formatted = slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setProductTitle(formatted);
    }
  }, [pathname, isProductPage]);

  const handleAccount = () => {
    if (isAuthenticated) {
      router.push('/profile');
    } else {
      setLoginRedirect(pathname || '/profile');
      setLoginOpen(true);
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      setLoginRedirect('/wishlist');
      setWishlistLogin(true);
      cart.showToast('Sign in to view wishlist');
      return;
    }
    router.push('/wishlist');
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

  useEffect(() => {
    if ((!searchOpen && !isProductPage) || products.length > 0) return;
    let cancelled = false;
    async function loadProducts() {
      try {
        const { loadClientCatalog } = await import('@/lib/products/client-catalog');
        const catalog = await loadClientCatalog();
        if (cancelled) return;
        setProducts(
          catalog.map((p) => ({
            id: p.id,
            name: p.name,
            description: String(p.description ?? p.metadata?.description ?? ''),
            price: p.price,
            slug: p.slug,
            image: p.image,
            category: String(p.metadata?.category ?? p.metadata?.category_name ?? ''),
            tags: p.metadata?.tags,
            metadata: p.metadata,
          }))
        );
      } catch (err) {
        console.error('Failed to load products for search:', err);
      }
    }
    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [searchOpen, isProductPage, products.length]);

  const currentProduct = isProductPage ? products.find((p) => p.slug === pathname.split('/').pop()) : null;
  const displayTitle = currentProduct ? currentProduct.name : productTitle;

  const toggleTheme = () => {
    const next = theme === 'default' ? 'dark' : 'default';
    setTheme(next);
    localStorage.setItem('playr-theme', next);
  };

  const filteredProducts = products.filter((p) => productMatchesQuery(p, searchQuery));

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Start transparent on page load for all routes, transition to glass pills after 60px scroll or when overlays are open
  const solid = scrolled || megaOpen || menuDrawerOpen || searchOpen;

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > 60);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('hdr-solid', solid);
  }, [solid]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (menuDrawerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = prev || '';
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, [menuDrawerOpen]);

  return (
    <>
      {/* Bluorng inverse corner notches — visible only when header is solid */}
      <div className="page-frame" aria-hidden="true" />
      <header
        className={`header ${solid ? 'header--solid' : ''} ${scrolled ? 'header--scrolled' : ''} ${isCheckout ? 'header--checkout' : ''}`}
        onMouseLeave={() => {
          if (typeof window !== 'undefined' && window.innerWidth > 900) {
            setMegaOpen(false);
          }
        }}
      >
        <div className="header__inner">
          <nav className="header__nav header__nav--desktop" aria-hidden={isCheckout || undefined}>
            {isCheckout ? null : isProductPage ? (
              <div className="header__breadcrumb">
                <Link href="/collections" className="header__breadcrumb-link">
                  Collection
                </Link>
                <span className="header__breadcrumb-sep">/</span>
                <span className="header__breadcrumb-current">{displayTitle}</span>
              </div>
            ) : (
              <div className="header__nav-dropdown">
                <Link
                  href="/collections"
                  className="header__link"
                  aria-expanded={megaOpen}
                  aria-haspopup="true"
                  onMouseEnter={() => setMegaOpen(true)}
                  onClick={() => setMegaOpen((v) => !v)}
                >
                  Collection
                </Link>
                <div className={`mega ${megaOpen ? 'open' : ''}`}>
                  <div>
                    <h4>Topwear</h4>
                    {menu.topwear.map((l) => (
                      <Link key={l.label} href={l.href} onClick={() => setMegaOpen(false)}>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                  <div>
                    <h4>Bottomwear</h4>
                    {menu.bottomwear.map((l) => (
                      <Link key={l.label} href={l.href} onClick={() => setMegaOpen(false)}>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </nav>

          <div className="header__logo">
            {!isCheckout && (
              <button className="header__pill-plus" onClick={() => setMegaOpen((v) => !v)} aria-label="Menu">
                +
              </button>
            )}
            <Link
              href="/home"
              className="header__pill-link"
              aria-label="StreetplayR Home"
              onClick={(e) => {
                e.preventDefault();
                router.push('/home');
              }}
            >
              <Image src="/playR.street logo.png" alt="StreetplayR" width={1024} height={660} priority />
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
              className="iconbtn iconbtn--story"
              onClick={() => setStoryOpen(true)}
              aria-label="Stories"
            >
              <img src={stories[0].image} alt="" />
            </button>
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
            <Link
              href="/stores"
              className="iconbtn hide-mobile"
              aria-label="Walk-in Stores"
              onClick={() => {
                setMegaOpen(false);
                setSearchOpen(false);
              }}
            >
              {Icon.location}
            </Link>
            <button className="iconbtn hide-mobile" aria-label="Account" onClick={handleAccount}>
              {Icon.user}
            </button>
            <button className="iconbtn" aria-label="Wishlist" onClick={handleWishlist}>
              {Icon.bookmark}
              {authHydrated && isAuthenticated && wishlistCount > 0 && (
                <span className="iconbtn__count">{wishlistCount}</span>
              )}
            </button>
            <button className="iconbtn" onClick={() => cart.setOpen(true)} aria-label="Bag">
              {Icon.bag}
              {/* cart.count already 0 until CartProvider mounts — avoid SSR/client badge skew */}
              {cart.count > 0 && <span className="iconbtn__count">{cart.count}</span>}
            </button>
            <button
              className="iconbtn iconbtn--menu"
              onClick={() => {
                setMenuDrawerOpen((v) => !v);
                setMegaOpen(false);
                setSearchOpen(false);
              }}
              aria-label="Menu"
              aria-expanded={menuDrawerOpen}
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
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
            >
              &times;
            </button>
          </div>
        )}

        {/* Mobile: no empty-state suggestions / “Popular” chips — CSS also hides .header__search-suggestions */}
        {searchOpen && (searchQuery.trim() !== '' || !isMobile) && (
          <div className="header__search-dropdown">
            {searchQuery.trim() === '' && !isMobile ? (
              <div className="header__search-results-inner header__search-suggestions">
                <div className="header__search-title">Collections</div>
                <div className="header__search-list">
                  <Link href="/collections?category=tees" className="header__search-item" onClick={() => setSearchOpen(false)}>
                    <img src="/assets/products/warrior-bob/image-1.webp" alt="" />
                    <span>Short Sleeve T-Shirts</span>
                  </Link>
                  <Link href="/collections?category=pants" className="header__search-item" onClick={() => setSearchOpen(false)}>
                    <img src="/assets/products/carpenter-grey/image-1.jpg" alt="" />
                    <span>Sweatpants</span>
                  </Link>
                  <Link href="/collections" className="header__search-item" onClick={() => setSearchOpen(false)}>
                    <img src="/assets/products/ctt-waffle/image-1.webp" alt="" />
                    <span>Latest Drop</span>
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
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
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

        {/* Mobile / + button: mega lives outside hidden desktop nav */}
        <div className={`mega mega--mobile ${megaOpen ? 'open' : ''}`}>
          <div>
            <h4>Topwear</h4>
            {menu.topwear.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setMegaOpen(false)}>
                {l.label}
              </Link>
            ))}
          </div>
          <div>
            <h4>Bottomwear</h4>
            {menu.bottomwear.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setMegaOpen(false)}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <div className={`scrim ${menuDrawerOpen ? 'open' : ''}`} onClick={() => setMenuDrawerOpen(false)} />
      <aside
        className={`drawer drawer--menu ${menuDrawerOpen ? 'open' : ''}`}
        aria-hidden={!menuDrawerOpen}
        inert={!menuDrawerOpen ? true : undefined}
      >
        <div className="drawer__head">
          <h3>Menu</h3>
          <button
            onClick={() => setMenuDrawerOpen(false)}
            className="drawer__close"
            aria-label="Close menu"
          >
            &times;
          </button>
        </div>
        <div className="drawer__body drawer__body--menu">
          <div className="drawer__section">
            <h4 className="drawer__section-label">Shop &amp; Support</h4>
            {menu.shopAndSupport.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="drawer__link"
                onClick={() => setMenuDrawerOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {storyOpen && <StoryViewer onClose={() => setStoryOpen(false)} />}

      <LoginModal
        open={loginOpen || wishlistLoginOpen}
        onClose={() => {
          setLoginOpen(false);
          setWishlistLogin(false);
          clearWishlistPending();
        }}
        redirectTo={
          wishlistLoginOpen
            ? wishlistPending
              ? pathname || '/collections'
              : loginRedirect || '/wishlist'
            : loginRedirect
        }
      />
      <WishlistLoginBridge />

      {!hideMobileNav && (
        <MobileNav
          onSearch={() => {
            setSearchOpen((v) => !v);
            setMegaOpen(false);
            setSearchQuery('');
          }}
          onAccount={handleAccount}
          onStories={() => setStoryOpen(true)}
        />
      )}
    </>
  );
}

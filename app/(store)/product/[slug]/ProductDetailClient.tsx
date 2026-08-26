'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/components/CartContext';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { RealtimeSubscriptions } from '@/lib/realtime/subscriptions';
import RecommendedProducts from '@/components/product/RecommendedProducts';
import RecentlyVisited, { pushRecentlyVisited } from '@/components/ui/RecentlyVisited';
import { maxRedeemableCredits } from '@/lib/loyalty/redemption';
import { extractGsmSpec } from '@/lib/products/copy';
import {
  isRemovedApparelSize,
  normalizeSizeLabel,
  SIZE_GUIDE_ROWS,
  sortApparelSizes,
} from '@/lib/products/sizes';
import { trackAddToCart, trackViewItem } from '@/lib/analytics/ecommerce';

/* ── Lazy-load AI Try-On — no SSR ── */
const AITryOn = dynamic(
  () => import('@/components/product/AITryOn'),
  { ssr: false }
);

/* ── Lazy-load the 3D viewer — no SSR ── */
/* 3D viewer kept in tree for when final GLB assets ship. Hidden from PDP CTA. */
const SHOW_3D_PRODUCT_VIEW = false;

const ProductViewer3D = dynamic(
  () => import('@/components/product/ProductViewer3D'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#050505]">
        <div className="w-8 h-8 border-2 border-[#ddb7ff]/20 border-t-[#ddb7ff] rounded-full animate-spin" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-white/60">
          Loading 3D model…
        </span>
      </div>
    ),
  }
);

type Color = { id: string; name: string; hex: string; images?: string[] };
type VariantInfo = { id: string; size: string; color: string; stockQuantity: number };

interface ProductDetailClientProps {
  productId: string;
  title: string;
  price: string;
  description: string;
  points: string;
  image: string;
  images: string[];
  colors: Color[];
  sizes: string[];
  variants: VariantInfo[];
  slug: string;
  model3d?: string;
}

const TINTS = [
  ['maroon', '#efe0e0'], ['red', '#f3e2df'], ['pink', '#f6e3ea'], ['orange', '#f5e8dc'],
  ['blue', '#e1e8f2'], ['green', '#e2ece4'], ['grey', '#e9e9e9'], ['silver', '#eaeaec'],
  ['black', '#e6e6e6'],
];

function pageTint(title: string) {
  const t = title.toLowerCase();
  const hit = TINTS.find(([k]) => t.includes(k));
  return hit ? hit[1] : '#ececec';
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 18 22" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
      <path d="M2 2.5A1.5 1.5 0 0 1 3.5 1h11A1.5 1.5 0 0 1 16 2.5V20l-7-4.5L2 20V2.5Z" />
    </svg>
  );
}

export default function ProductDetailClient(props: ProductDetailClientProps) {
  const router = useRouter();
  const cart = useCart();

  const [selectedColor, setSelectedColor] = useState(props.colors[0]?.id || 'default');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [liveStock, setLiveStock] = useState<Record<string, number>>({});
  const memberBalance = useAuthStore((s) => s.user?.sprrBalance ?? 0);
  const [spCredits, setSpCredits] = useState(0);
  const [tab, setTab] = useState('details');
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [sizeError, setSizeError] = useState('');

  const carouselRef = useRef<HTMLDivElement>(null);
  const galleryRightRef = useRef<HTMLDivElement>(null);
  const tryOnRef = useRef<HTMLDivElement>(null);
  const [tryOnReady, setTryOnReady] = useState(false);

  useEffect(() => {
    const numeric = parseFloat(props.price.replace(/[^0-9.-]+/g, '')) || 0;
    trackViewItem({ item_id: props.productId, item_name: props.title, price: numeric });
  }, [props.productId, props.title, props.price]);

  useEffect(() => {
    const el = tryOnRef.current;
    if (!el || tryOnReady) return;
    if (typeof IntersectionObserver === 'undefined') {
      setTryOnReady(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setTryOnReady(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [tryOnReady]);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    for (const v of props.variants) {
      try {
        const unsub = RealtimeSubscriptions.subscribeToStock(v.id, (stock: number) => {
          setLiveStock((prev) => ({ ...prev, [v.id]: stock }));
        });
        unsubs.push(unsub);
      } catch {}
    }
    return () => unsubs.forEach((fn) => fn());
  }, [props.variants]);

  useEffect(() => {
    pushRecentlyVisited(props.slug);
  }, [props.slug]);

  const liveVariants = props.variants.map((v) => ({
    ...v,
    stockQuantity: liveStock[v.id] ?? v.stockQuantity,
  }));

  const orderedSizes = useMemo(() => sortApparelSizes(props.sizes), [props.sizes]);

  const findVariantForSize = useCallback(
    (size: string) =>
      liveVariants.find((v) => normalizeSizeLabel(v.size) === normalizeSizeLabel(size)),
    [liveVariants]
  );

  const activeColor = props.colors.find((c) => c.id === selectedColor);
  const colorImages = activeColor?.images?.length ? activeColor.images : props.images;
  const heroImage = colorImages[0] ?? props.image;
  const allImages = colorImages.length > 0 ? colorImages : [heroImage];

  useEffect(() => {
    if (orderedSizes.length > 0) {
      const firstAvailable = orderedSizes.find((s) => {
        const matchingVariant = findVariantForSize(s);
        return matchingVariant && matchingVariant.stockQuantity > 0;
      });
      setSelectedSize(firstAvailable || orderedSizes[0]);
    }
  }, [findVariantForSize, orderedSizes]);

  const onCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveImg(Math.round(el.scrollLeft / el.clientWidth));
  };

  const nextImg = () => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
  };

  const prevImg = () => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
  };

  // Scroll-reveal for the stacked gallery images (desktop only — mobile uses the swipe carousel)
  useEffect(() => {
    const container = galleryRightRef.current;
    if (!container) return;
    const targets = container.querySelectorAll('.pdp__reveal');
    if (targets.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [allImages]);

  const handleButtonHover = useCallback(() => {
    if (props.model3d) {
      import('@/components/product/ProductViewer3D').then(({ preload3DModel }) => {
        preload3DModel(props.model3d!);
      });
    }
  }, [props.model3d]);

  const addToBag = async (): Promise<boolean> => {
    if (!selectedSize) {
      setSizeError('Please select a size');
      return false;
    }
    if (isRemovedApparelSize(selectedSize)) {
      setSizeError('Selected size is not available');
      return false;
    }
    setSizeError('');
    const matchingVariant = findVariantForSize(selectedSize);
    if (!matchingVariant) {
      alert('Selected size not available.');
      return false;
    }
    if (matchingVariant.stockQuantity < quantity) {
      alert(`Only ${matchingVariant.stockQuantity} units available.`);
      return false;
    }
    try {
      const { getVariantStockAction } = await import('@/app/actions/stock');
      const res = await getVariantStockAction(matchingVariant.id);
      if (res.success && res.data && res.data.available < quantity) {
        alert(`Only ${res.data.available} units available.`);
        return false;
      }
    } catch {}

    cart.addItem(
      {
        handle: props.slug,
        productId: props.productId,
        title: props.title,
        price: parseFloat(props.price.replace(/[^0-9.-]+/g, '')),
        images: colorImages,
        variantId: matchingVariant.id,
      },
      selectedSize
    );
    cart.showToast('Added to bag');
    trackAddToCart({
      item_id: props.productId,
      item_name: props.title,
      price: parseFloat(props.price.replace(/[^0-9.-]+/g, '')) || 0,
      quantity,
    });
    return true;
  };

  const buyNow = async () => {
    if (!selectedSize) {
      setSizeError('Please select a size');
      return;
    }
    if (isRemovedApparelSize(selectedSize)) {
      setSizeError('Selected size is not available');
      return;
    }
    setSizeError('');
    const added = await addToBag();
    if (added) router.push('/checkout');
  };

  const gsmSpec = extractGsmSpec(props.description);
  const isWishlisted = useWishlistStore((s) => s.isSaved(props.productId));
  const requestToggle = useWishlistStore((s) => s.requestToggle);
  const saved = isWishlisted;
  return (
    <div className="pdp-page">
      <div className="pdp">
        {/* Mobile gallery — full-bleed snap carousel */}
        <div className="pdp__mgallery">
          <div className="pdp__carousel" ref={carouselRef} onScroll={onCarouselScroll}>
            {allImages.map((src, i) => (
              <div className="pdp__slide" key={src}>
                <Image
                  src={src}
                  alt={`${props.title} — view ${i + 1}`}
                  fill
                  onClick={() => setLightboxIndex(i)}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  sizes="100vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
          {allImages.length > 1 && (
            <>
              <button
                className="pdp__mgallery-nav pdp__mgallery-nav--prev"
                onClick={prevImg}
                aria-label="Previous image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button
                className="pdp__mgallery-nav pdp__mgallery-nav--next"
                onClick={nextImg}
                aria-label="Next image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
              <div className="pdp__counter" aria-live="polite">
                {activeImg + 1} / {allImages.length}
              </div>
              <div className="pdp__dots" role="tablist" aria-label="Gallery slides">
                {allImages.map((_, i) => (
                  <button
                    key={`dot-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={activeImg === i}
                    aria-label={`Image ${i + 1}`}
                    className={`pdp__dot ${activeImg === i ? 'is-active' : ''}`}
                    onClick={() => {
                      const el = carouselRef.current;
                      if (!el) return;
                      el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
                      setActiveImg(i);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Desktop gallery */}
        <div className="pdp__gallery">
          <div className="pdp__gallery-left">
            {allImages[0] && (
              <Image
                src={allImages[0]}
                alt={`${props.title} — cover`}
                fill
                onClick={() => setLightboxIndex(0)}
                loading="eager"
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            )}
          </div>
          <div className="pdp__gallery-right" ref={galleryRightRef}>
            {allImages.slice(1).map((src, i) => (
              <div className="pdp__reveal" key={src}>
                <Image
                  src={src}
                  alt={`${props.title} — view ${i + 2}`}
                  fill
                  onClick={() => setLightboxIndex(i + 1)}
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 30vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Side purchase column */}
        <aside className="pdp__side">
          <div className="pdp__panel pdp__panel--buy">
            <div className="pdp__head">
              <div className="pdp__title-row">
                <h1 className="pdp__title">{props.title}</h1>
                <button
                  type="button"
                  className={`pdp__wish ${saved ? 'is-saved' : ''}`}
                  onClick={() => {
                    const result = requestToggle({
                      id: props.productId,
                      slug: props.slug,
                      name: props.title,
                      price: Number(String(props.price).replace(/[^\d.]/g, '')) || 0,
                      image: props.image,
                      addedAt: Date.now(),
                    });
                    if (result === 'login_required') {
                      cart.showToast('Sign in to save items');
                      return;
                    }
                    cart.showToast(result === 'added' ? 'Saved to wishlist' : 'Removed from wishlist');
                  }}
                  aria-label="Save to wishlist"
                  aria-pressed={saved}
                >
                  <BookmarkIcon filled={saved} />
                </button>
              </div>
              <div className="pdp__meta-row">
                <div className="pdp__price">
                  <span>{props.price}</span>
                </div>
                <button type="button" className="sizeguide-btn" onClick={() => setGuideOpen(true)}>
                  Size Guide
                </button>
              </div>
            </div>

            {(() => {
              const inStock = liveVariants.filter((v) => v.stockQuantity > 0);
              const limited =
                inStock.length > 0 &&
                (inStock.some((v) => v.stockQuantity > 0 && v.stockQuantity <= 5) ||
                  inStock.reduce((n, v) => n + v.stockQuantity, 0) <= 12);
              return limited ? (
                <p className="pdp__limited-stock" role="status">
                  Limited Stock Available
                </p>
              ) : null;
            })()}

            <div className="sizes" role="group" aria-label="Select size">
              {orderedSizes.map((s) => {
                const matchingVariant = findVariantForSize(s);
                const isSoldOut = !matchingVariant || matchingVariant.stockQuantity <= 0;
                return (
                  <button
                    key={s}
                    type="button"
                    className={`size ${selectedSize === s && !isSoldOut ? 'active' : ''} ${isSoldOut ? 'disabled' : ''}`}
                    onClick={() => { if (!isSoldOut) { setSelectedSize(s); setSizeError(''); } }}
                    disabled={isSoldOut}
                    aria-pressed={selectedSize === s && !isSoldOut}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            {sizeError && (
              <p className="text-[var(--sp-error,#ff3b30)] text-xs mt-1 font-mono tracking-wide uppercase animate-pulse">{sizeError}</p>
            )}

            <div className="pdp__credits">
              <div className="pdp__credits-head">
                <span className="pdp__credits-label">Member Credits</span>
                <span className="pdp__credits-value">
                  {spCredits} / {maxRedeemableCredits(memberBalance, Number(String(props.price).replace(/[^\d.]/g, '')) || 0) || memberBalance}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, maxRedeemableCredits(memberBalance, Number(String(props.price).replace(/[^\d.]/g, '')) || 0))}
                step="50"
                value={spCredits}
                onChange={(e) => setSpCredits(Number(e.target.value))}
                className="pdp__credits-range"
                aria-label="Member credits to apply"
                disabled={memberBalance <= 0}
              />
            </div>

            <div className="pdp__actions-slot">
              <div className="pdp__actions">
                <button type="button" className="pdp__atb" onClick={addToBag}>
                  Add to Bag
                </button>
                <button type="button" className="pdp__buy" onClick={buyNow}>
                  Buy Now
                </button>
              </div>
            </div>

            {SHOW_3D_PRODUCT_VIEW && props.model3d && (
              <button
                type="button"
                onClick={() => setShow3DViewer(true)}
                onMouseEnter={handleButtonHover}
                className="pdp__3d"
              >
                <span>View in 3D</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </button>
            )}

            <div className="pdp__tryon" ref={tryOnRef}>
              {tryOnReady && (
                <AITryOn
                  productImageUrl={heroImage}
                  productTitle={props.title}
                  productSlug={props.slug}
                  productId={props.productId}
                />
              )}
            </div>
          </div>

          <div className="pdp__panel pdp__panel--tabs">
            <div className="tabs" role="tablist" aria-label="Product information">
              <button
                type="button"
                role="tab"
                id="pdp-tab-details"
                aria-controls="pdp-panel-details"
                aria-selected={tab === 'details'}
                aria-label="Details and Description"
                tabIndex={tab === 'details' ? 0 : -1}
                className={`tab ${tab === 'details' ? 'active' : ''}`}
                onClick={() => setTab('details')}
              >
                Details
              </button>
              <button
                type="button"
                role="tab"
                id="pdp-tab-care"
                aria-controls="pdp-panel-care"
                aria-selected={tab === 'care'}
                tabIndex={tab === 'care' ? 0 : -1}
                className={`tab ${tab === 'care' ? 'active' : ''}`}
                onClick={() => setTab('care')}
              >
                Washcare
              </button>
              <button
                type="button"
                role="tab"
                id="pdp-tab-shipping"
                aria-controls="pdp-panel-shipping"
                aria-selected={tab === 'shipping'}
                tabIndex={tab === 'shipping' ? 0 : -1}
                className={`tab ${tab === 'shipping' ? 'active' : ''}`}
                onClick={() => setTab('shipping')}
              >
                Shipping
              </button>
            </div>

            <div
              className="tabbody"
              role="tabpanel"
              id={
                tab === 'details'
                  ? 'pdp-panel-details'
                  : tab === 'care'
                    ? 'pdp-panel-care'
                    : 'pdp-panel-shipping'
              }
              aria-labelledby={
                tab === 'details'
                  ? 'pdp-tab-details'
                  : tab === 'care'
                    ? 'pdp-tab-care'
                    : 'pdp-tab-shipping'
              }
            >
              {tab === 'details' && (
                <>
                  <h6>Details</h6>
                  <ul>
                    {props.points && <li>Earn {props.points} Member Credits on purchase</li>}
                    <li>Oversized comfort with tailored drape</li>
                  </ul>
                  <h6>Description</h6>
                  <p>{props.description}</p>
                  {gsmSpec && (
                    <p className="mt-4 text-[13px] opacity-75 font-mono uppercase tracking-wide">
                      Specifications: {gsmSpec}
                    </p>
                  )}
                </>
              )}
              {tab === 'care' && (
                <ul>
                  <li>Wash inside out with cold water</li>
                  <li>Do not tumble dry</li>
                  <li>Do not iron directly on puff prints</li>
                  <li>Hang to dry in shade</li>
                </ul>
              )}
              {tab === 'shipping' && (
                <ul>
                  <li>Dispatched within 24-48 hours</li>
                  <li>Free delivery across India</li>
                  <li>10-day replacement policy for sizing</li>
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Size Guide Modal */}
      {guideOpen && (
        <div className="modal" onClick={() => setGuideOpen(false)}>
          <div className="modal__card" onClick={(e) => e.stopPropagation()}>
            <button className="modal__close" onClick={() => setGuideOpen(false)}>
              ×
            </button>
            <h3>Size guide</h3>
            <table>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Chest / Waist</th>
                  <th>Recommended Fit</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_GUIDE_ROWS.map((row) => (
                  <tr key={row.size}>
                    <td>{row.size}</td>
                    <td>{row.chestWaist}</td>
                    <td>{row.fit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 12, color: '#757575', marginTop: 14, lineHeight: 1.6 }}>
              <b>How to measure:</b> Measure around the fullest part of your chest for tees, or around your natural waistline for pants.
            </p>
          </div>
        </div>
      )}

      {/* 3D Model Viewer Modal */}
      <AnimatePresence>
        {SHOW_3D_PRODUCT_VIEW && show3DViewer && props.model3d && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md"
            onClick={() => setShow3DViewer(false)}
          >
            <button
              onClick={() => setShow3DViewer(false)}
              className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center border border-white/[0.12] text-white/50 hover:text-white hover:border-white/30 transition-all bg-black/40 backdrop-blur-sm"
              aria-label="Close 3D viewer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="absolute top-5 left-5 z-10 flex items-center gap-3">
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#ddb7ff]/50">3D View</span>
              <span className="h-px w-4 bg-white/10 block" />
              <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/20">{props.title}</span>
            </div>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/20">
                Drag to rotate · Scroll to zoom
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full max-w-5xl max-h-[80vh] mx-4 md:mx-8 border border-white/[0.07] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <ProductViewer3D modelPath={props.model3d} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Zoom Gallery */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-5 right-5 z-20 w-12 h-12 flex items-center justify-center border border-white/[0.12] text-white/50 hover:text-white hover:border-white/30 transition-all bg-black/40 backdrop-blur-sm cursor-pointer"
              aria-label="Close image viewer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + allImages.length) % allImages.length : 0));
                  }}
                  className="absolute left-5 z-20 w-12 h-12 flex items-center justify-center border border-white/[0.12] text-white/50 hover:text-white hover:border-white/30 transition-all bg-black/40 backdrop-blur-sm cursor-pointer"
                  aria-label="Previous image"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % allImages.length : 0));
                  }}
                  className="absolute right-5 z-20 w-12 h-12 flex items-center justify-center border border-white/[0.12] text-white/50 hover:text-white hover:border-white/30 transition-all bg-black/40 backdrop-blur-sm cursor-pointer"
                  aria-label="Next image"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </>
            )}

            <div className="absolute top-5 left-5 z-20 flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#ddb7ff]/70">Gallery</span>
              <span className="h-px w-6 bg-white/15 block" />
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
                {String(lightboxIndex + 1).padStart(2, '0')} / {String(allImages.length).padStart(2, '0')}
              </span>
            </div>

            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="relative w-full max-w-4xl max-h-[85vh] aspect-[3/4] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={allImages[lightboxIndex]}
                alt={`${props.title} full view`}
                fill
                className="object-contain cursor-zoom-out"
                sizes="90vw"
                onClick={() => setLightboxIndex(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RecommendedProducts currentSlug={props.slug} />
      <RecentlyVisited excludeSlug={props.slug} />
    </div>
  );
}

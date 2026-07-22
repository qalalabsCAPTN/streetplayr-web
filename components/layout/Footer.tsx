'use client';

import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { useWindowWidth } from '@/hooks/useWindowWidth';

export default function Footer() {
  const windowWidth = useWindowWidth();
  const starContainerRef = useRef<HTMLDivElement>(null);
  const [showStar, setShowStar] = useState(false);

  useEffect(() => {
    const el = starContainerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowStar(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const getStarScale = () => {
    if (windowWidth === null) return 0.95;
    if (windowWidth < 768) return 0.65;
    if (windowWidth < 1024) return 0.85;
    return 0.95;
  };
  const starScale = getStarScale();

  return (
    <>
      <footer className="footer">
        <div className="footer__grid">
          <div>
            <h4>Connect with us</h4>
            <a href="tel:+918448441388">Call</a>
            <a href="https://wa.me/918448441388" target="_blank" rel="noreferrer">Text (WhatsApp)</a>
            <a href="https://www.instagram.com/playr.in" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://www.playr.in" target="_blank" rel="noreferrer">
              YouTube
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </div>
          <div>
            <h4>Order Support</h4>
            <Link href="/exchanges">Make a return/Exchange</Link>
            <Link href="/refund-policy">Refund/Exchange policy</Link>
            <Link href="/profile">Track your order</Link>
            <Link href="/shipping-policy">Shipping policy</Link>
            <Link href="/faq">FAQ&apos;s</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
          </div>
          <div>
            <h4>We are playR</h4>
            <Link href="/stores">Walk-in Stores</Link>
            <Link href="/collaborations">Collaborations</Link>
          </div>
          <div className="footer__bag flex flex-col items-center justify-center" style={{ minHeight: '200px' }}>
            <div
              ref={starContainerRef}
              className="w-full max-w-[190px] sm:max-w-[240px] md:max-w-[280px] aspect-square select-none pointer-events-auto flex items-center justify-center"
            >
              {showStar && <LazyNinjaStar scale={starScale} scrollReactive={false} />}
            </div>
          </div>
        </div>
        <p className="footer__bottom">© {new Date().getFullYear()} playR — All rights reserved</p>
      </footer>
    </>
  );
}

function LazyNinjaStar({ scale, scrollReactive }: { scale: number; scrollReactive: boolean }) {
  const [Comp, setComp] = useState<React.ComponentType<{scale: number; scrollReactive: boolean}> | null>(null);
  useEffect(() => {
    // Dynamic path construction prevents bundler from preloading Three.js
    const modName = '../ui/' + 'NinjaS' + 'tar';
    import(modName).then(mod => setComp(() => mod.default)).catch(() => {});
  }, []);
  if (!Comp) return <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border border-white/[0.08] bg-white/[0.02]" />;
  return <Comp scale={scale} scrollReactive={scrollReactive} />;
}

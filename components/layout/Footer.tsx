'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRef, useEffect, useState } from 'react';
import { useWindowWidth } from '@/hooks/useWindowWidth';
import { SOCIAL_LINKS } from '@/lib/social';

const NinjaStar = dynamic(() => import('@/components/ui/NinjaStar'), {
  ssr: false,
  loading: () => <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border border-white/[0.08] bg-white/[0.02]" />,
});

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
    // Mobile: visible but not oversized (was 1.2); tablet/desktop unified with hero.
    if (windowWidth < 768) return 1.05;
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
            <a href={SOCIAL_LINKS.phone}>Call</a>
            <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer">Text (WhatsApp)</a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
            <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer">
              YouTube
            </a>
            <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href={SOCIAL_LINKS.emailHref}>{SOCIAL_LINKS.email}</a>
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
            <Link href="/stores">Coming soon</Link>
            <Link href="/collaborations">Collaborations</Link>
          </div>
          <div className="footer__bag flex flex-col items-center justify-center">
            <div
              ref={starContainerRef}
              className="w-full max-w-[240px] sm:max-w-[220px] md:max-w-[240px] aspect-square select-none pointer-events-auto flex items-center justify-center"
            >
              {showStar && <NinjaStar scale={starScale} scrollReactive={false} />}
            </div>
          </div>
        </div>
        <p className="footer__bottom">© {new Date().getFullYear()} playR — All rights reserved</p>
      </footer>
    </>
  );
}

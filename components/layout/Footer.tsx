'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useWindowWidth } from '@/hooks/useWindowWidth';

const NinjaStar = dynamic(() => import('@/components/ui/NinjaStar'), {
  ssr: false,
  loading: () => <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border border-white/[0.08] bg-white/[0.02]" />,
});

export default function Footer() {
  const windowWidth = useWindowWidth();

  const getStarScale = () => {
    if (windowWidth === null) return 0.95;
    if (windowWidth < 768) return 0.65;
    if (windowWidth < 1024) return 0.85;
    return 0.95;
  };
  const starScale = getStarScale();

  return (
    <>
      <div className="popstrip">
        <b>Popular searches</b>
        <Link href="/collections?category=tees">Shop by category</Link>
        <Link href="/collections">Shop by style</Link>
        <Link href="/collections">Shop by color</Link>
      </div>

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
            <Link href="/contact">FAQ&apos;s</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
          </div>
          <div>
            <h4>We are playR</h4>
            <Link href="/about">Our story</Link>
            <Link href="/collections">Walk-in Stores</Link>
            <Link href="/contact">Collaborations</Link>
            <Link href="/contact">Careers</Link>
            <Link href="/contact">Media</Link>
            <Link href="/contact">Blogs</Link>
          </div>
          <div className="footer__bag flex flex-col items-center justify-center" style={{ minHeight: '200px' }}>
            <div className="w-full max-w-[190px] sm:max-w-[240px] md:max-w-[280px] aspect-square select-none pointer-events-auto flex items-center justify-center">
              <NinjaStar scale={starScale} scrollReactive={false} />
            </div>
          </div>
        </div>
        <p className="footer__bottom">© {new Date().getFullYear()} playR — All rights reserved</p>
      </footer>
    </>
  );
}

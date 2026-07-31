'use client';

import { useEffect, useRef } from 'react';

interface BluorngRevealProps {
  children: React.ReactNode;
  stagger?: boolean;
  className?: string;
  as?: React.ElementType;
}

/**
 * IntersectionObserver-based reveal used by the Bluorng-ported storefront
 * components. Distinct from the existing framer-motion `Reveal` (different
 * API/consumers) — do not merge, both are in active use.
 */
export default function BluorngReveal({ children, stagger = false, className = '', as: Tag = 'div' }: BluorngRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      el.classList.add('visible');
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -4% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // @ts-expect-error dynamic tag with ref
    <Tag ref={ref} className={`${stagger ? 'reveal-stagger' : 'reveal'} ${className}`}>
      {children}
    </Tag>
  );
}

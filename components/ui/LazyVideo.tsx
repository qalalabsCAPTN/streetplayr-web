'use client';

import { useEffect, useRef, useState, type VideoHTMLAttributes } from 'react';

type LazyVideoProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'> & {
  src: string;
  /** Poster shown before video source attaches */
  poster?: string;
  /** Root margin for IntersectionObserver (default: start load slightly before visible) */
  rootMargin?: string;
  /** Extra delay after becoming visible before attaching src (helps LCP on above-fold heroes) */
  deferMs?: number;
};

/**
 * Defers attaching `src` until near viewport. Uses preload="none" and only
 * autoplays when in view — cuts initial network payload for heavy MP4s.
 */
export default function LazyVideo({
  src,
  poster,
  rootMargin = '200px 0px',
  deferMs = 0,
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  className,
  style,
  children,
  ...rest
}: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      const t = setTimeout(() => {
        setActive(true);
        setInView(true);
      }, deferMs);
      return () => clearTimeout(t);
    }

    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          delayTimer = setTimeout(() => {
            setActive(true);
            setInView(true);
          }, deferMs);
        } else {
          if (delayTimer) clearTimeout(delayTimer);
          setInView(false);
          el.pause();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [rootMargin, deferMs]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !active || !autoPlay) return;
    if (!inView) {
      el.pause();
      return;
    }
    const play = () => {
      el.play().catch(() => {
        /* autoplay may be blocked; muted+playsInline usually ok */
      });
    };
    play();
    const onEnded = () => {
      el.currentTime = 0;
      play();
    };
    el.addEventListener('ended', onEnded);
    return () => el.removeEventListener('ended', onEnded);
  }, [active, autoPlay, inView]);

  useEffect(() => {
    const el = ref.current;
    return () => {
      if (!el) return;
      el.pause();
      el.removeAttribute('src');
      el.load();
    };
  }, [src]);

  return (
    <video
      ref={ref}
      className={className}
      style={style}
      poster={poster}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      preload="none"
      autoPlay={active && autoPlay}
      src={active ? src : undefined}
      {...rest}
    >
      {children}
    </video>
  );
}

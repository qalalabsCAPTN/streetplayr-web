"use client";

import { useSyncExternalStore } from "react";
import LazyVideo from "@/components/ui/LazyVideo";

interface CollectionHeroProps {
  title: string;
  description: string;
  desktopVideoSrc?: string;
  mobileVideoSrc?: string;
  label?: string;
}

/** Same breakpoint as `.collections-hero` aspect-ratio (not Tailwind `md` / 768px). */
const DESKTOP_MQ = "(min-width: 901px)";

function subscribeDesktopMq(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function pickVideoSrc(desktopVideoSrc: string, mobileVideoSrc: string) {
  return window.matchMedia(DESKTOP_MQ).matches ? desktopVideoSrc : mobileVideoSrc;
}

export default function CollectionHero({
  title: _title,
  description,
  desktopVideoSrc = "/banners/collection-desktop.mp4",
  mobileVideoSrc = "/banners/collection-mobile.mp4",
  label = "Collection / SS26",
}: CollectionHeroProps) {
  const videoSrc = useSyncExternalStore(
    subscribeDesktopMq,
    () => pickVideoSrc(desktopVideoSrc, mobileVideoSrc),
    () => desktopVideoSrc
  );

  return (
    <section className="collections-hero relative z-[1] w-full overflow-hidden bg-black">
      <LazyVideo
        key={videoSrc}
        src={videoSrc}
        aria-hidden="true"
        className="collections-hero__media"
      />

      <div className="collections-hero__overlay" />
      <div className="collections-hero__content absolute inset-0 z-[1] flex items-end">
        <div className="collections-hero__container w-full max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6">
          <span className="collections-hero__label">{label}</span>
          <p className="collections-hero__desc">{description}</p>
        </div>
      </div>
    </section>
  );
}

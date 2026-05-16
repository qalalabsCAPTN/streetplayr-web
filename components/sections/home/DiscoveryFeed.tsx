"use client";

import Image from "next/image";
import Link from "next/link";

const feedItems = [
  { id: 1, image: "/assets/polo-editorial.png", label: "FRAME_01 // MAIN" },
  { id: 2, image: "/assets/run-shorts.jpeg", label: "FRAME_02 // DETAIL" },
  { id: 3, image: "/assets/srh-jersey.jpg", label: "FRAME_03 // CONTEXT" },
];

export default function DiscoveryFeed() {
  return (
    <section className="relative h-screen w-full flex border-t border-[var(--sp-border-subtle)]/30 overflow-hidden bg-[var(--sp-bg-base)]">
      {/* Left Sidebar */}
      <aside className="w-[200px] h-full border-r border-[var(--sp-border-subtle)]/30 flex-shrink-0 hidden lg:flex flex-col p-6 font-hud text-[10px] text-[var(--sp-accent)]/60">
        <div className="mb-12">
          <p className="mb-1">[ DATA_FEED_01 ]</p>
          <p>SOURCE: CENTRAL_HUB</p>
        </div>
        <nav className="flex flex-col gap-4 text-xs uppercase tracking-widest text-[var(--sp-text-secondary)]">
          <Link href="/collections" className="hover:text-[var(--sp-accent)] transition-colors">DROPS</Link>
          <Link href="/collections" className="hover:text-[var(--sp-accent)] transition-colors">ARCHIVE</Link>
          <Link href="/about" className="hover:text-[var(--sp-accent)] transition-colors">LAB</Link>
          <Link href="/about" className="hover:text-[var(--sp-accent)] transition-colors">INTEL</Link>
        </nav>
        <div className="mt-auto">
          <p>REF: STREET_OS_V1.0</p>
          <p className="mt-2">[ SYSTEM_STABLE ]</p>
        </div>
      </aside>

      {/* Center Column: Image Feed */}
      <div className="flex-grow h-full overflow-y-auto no-scrollbar scroll-smooth snap-y snap-mandatory">
        {feedItems.map((item) => (
          <div key={item.id} className="relative w-full aspect-[4/5] md:aspect-video snap-start border-b border-[var(--sp-border-subtle)]/30">
            <Image
              src={item.image}
              alt={item.label}
              fill
              className="object-cover"
            />
            <div className="absolute top-4 left-4 bg-background/40 backdrop-blur-sm border border-[var(--sp-border-subtle)]/30 px-2 py-1 font-hud text-[9px] text-[var(--sp-accent)]">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Right Sidebar */}
      <aside className="w-[200px] h-full border-l border-[var(--sp-border-subtle)]/30 flex-shrink-0 hidden lg:flex flex-col p-6 font-hud text-[10px] text-[var(--sp-accent)]/60">
        <div className="text-right mb-12">
          <p>LAT: 35.6895° N</p>
          <p>LNG: 139.6917° E</p>
        </div>
        <div className="flex flex-col gap-6 items-end mt-4">
          <Link href="/profile" className="text-[var(--sp-text-secondary)] hover:text-[var(--sp-accent)] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/>
            </svg>
          </Link>
          <Link href="/cart" className="text-[var(--sp-text-secondary)] hover:text-[var(--sp-accent)] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </Link>
        </div>
        <div className="mt-auto text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--sp-accent-2)] rounded-full animate-pulse" />
            <p className="text-[var(--sp-accent-2)]">STATUS: ACTIVE</p>
          </div>
          <p className="mt-1">SIGNAL: 100%</p>
        </div>
      </aside>
    </section>
  );
}

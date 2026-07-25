"use client";

import Image from "next/image";
import Link from "next/link";

const feedItems = [
  { id: 1, image: "/assets/products/inspired/image-1.webp", label: "Editorial 01" },
  { id: 2, image: "/assets/products/carpenter-grey/image-1.jpg", label: "Texture Study" },
  { id: 3, image: "/assets/products/star-tank-dark/image-1.jpg", label: "Street Uniform" },
];

export default function DiscoveryFeed() {
  return (
    <section className="relative h-screen w-full flex border-t border-white/[0.10] overflow-hidden bg-transparent">
      <aside className="w-[200px] h-full border-r border-white/[0.08] flex-shrink-0 hidden lg:flex flex-col p-6 font-mono text-[10px] tracking-[0.22em] uppercase text-white/38">
        <div className="mb-12">
          <p className="mb-1">Editorial Index</p>
          <p>StreetPlayR</p>
        </div>
        <nav className="flex flex-col gap-4 text-[10px] uppercase tracking-[0.22em] text-white/55">
          <Link href="/collections" className="hover:text-white transition-colors">Collection</Link>
          <Link href="/collections" className="hover:text-white transition-colors">Archive</Link>
        </nav>
        <div className="mt-auto">
          <p>FW26</p>
          <p className="mt-2">Mumbai, India</p>
        </div>
      </aside>

      {/* Center Column: Image Feed */}
      <div className="flex-grow h-full overflow-y-auto no-scrollbar scroll-smooth snap-y snap-mandatory">
        {feedItems.map((item) => (
          <div key={item.id} className="relative w-full aspect-[4/5] md:aspect-video snap-start border-b border-white/[0.08]">
            <Image
              src={item.image}
              alt={item.label}
              fill
              className="object-cover"
            />
            <div className="absolute top-4 left-4 bg-black/35 backdrop-blur-sm border border-white/[0.08] px-3 py-2 font-mono text-[9px] tracking-[0.22em] uppercase text-white/55">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Right Sidebar */}
      <aside className="w-[200px] h-full border-l border-white/[0.08] flex-shrink-0 hidden lg:flex flex-col p-6 font-mono text-[10px] tracking-[0.22em] uppercase text-white/38">
        <div className="text-right mb-12">
          <p>Material</p>
          <p>Movement</p>
        </div>
        <div className="flex flex-col gap-6 items-end mt-4">
          <Link href="/profile" className="text-white/50 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/>
            </svg>
          </Link>
          <Link href="/cart" className="text-white/50 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </Link>
        </div>
        <div className="mt-auto text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="w-1.5 h-1.5 bg-[#ddb7ff] rounded-full" />
            <p className="text-white/55">Available</p>
          </div>
          <p className="mt-1">Release 01</p>
        </div>
      </aside>
    </section>
  );
}

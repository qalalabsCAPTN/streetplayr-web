"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const NinjaStar = dynamic(() => import("@/components/ui/NinjaStar"), {
  ssr: false,
  loading: () => <div className="w-32 h-32 md:w-56 md:h-56 lg:w-72 lg:h-72 rounded-full border border-white/[0.08] bg-white/[0.02]" />,
});

export default function Footer() {
  const [windowWidth, setWindowWidth] = useState<number | null>(null);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getStarScale = () => {
    if (windowWidth === null) return 1.2;
    if (windowWidth < 768) return 0.8;
    if (windowWidth < 1024) return 1.05;
    return 1.3;
  };
  const starScale = getStarScale();

  return (
    <footer className="w-full bg-[#16111b] border-t border-white/[0.10] px-4 md:px-8 lg:px-12 pt-4 pb-24 md:pt-12 md:pb-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(700px_360px_at_8%_0%,rgba(221,183,255,0.08),transparent_60%),radial-gradient(520px_320px_at_92%_100%,rgba(255,87,26,0.07),transparent_62%)]" />

      <div className="relative py-2 md:py-12 lg:py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-3.5 gap-x-4 md:gap-12 lg:gap-8 w-full max-w-none">
        
        {/* 1. Logo Column: Centered at the top on mobile, column 4 on desktop */}
        <div className="col-span-2 lg:col-span-1 flex justify-center lg:justify-start order-1 lg:order-4 py-1 lg:py-0">
          <Link href="/home">
            <img
              src="/assets/streetplayr-logo.png"
              alt="StreetPlayR"
              className="h-10 md:h-24 lg:h-32 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity cursor-pointer filter drop-shadow-[0_0_20px_rgba(221,183,255,0.12)]"
            />
          </Link>
        </div>

        {/* 2. Connect with us: Left column on mobile, column 1 on desktop */}
        <div className="col-span-1 lg:col-span-1 flex flex-col gap-2 lg:gap-6 order-2 lg:order-1">
          <h3 className="font-display text-[13px] md:text-[16px] lg:text-[18px] tracking-[0.24em] uppercase text-[#eadfed]">
            Connect with us
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <a
              href="#"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] hover:border-[#ddb7ff]/30 hover:bg-white/[0.02] transition-all duration-300"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] hover:border-[#ddb7ff]/30 hover:bg-white/[0.02] transition-all duration-300"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] hover:border-[#ddb7ff]/30 hover:bg-white/[0.02] transition-all duration-300"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Call Support"
              className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] hover:border-[#ddb7ff]/30 hover:bg-white/[0.02] transition-all duration-300"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="WhatsApp"
              className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] hover:border-[#ddb7ff]/30 hover:bg-white/[0.02] transition-all duration-300"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </a>
          </div>
        </div>

        {/* 3. We are playR: Right column on mobile, column 3 on desktop */}
        <div className="col-span-1 lg:col-span-1 flex flex-col gap-2 lg:gap-6 order-3 lg:order-3">
          <h3 className="font-display text-[13px] md:text-[16px] lg:text-[18px] tracking-[0.24em] uppercase text-[#eadfed]">
            We are playR
          </h3>
          <div className="flex flex-col gap-1 md:gap-3.5">
            <a href="#" className="font-mono text-[12px] md:text-[13px] tracking-[0.18em] text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
              Our Story
            </a>
            <a href="#" className="font-mono text-[12px] md:text-[13px] tracking-[0.18em] text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
              Latest Collection
            </a>
            <a href="#" className="font-mono text-[12px] md:text-[13px] tracking-[0.18em] text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
              New Drops
            </a>
            <a href="#" className="font-mono text-[12px] md:text-[13px] tracking-[0.18em] text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
              3D Experience
            </a>
            <a href="#" className="font-mono text-[12px] md:text-[13px] tracking-[0.18em] text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
              Blogs & Media
            </a>
          </div>
        </div>

        {/* 4. Order Support: Left side on mobile, column 2 on desktop */}
        <div className="col-span-1 md:col-span-1 lg:col-span-1 flex flex-col gap-2 lg:gap-6 order-4 lg:order-2">
          <h3 className="font-display text-[13px] md:text-[16px] lg:text-[18px] tracking-[0.24em] uppercase text-[#eadfed]">
            Order Support
          </h3>
          <div className="flex flex-col gap-1 md:gap-3.5">
            <a href="#" className="font-mono text-[12px] md:text-[13px] tracking-[0.18em] text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
              Shipping Policy
            </a>
            <a href="#" className="font-mono text-[12px] md:text-[13px] tracking-[0.18em] text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
              Refund & Exchange
            </a>
            <a href="#" className="font-mono text-[12px] md:text-[13px] tracking-[0.18em] text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
              Track Your Order
            </a>
            <a href="#" className="font-mono text-[12px] md:text-[13px] tracking-[0.18em] text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
              FAQ's
            </a>
            <a href="#" className="font-mono text-[12px] md:text-[13px] tracking-[0.18em] text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
              Terms & Conditions
            </a>
          </div>
        </div>

        {/* 5. NinjaStar Premium Graphic: Right side on mobile, column 5 on desktop */}
        <div className="col-span-1 lg:col-span-1 flex justify-center items-center lg:justify-end order-5 lg:order-5 mt-0">
          <div className="w-32 h-32 md:w-56 md:h-56 lg:w-72 lg:h-72 select-none pointer-events-auto">
            <NinjaStar scale={starScale} />
          </div>
        </div>
      </div>

      <div className="py-2.5 md:py-8 border-t border-white/[0.08] flex flex-col md:flex-row justify-between gap-2 md:gap-3 font-mono text-[11px] md:text-[12px] tracking-[0.22em] text-white/[0.26] uppercase text-center md:text-left">
        <span>&copy; 2026 STREETPLAYR PVT LTD · ALL RIGHTS RESERVED</span>
        <span>Mumbai, India</span>
      </div>
    </footer>
  );
}

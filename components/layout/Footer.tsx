"use client";

import dynamic from "next/dynamic";

const NinjaStar = dynamic(() => import("@/components/ui/NinjaStar"), {
  ssr: false,
  loading: () => <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-white/[0.08] bg-white/[0.02]" />,
});

export default function Footer() {
  return (
    <footer className="w-full bg-[#16111b] border-t border-white/[0.10] px-4 md:px-6 pb-20 md:pb-0 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(700px_360px_at_8%_0%,rgba(221,183,255,0.08),transparent_60%),radial-gradient(520px_320px_at_92%_100%,rgba(255,87,26,0.07),transparent_62%)]" />

      <div className="relative py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-8 lg:gap-6">
        <div>
          <img src="/assets/streetplayr-logo.png" alt="StreetPlayR" className="h-10 w-auto object-contain opacity-95" />
        </div>

        <div className="flex flex-col gap-3">
          <a href="#" className="font-mono text-[12px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
            Shipping Policy
          </a>
          <a href="#" className="font-mono text-[12px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
            Privacy Policy
          </a>
          <a href="#" className="font-mono text-[12px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
            Track Your Order
          </a>
          <a href="#" className="font-mono text-[12px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
            Your Orders
          </a>
        </div>

        <div className="flex flex-col gap-3">
          <a href="#" className="font-mono text-[12px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
            Latest Collection
          </a>
          <a href="#" className="font-mono text-[12px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
            New Launch
          </a>
          <a href="#" className="font-mono text-[12px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
            3D Popup
          </a>
          <a href="#" className="font-mono text-[12px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] hover:text-[#eadfed] transition-colors duration-300 uppercase">
            Product 3D Popup
          </a>
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <div className="w-32 h-32 md:w-40 md:h-40">
            <NinjaStar />
          </div>
        </div>
      </div>

      <div className="py-6 border-t border-white/[0.08] flex flex-col md:flex-row justify-between gap-2 font-mono text-[12px] tracking-[0.22em] text-white/[0.26] uppercase">
        <span>&copy; 2026 STREETPLAYR PVT LTD</span>
        <span>Mumbai, India</span>
      </div>
    </footer>
  );
}

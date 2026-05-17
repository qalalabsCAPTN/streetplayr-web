export default function Footer() {
  return (
    <footer className="w-full bg-[#16111b] border-t border-white/[0.10] px-6 md:px-[6vw] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(700px_360px_at_8%_0%,rgba(221,183,255,0.08),transparent_60%),radial-gradient(520px_320px_at_92%_100%,rgba(255,87,26,0.07),transparent_62%)]" />

      {/* Row 1 — Logo */}
      <div className="relative py-16">
        <span className="font-display text-[32px] uppercase text-[#eadfed] tracking-[0.02em]">
          StreetPlayR
        </span>
      </div>

      {/* Row 2 — Policies & Orders */}
      <div className="relative py-10 border-t border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <a href="#" className="font-mono text-[10px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] hover:text-[#eadfed] transition-colors uppercase">
            Shipping Policy
          </a>
          <span className="w-px h-3 bg-white/[0.08]" />
          <a href="#" className="font-mono text-[10px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] hover:text-[#eadfed] transition-colors uppercase">
            Privacy Policy
          </a>
          <span className="w-px h-3 bg-white/[0.08]" />
          <a href="#" className="font-mono text-[10px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] hover:text-[#eadfed] transition-colors uppercase">
            Track Your Order
          </a>
          <span className="w-px h-3 bg-white/[0.08]" />
          <a href="#" className="font-mono text-[10px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] hover:text-[#eadfed] transition-colors uppercase">
            Your Orders
          </a>
        </div>
      </div>

      {/* Row 3 — Latest Collection & Launch */}
      <div className="relative py-10 border-t border-white/[0.08] flex flex-wrap items-center gap-x-8 gap-y-3">
        <span className="font-mono text-[10px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] uppercase">
          Latest Collection
        </span>
        <span className="w-px h-3 bg-white/[0.08]" />
        <span className="font-mono text-[10px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] uppercase">
          New Launch 3D Popup
        </span>
        <span className="w-px h-3 bg-white/[0.08]" />
        <span className="font-mono text-[10px] tracking-[0.22em] text-[rgba(234,223,237,0.42)] uppercase">
          Product 3D Popup
        </span>
      </div>

      {/* Legal */}
      <div className="py-6 border-t border-white/[0.08] flex flex-col md:flex-row justify-between gap-2 font-mono text-[10px] tracking-[0.22em] text-white/[0.26] uppercase">
        <span>&copy; 2026 STREETPLAYR PVT LTD</span>
        <span>Mumbai, India</span>
      </div>
    </footer>
  );
}

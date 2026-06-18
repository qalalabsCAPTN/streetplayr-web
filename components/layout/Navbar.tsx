"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import MobileNavDock from "./MobileNavDock";

const navLinks = [
  { label: "Home", href: "/home" },
  { label: "Collection", href: "/collections" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/home";

  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((count, item) => count + item.quantity, 0);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className="absolute top-0 w-full z-50 bg-transparent">
        <nav className="grid grid-cols-3 items-center w-full mx-auto px-4 md:px-8 lg:px-12 h-20">
          {/* Logo — extreme left */}
          <div className="flex items-center">
            <Link href="/home">
              <img src="/assets/streetplayr-logo.png" alt="StreetplayR" className="h-10 md:h-12 w-auto object-contain opacity-95 transition-all duration-300" />
            </Link>
          </div>

          {/* Nav — perfectly centered */}
          <div className="hidden md:flex justify-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-mono text-[10px] uppercase tracking-[0.28em] text-[rgba(234,223,237,0.55)] transition-colors duration-300 hover:text-[#eadfed]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions — extreme right */}
          <div className="flex items-center justify-end gap-6">
            <Link
              href="/cart"
              className="hidden md:block hover:text-[#eadfed] transition-colors text-[rgba(234,223,237,0.58)] relative"
              aria-label={`Cart${mounted ? ` (${cartCount})` : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#ddb7ff] font-mono text-[8px] font-bold text-[#1b1620] animate-in zoom-in duration-200">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            <Link
              href={isAuthenticated ? "/profile/wallet" : "/login"}
              className="hidden md:block hover:text-[#eadfed] transition-colors text-[rgba(234,223,237,0.58)]"
              aria-label="Wallet"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </Link>
            {mounted && isHydrated && isAuthenticated && user && (
              <Link
                href="/profile"
                className="hidden md:grid h-8 w-8 place-items-center rounded-full bg-[#231e27]/80 border border-white/[0.12] text-xs font-bold text-[rgba(234,223,237,0.72)]"
                aria-label="Profile"
              >
                {user.name?.charAt(0).toUpperCase() || "U"}
              </Link>
            )}
          </div>
        </nav>
      </header>

      <MobileNavDock />
    </>
  );
}

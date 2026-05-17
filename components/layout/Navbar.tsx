"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";

const navLinks = [
  { label: "Shop", href: "/collections" },
  { label: "Archive", href: "/collections?category=ALL" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
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
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#16111b]/84 backdrop-blur-xl border-b border-white/[0.10] shadow-[0_16px_60px_rgba(12,6,18,0.24)]"
          : "bg-transparent"
      }`}
    >
      <nav className="flex justify-between items-center px-4 md:px-14 xl:px-20 h-20 w-full max-w-[1680px] mx-auto">
        <div className="flex items-center gap-10">
          <Link href="/">
            <img src="/assets/streetplayr-logo.png" alt="StreetplayR" className="h-10 w-auto object-contain opacity-95" />
          </Link>
          <div className="hidden md:flex gap-8">
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
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/cart"
            className="hover:text-[#eadfed] transition-colors text-[rgba(234,223,237,0.58)]"
            aria-label={`Cart${mounted ? ` (${cartCount})` : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </Link>
          <Link
            href={isAuthenticated ? "/profile/wallet" : "/login"}
            className="hover:text-[#eadfed] transition-colors text-[rgba(234,223,237,0.58)]"
            aria-label="Wallet"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </Link>
          {mounted && isHydrated && isAuthenticated && user && (
            <Link
              href="/profile"
              className="grid h-8 w-8 place-items-center rounded-full bg-[#231e27]/80 border border-white/[0.12] text-xs font-bold text-[rgba(234,223,237,0.72)]"
              aria-label="Profile"
            >
              {user.name?.charAt(0).toUpperCase() || "U"}
            </Link>
          )}
          <button className="md:hidden hover:text-white transition-colors text-white/60">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}

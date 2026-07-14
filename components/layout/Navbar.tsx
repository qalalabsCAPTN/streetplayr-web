"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import MobileNavDock from "./MobileNavDock";

const navLinks = [
  { label: "Home", href: "/home" },
  {
    label: "Topwear",
    dropdown: [
      { label: "Tees", href: "/collections?category=tees" },
      { label: "Tanks", href: "/collections?category=tanks" },
    ],
  },
  {
    label: "Bottomwear",
    dropdown: [
      { label: "Pants", href: "/collections?category=pants" },
      { label: "Joggers", href: "/collections?category=joggers" },
    ],
  },
  { label: "Accessories", href: "/collections?category=accessories" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((count, item) => count + item.quantity, 0);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = (window as unknown as { __scrollDampingY?: number }).__scrollDampingY !== undefined
        ? (window as unknown as { __scrollDampingY?: number }).__scrollDampingY!
        : window.scrollY;
      const scrolled = scrollY > 80;
      setIsScrolled((prev) => {
        if (prev === scrolled) return prev;
        return scrolled;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <header className={`w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? "fixed top-0 bg-[#16111b]/85 backdrop-blur-md border-b border-white/[0.05] shadow-lg animate-in slide-in-from-top duration-300" 
          : "absolute top-0 bg-transparent"
      }`}>
        <nav className={`grid grid-cols-3 items-center w-full mx-auto px-4 md:px-8 lg:px-12 transition-all duration-300 ${
          isScrolled ? "h-16" : "h-20"
        }`}>
          {/* Logo — extreme left */}
          <div className="flex items-center">
            <Link href="/home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/assets/streetplayr-logo.png" 
                alt="StreetplayR" 
                className={`w-auto object-contain opacity-95 transition-all duration-300 ${
                  isScrolled ? "h-8 md:h-9" : "h-10 md:h-12"
                }`} 
              />
            </Link>
          </div>

          {/* Nav — perfectly centered */}
          <div className="hidden md:flex justify-center gap-6 lg:gap-8">
            {navLinks.map((link) => {
              if (link.dropdown) {
                return (
                  <div
                    key={link.label}
                    className="relative group py-2"
                    onMouseEnter={() => setActiveDropdown(link.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button className="font-mono text-[10px] uppercase tracking-[0.24em] text-[rgba(234,223,237,0.55)] transition-colors duration-300 hover:text-[#eadfed] flex items-center gap-1 cursor-pointer">
                      {link.label}
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform duration-300 group-hover:rotate-180">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    <AnimatePresence>
                      {activeDropdown === link.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-[#16111b]/95 backdrop-blur-xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 rounded-xl flex flex-col gap-3 min-w-[180px] z-50 pointer-events-auto"
                        >
                          {link.dropdown.map((sub) => (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              onClick={() => setActiveDropdown(null)}
                              className="font-mono text-[9px] uppercase tracking-[0.22em] text-[rgba(234,223,237,0.55)] hover:text-[#ddb7ff] transition-colors py-1 block"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return (
                <Link
                  key={link.label}
                  href={link.href!}
                  className="font-mono text-[10px] uppercase tracking-[0.28em] text-[rgba(234,223,237,0.55)] transition-colors duration-300 hover:text-[#eadfed] py-2"
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Actions — extreme right */}
          <div className="flex items-center justify-end gap-4 md:gap-6">
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

            {/* Mobile Hamburguer Trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center w-10 h-10 border border-white/[0.1] text-[#eadfed] hover:text-white rounded-xl bg-[#231e27]/40 cursor-pointer"
              aria-label="Open Menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-[80%] max-w-[320px] bg-[#16111b] border-l border-white/[0.08] p-6 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-white/[0.06]">
                  <span className="font-display text-lg tracking-wider text-[#eadfed]">MENU</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-8 h-8 border border-white/[0.1] text-white/50 hover:text-white grid place-items-center rounded-lg cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <nav className="flex flex-col gap-6">
                  {/* Home */}
                  <Link
                    href="/home"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-mono text-xs uppercase tracking-[0.22em] text-[#eadfed] hover:text-[#ddb7ff]"
                  >
                    Home
                  </Link>

                  {/* Topwear */}
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 block">Topwear</span>
                    <div className="pl-4 flex flex-col gap-3">
                      <Link
                        href="/collections?category=tees"
                        onClick={() => setMobileMenuOpen(false)}
                        className="font-mono text-xs uppercase tracking-[0.22em] text-[#eadfed] hover:text-[#ddb7ff]"
                      >
                        • Tees
                      </Link>
                      <Link
                        href="/collections?category=tanks"
                        onClick={() => setMobileMenuOpen(false)}
                        className="font-mono text-xs uppercase tracking-[0.22em] text-[#eadfed] hover:text-[#ddb7ff]"
                      >
                        • Tanks
                      </Link>
                    </div>
                  </div>

                  {/* Bottomwear */}
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 block">Bottomwear</span>
                    <div className="pl-4 flex flex-col gap-3">
                      <Link
                        href="/collections?category=pants"
                        onClick={() => setMobileMenuOpen(false)}
                        className="font-mono text-xs uppercase tracking-[0.22em] text-[#eadfed] hover:text-[#ddb7ff]"
                      >
                        • Pants
                      </Link>
                      <Link
                        href="/collections?category=joggers"
                        onClick={() => setMobileMenuOpen(false)}
                        className="font-mono text-xs uppercase tracking-[0.22em] text-[#eadfed] hover:text-[#ddb7ff]"
                      >
                        • Joggers
                      </Link>
                    </div>
                  </div>

                  {/* Accessories */}
                  <Link
                    href="/collections?category=accessories"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-mono text-xs uppercase tracking-[0.22em] text-[#eadfed] hover:text-[#ddb7ff]"
                  >
                    Accessories
                  </Link>

                  {/* About */}
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-mono text-xs uppercase tracking-[0.22em] text-[#eadfed] hover:text-[#ddb7ff]"
                  >
                    About
                  </Link>

                  {/* Contact */}
                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-mono text-xs uppercase tracking-[0.22em] text-[#eadfed] hover:text-[#ddb7ff]"
                  >
                    Contact
                  </Link>
                </nav>
              </div>

              <div className="pt-6 border-t border-white/[0.06] text-center">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">&copy; STREETPLAYR</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileNavDock />
    </>
  );
}

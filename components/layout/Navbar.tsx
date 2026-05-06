"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "../../store/cartStore";

const navLinks = [
  { label: "Collection", href: "/collection" },
  { label: "Lookbook", href: "/lookbook" },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
];

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="m20 20-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M6.5 8.5h11l-.8 11h-9.4l-.8-11Zm3-1.5a2.5 2.5 0 0 1 5 0v1.5h-5V7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 7a7 7 0 0 0-14 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((count, item) => count + item.quantity, 0);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 80);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-700 ${
        isScrolled
          ? "bg-[#050505]/40 backdrop-blur-xl border-b border-white/5"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex h-[88px] max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12"
      >
        <Link
          aria-label="Street PlayR home"
          className="group flex items-center gap-3"
          href="/"
        >
          <span className="grid h-9 w-9 place-items-center border border-white/20 bg-white text-black transition-transform duration-200 group-hover:-translate-y-0.5">
            <span className="font-display text-xl leading-none tracking-[0.04em]">
              SP
            </span>
          </span>
          <motion.span
            animate={{ opacity: isScrolled ? 0.88 : 1 }}
            className="hidden font-display text-2xl tracking-[0.16em] sm:block"
          >
            STREET PLAYR
          </motion.span>
        </Link>

        <div className="hidden items-center gap-12 md:flex">
          {navLinks.map((link) => (
            <Link
              className="group font-mono text-xs uppercase tracking-[0.2em] text-white/70 transition-colors duration-300 hover:text-white"
              href={link.href}
              key={link.label}
            >
              <span className="relative pb-2">
                {link.label}
                <span className="absolute bottom-0 left-0 h-px w-0 bg-white transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
              </span>
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            aria-label="Search"
            className="grid h-11 w-11 place-items-center text-white/78 transition-colors duration-200 hover:text-white"
            href="/search"
          >
            <SearchIcon />
          </Link>
          <Link
            aria-label="Points wallet"
            className="grid h-11 min-w-11 place-items-center px-3 font-mono text-xs uppercase tracking-[0.12em] text-[var(--sp-accent)] transition-[filter] duration-200 hover:drop-shadow-[0_0_12px_rgba(212,255,30,0.45)]"
            href="/profile"
          >
            640
          </Link>
          <Link
            aria-label={`Cart - ${mounted ? cartCount : 0} items`}
            className="relative grid h-11 w-11 place-items-center text-white/78 transition-colors duration-200 hover:text-white"
            href="/cart"
          >
            <CartIcon />
            {mounted && cartCount > 0 && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-white opacity-80" 
              />
            )}
          </Link>
          <Link
            aria-label="Account"
            className="grid h-11 w-11 place-items-center text-white/78 transition-colors duration-200 hover:text-white"
            href="/login"
          >
            <AccountIcon />
          </Link>
        </div>

        <button
          aria-expanded={isOpen}
          aria-label="Open navigation menu"
          className="grid h-11 w-11 place-items-center md:hidden"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span className="flex w-6 flex-col gap-1.5">
            <span
              className={`h-px bg-white transition-transform duration-200 ${
                isOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px bg-white transition-opacity duration-200 ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-px bg-white transition-transform duration-200 ${
                isOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </nav>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-white/10 bg-black px-4 pb-6 pt-2 md:hidden"
            exit={{ opacity: 0, y: -12 }}
            initial={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="mx-auto flex max-w-7xl flex-col">
              {navLinks.map((link) => (
                <Link
                  className="border-b border-white/10 py-5 font-display text-3xl uppercase tracking-[0.14em]"
                  href={link.href}
                  key={link.label}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-5 grid grid-cols-3 gap-2">
                <Link
                  aria-label="Search"
                  className="grid h-12 place-items-center border border-white/20"
                  href="/search"
                  onClick={() => setIsOpen(false)}
                >
                  <SearchIcon />
                </Link>
                <Link
                  aria-label="Cart"
                  className="grid h-12 place-items-center border border-white/20"
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                >
                  <CartIcon />
                </Link>
                <Link
                  aria-label="Account"
                  className="grid h-12 place-items-center border border-white/20"
                  href="/login"
                  onClick={() => setIsOpen(false)}
                >
                  <AccountIcon />
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

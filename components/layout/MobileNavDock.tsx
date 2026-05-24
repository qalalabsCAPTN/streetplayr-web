"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/cartStore";

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const CollectionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const BagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const NAV_ITEMS: { href: string; icon: React.FC; isCart?: boolean }[] = [
  { href: "/home", icon: HomeIcon },
  { href: "/collections", icon: CollectionIcon },
  { href: "/search", icon: SearchIcon },
  { href: "/cart", icon: BagIcon, isCart: true },
  { href: "/profile", icon: ProfileIcon },
];

export default function MobileNavDock() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/" || pathname === "/home";
    return pathname.startsWith(href);
  };

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 32, delay: 0.15 }}
        className="pointer-events-auto relative"
      >
        <div className="absolute inset-x-4 -bottom-2 h-10 rounded-full blur-2xl bg-[#a855f7]/15 pointer-events-none" />

        <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-[#0d0b10]/85 backdrop-blur-2xl border border-white/[0.10] shadow-[0_0_40px_rgba(168,85,247,0.15),0_8px_32px_rgba(0,0,0,0.6)]">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 ${
                  active
                    ? "bg-[#d8b4fe]/20 border border-[#d8b4fe]/30 text-[#d8b4fe] shadow-[0_0_16px_rgba(216,180,254,0.12)]"
                    : "text-white/40 border border-transparent hover:text-white/70"
                }`}
              >
                <motion.div whileTap={{ scale: 0.85 }}>
                  <item.icon />
                </motion.div>
                {item.isCart && cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#ddb7ff] text-[#0d0b10] text-[9px] font-bold flex items-center justify-center px-[4px] font-mono leading-none"
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

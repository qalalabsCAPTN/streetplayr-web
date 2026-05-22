"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

// ─── Icons ───────────────────────────────────────────────────────────────────

const HomeIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const ShopIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-[3px] min-w-[52px]">
      <motion.div
        whileTap={{ scale: 0.85 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 ${
          active ? "bg-[#d8b4fe]/18 text-[#d8b4fe]" : "text-white/45"
        }`}
      >
        {icon}
      </motion.div>
      <span
        className={`font-mono text-[7.5px] uppercase tracking-[0.14em] transition-colors duration-200 ${
          active ? "text-[#d8b4fe]" : "text-white/30"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MobileNavDock() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const items = useCartStore((s) => s.items);
  const cartCount = items.reduce((n, i) => n + i.quantity, 0);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/" || pathname === "/home";
    return pathname.startsWith(href);
  };

  const drawerLinks: { label: string; href: string }[][] = [
    [
      { label: "Home", href: "/home" },
      { label: "Collections", href: "/collections" },
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    [
      { label: "Profile", href: "/profile" },
      { label: "Orders", href: "/profile/orders" },
      { label: "Addresses", href: "/profile/addresses" },
      { label: "Rewards", href: "/profile/rewards" },
    ],
    [{ label: isAuthenticated ? "Logout" : "Login / Register", href: isAuthenticated ? "/logout" : "/login" }],
  ];

  return (
    <>
      {/* ── Floating Dock ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 32, delay: 0.15 }}
          className="pointer-events-auto relative"
        >
          {/* ambient glow */}
          <div className="absolute inset-x-4 bottom-0 h-12 rounded-full blur-2xl bg-[#a855f7]/20 pointer-events-none" />

          {/* pill */}
          <div className="relative flex items-end gap-0 px-3 py-2.5 rounded-full bg-[#0d0b10]/88 backdrop-blur-2xl border border-white/[0.09] shadow-[0_0_40px_rgba(168,85,247,0.18),0_8px_32px_rgba(0,0,0,0.6)]">

            <NavItem href="/home"        icon={<HomeIcon />}    label="Home"    active={isActive("/home")} />
            <NavItem href="/collections" icon={<ShopIcon />}    label="Shop"    active={isActive("/collections")} />

            {/* ── Cart (elevated) ── */}
            <div className="flex flex-col items-center -mt-4 mx-1.5">
              <Link href="/cart">
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="relative flex items-center justify-center w-[52px] h-[52px] rounded-full border border-white/25"
                  style={{
                    background: "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)",
                    boxShadow: "0 0 28px rgba(192,132,252,0.65), 0 4px 16px rgba(0,0,0,0.45)",
                  }}
                >
                  <CartIcon />
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] rounded-full bg-white text-[#0d0b10] text-[8.5px] font-bold flex items-center justify-center px-[3px] font-mono leading-none"
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
              <span className="font-mono text-[7.5px] uppercase tracking-[0.14em] text-white/30 mt-[3px]">
                Cart
              </span>
            </div>

            <NavItem href="/profile" icon={<ProfileIcon />} label="Profile" active={isActive("/profile")} />

            {/* ── Menu ── */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              onClick={() => setDrawerOpen(true)}
              className="flex flex-col items-center gap-[3px] min-w-[52px]"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full text-white/45">
                <MenuIcon />
              </div>
              <span className="font-mono text-[7.5px] uppercase tracking-[0.14em] text-white/30">
                Menu
              </span>
            </motion.button>

          </div>
        </motion.div>
      </div>

      {/* ── Menu Drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="md:hidden fixed inset-0 z-[60]">

            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-[6px]"
              onClick={() => setDrawerOpen(false)}
            />

            {/* sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 42 }}
              className="absolute bottom-0 left-0 right-0 rounded-t-[26px] border-t border-white/[0.09]"
              style={{
                background: "linear-gradient(180deg, #111018 0%, #0a0910 100%)",
                paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
              }}
            >
              {/* drag handle */}
              <div className="flex justify-center pt-3 pb-4">
                <div className="w-9 h-[3px] rounded-full bg-white/[0.15]" />
              </div>

              {/* close */}
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-[14px] right-5 text-white/30 hover:text-white/70 transition-colors p-1"
              >
                <XIcon />
              </button>

              {/* links */}
              <div className="px-8 pt-2">
                {drawerLinks.map((section, si) => (
                  <div key={si}>
                    {si > 0 && <div className="my-5 h-px bg-white/[0.06]" />}
                    <div className="space-y-[2px]">
                      {section.map(({ label, href }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setDrawerOpen(false)}
                          className="flex items-center py-[11px] font-mono text-[12px] uppercase tracking-[0.24em] text-[rgba(234,223,237,0.48)] hover:text-[#eadfed] transition-colors"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </>
  );
}

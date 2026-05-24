'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

// ─── SVG Icons ───────────────────────────────────────────────────────────
function IconUser({ active }: { active?: boolean }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 7a7 7 0 0 0-14 0"
        stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} strokeLinecap="round" />
    </svg>
  );
}

function IconWallet({ active }: { active?: boolean }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 12h-4a2 2 0 0 0 0 4h4" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} strokeLinecap="round" />
      <rect x="2" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
      <path d="M6 5V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
    </svg>
  );
}

function IconGift({ active }: { active?: boolean }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="8" width="18" height="4" rx="1" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
      <path d="M12 8v13M7 3a3 3 0 0 1 5 2 3 3 0 0 1 5-2" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} strokeLinecap="round" />
      <path d="M12 12v9" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
    </svg>
  );
}

function IconPackage({ active }: { active?: boolean }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m20.5 7-8.5 5-8.5-5" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
      <path d="M12 22V12M3.5 7v10a1 1 0 0 0 .5.87l7.5 4.33a1 1 0 0 0 1 0l7.5-4.33a1 1 0 0 0 .5-.87V7l-8.5-5L3.5 7Z" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
    </svg>
  );
}

function IconMapPin({ active }: { active?: boolean }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
      <path d="M12 22s-7-5.686-7-11a7 7 0 0 1 14 0c0 5.314-7 11-7 11Z" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
    </svg>
  );
}

function IconSettings({ active }: { active?: boolean }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
    </svg>
  );
}

// ─── Nav Items ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Identity',    href: '/profile',         icon: IconUser },
  { label: 'Wallet',      href: '/profile/wallet',   icon: IconWallet },
  { label: 'Rewards',     href: '/profile/rewards',  icon: IconGift },
  { label: 'Orders',      href: '/profile/orders',   icon: IconPackage },
  { label: 'Addresses',   href: '/profile/addresses', icon: IconMapPin },
  { label: 'Settings',    href: '/profile/settings',  icon: IconSettings },
] as const;

// ─── Desktop Identity Navigation Rail ───────────────────────────────────
export function ProfileSidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden md:flex flex-col w-[220px] min-h-screen border-r border-white/[0.06] bg-[#16111b]/80 backdrop-blur-xl sticky top-0 h-screen pt-24 overflow-y-auto"
      aria-label="Profile navigation"
    >
      {/* Rail header */}
      <div className="px-5 pb-5 mb-2 border-b border-white/[0.05]">
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#ddb7ff]/[0.5] block mb-2">[ NAV ]</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">Identity OS v2.0</span>
      </div>

      <div className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              id={`profile-nav-${label.toLowerCase()}`}
              className={`relative flex items-center gap-3 px-3 py-2.5 transition-all duration-300 group ${
                active
                  ? 'text-[#ddb7ff] bg-[#ddb7ff]/[0.04]'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/[0.02]'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {/* Active indicator bar */}
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-[20%] bottom-[20%] w-[2px] bg-[#ddb7ff]"
                  transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                />
              )}

              {/* Icon container with terminal bracket */}
              <span className="flex items-center gap-2 min-w-[20px]">
                {!active && <span className="font-mono text-[8px] text-white/15 group-hover:text-white/30 transition-colors">—</span>}
                <Icon active={active} />
              </span>

              {/* Label */}
              <span className="font-mono text-[10px] uppercase tracking-[0.15em]">{label}</span>

              {/* Active bracket */}
              {active && (
                <span className="ml-auto font-mono text-[9px] text-[#ddb7ff]/[0.4]">{'>'}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Rail footer - session metadata */}
      <div className="mt-auto px-5 pt-4 pb-6 border-t border-white/[0.04]">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500/50" />
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20">Session Active</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-white/12">TERM: OS_v2.0</span>
          <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-white/12">SYS: ONLINE</span>
        </div>
      </div>
    </nav>
  );
}

// ─── Mobile Top Tabs ────────────────────────────────────────────────────
export function ProfileTopTabs() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden overflow-x-auto no-scrollbar -mx-4 px-4 mb-6" aria-label="Profile sections">
      <div className="flex gap-2 min-w-max">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              id={`profile-pill-${label.toLowerCase()}`}
              className={`flex items-center gap-2 py-1.5 px-4 rounded-full border font-mono text-[9px] uppercase tracking-[0.15em] whitespace-nowrap transition-all ${
                active
                  ? 'bg-[#ddb7ff]/20 border-[#ddb7ff]/40 text-[#ddb7ff]'
                  : 'border-white/[0.08] text-white/35 hover:text-white/60 hover:border-white/[0.15]'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon active={active} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

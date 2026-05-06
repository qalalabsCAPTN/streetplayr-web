'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconUser({ active }: { active?: boolean }) {
  return (
    <svg className="profile-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 7a7 7 0 0 0-14 0"
        stroke="currentColor" strokeWidth={active ? '1.9' : '1.5'} strokeLinecap="round" />
    </svg>
  );
}

function IconWallet({ active }: { active?: boolean }) {
  return (
    <svg className="profile-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 12h-4a2 2 0 0 0 0 4h4" stroke="currentColor" strokeWidth={active ? '1.9' : '1.5'} strokeLinecap="round" />
      <rect x="2" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth={active ? '1.9' : '1.5'} />
      <path d="M6 5V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth={active ? '1.9' : '1.5'} />
    </svg>
  );
}

function IconPackage({ active }: { active?: boolean }) {
  return (
    <svg className="profile-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m20.5 7-8.5 5-8.5-5" stroke="currentColor" strokeWidth={active ? '1.9' : '1.5'} />
      <path d="M12 22V12M3.5 7v10a1 1 0 0 0 .5.87l7.5 4.33a1 1 0 0 0 1 0l7.5-4.33a1 1 0 0 0 .5-.87V7l-8.5-5L3.5 7Z" stroke="currentColor" strokeWidth={active ? '1.9' : '1.5'} />
    </svg>
  );
}

function IconMapPin({ active }: { active?: boolean }) {
  return (
    <svg className="profile-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth={active ? '1.9' : '1.5'} />
      <path d="M12 22s-7-5.686-7-11a7 7 0 0 1 14 0c0 5.314-7 11-7 11Z" stroke="currentColor" strokeWidth={active ? '1.9' : '1.5'} />
    </svg>
  );
}

function IconSettings({ active }: { active?: boolean }) {
  return (
    <svg className="profile-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={active ? '1.9' : '1.5'} />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth={active ? '1.9' : '1.5'} />
    </svg>
  );
}

// ─── Nav Items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Identity', href: '/profile', icon: IconUser },
  { label: 'Wallet', href: '/profile/wallet', icon: IconWallet },
  { label: 'Orders', href: '/profile/orders', icon: IconPackage },
  { label: 'Addresses', href: '/profile/addresses', icon: IconMapPin },
  { label: 'Settings', href: '/profile/settings', icon: IconSettings },
] as const;

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
export function ProfileSidebar() {
  const pathname = usePathname();

  return (
    <nav className="profile-sidebar" aria-label="Profile navigation">
      <div className="profile-sidebar-inner">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              id={`profile-nav-${label.toLowerCase()}`}
              className={`profile-sidebar-item ${active ? 'profile-sidebar-item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="profile-sidebar-active-bar"
                  transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                />
              )}
              <Icon active={active} />
              <span className="profile-sidebar-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Mobile Bottom Tab Bar ────────────────────────────────────────────────────
export function ProfileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="profile-tabbar" aria-label="Profile navigation">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            id={`profile-tab-${label.toLowerCase()}`}
            className={`profile-tab-item ${active ? 'profile-tab-item--active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon active={active} />
            <span className="profile-tab-label">{label}</span>
            {active && (
              <motion.div
                layoutId="tab-active"
                className="profile-tab-active-dot"
                transition={{ type: 'spring', stiffness: 380, damping: 40 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

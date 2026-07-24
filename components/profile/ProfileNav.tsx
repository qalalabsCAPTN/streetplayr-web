'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ─── SVG Icons ───────────────────────────────────────────────────────────
function IconUser({ active }: { active?: boolean }) {
  return (
    <svg className="acct-nav__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 7a7 7 0 0 0-14 0"
        stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} strokeLinecap="round" />
    </svg>
  );
}

function IconWallet({ active }: { active?: boolean }) {
  return (
    <svg className="acct-nav__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 12h-4a2 2 0 0 0 0 4h4" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} strokeLinecap="round" />
      <rect x="2" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
      <path d="M6 5V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
    </svg>
  );
}

function IconGift({ active }: { active?: boolean }) {
  return (
    <svg className="acct-nav__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="8" width="18" height="4" rx="1" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
      <path d="M12 8v13M7 3a3 3 0 0 1 5 2 3 3 0 0 1 5-2" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} strokeLinecap="round" />
      <path d="M12 12v9" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
    </svg>
  );
}

function IconPackage({ active }: { active?: boolean }) {
  return (
    <svg className="acct-nav__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m20.5 7-8.5 5-8.5-5" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
      <path d="M12 22V12M3.5 7v10a1 1 0 0 0 .5.87l7.5 4.33a1 1 0 0 0 1 0l7.5-4.33a1 1 0 0 0 .5-.87V7l-8.5-5L3.5 7Z" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
    </svg>
  );
}

function IconMapPin({ active }: { active?: boolean }) {
  return (
    <svg className="acct-nav__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
      <path d="M12 22s-7-5.686-7-11a7 7 0 0 1 14 0c0 5.314-7 11-7 11Z" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
    </svg>
  );
}

function IconSettings({ active }: { active?: boolean }) {
  return (
    <svg className="acct-nav__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth={active ? '1.7' : '1.3'} />
    </svg>
  );
}

// ─── Nav Items ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Overview',        href: '/profile',           icon: IconUser },
  { label: 'Wallet',          href: '/profile/wallet',    icon: IconWallet },
  { label: 'Rewards',         href: '/profile/rewards',   icon: IconGift },
  { label: 'Orders',          href: '/profile/orders',    icon: IconPackage },
  { label: 'Addresses',       href: '/profile/addresses', icon: IconMapPin },
  { label: 'Settings',        href: '/profile/settings',  icon: IconSettings },
] as const;

// ─── Desktop sidebar ───────────────────────────────────
export function ProfileSidebar() {
  const pathname = usePathname();

  return (
    <nav className="acct-nav" aria-label="Profile navigation">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            id={`profile-nav-${label.toLowerCase()}`}
            className={`acct-nav__item ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon active={active} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Mobile tabs — editorial rail, not chunky chips ─────────────────────
export function ProfileTopTabs() {
  const pathname = usePathname();

  return (
    <nav className="acct-tabs" aria-label="Profile sections">
      <div className="acct-tabs__rail">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              id={`profile-pill-${label.toLowerCase()}`}
              className={`acct-tabs__item ${active ? 'active' : ''}`}
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

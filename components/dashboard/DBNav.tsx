'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '◈' },
  { label: 'Rewards', href: '/dashboard/rewards', icon: '✦' },
  { label: 'Referrals', href: '/dashboard/referrals', icon: '↗' },
  { label: 'Wallet', href: '/dashboard/wallet', icon: '◉' },
  { label: 'Orders', href: '/dashboard/orders', icon: '⊞' },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <nav className="dash-sidebar" aria-label="Dashboard navigation">
      <div className="dash-sidebar-header">
        <Link href="/dashboard" className="dash-sidebar-brand">
          <span className="dash-sidebar-logo">SP</span>
          <span className="dash-sidebar-label">NECTAR</span>
        </Link>
      </div>
      <div className="dash-sidebar-items">
        {NAV_ITEMS.map(({ label, href, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`dash-sidebar-item ${active ? 'dash-sidebar-item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  layoutId="dash-sidebar-active"
                  className="dash-sidebar-active-bar"
                  transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                />
              )}
              <span className="dash-sidebar-icon">{icon}</span>
              <span className="dash-sidebar-text">{label}</span>
            </Link>
          );
        })}
      </div>
      <div className="dash-sidebar-footer">
        <Link href="/profile" className="dash-sidebar-back">Back to Profile</Link>
      </div>
    </nav>
  );
}

export function DashboardTabBar() {
  const pathname = usePathname();

  return (
    <nav className="dash-tabbar" aria-label="Dashboard navigation">
      {NAV_ITEMS.map(({ label, href, icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`dash-tab-item ${active ? 'dash-tab-item--active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="dash-tab-icon">{icon}</span>
            <span className="dash-tab-label">{label}</span>
            {active && (
              <motion.div
                layoutId="dash-tab-active"
                className="dash-tab-active-dot"
                transition={{ type: 'spring', stiffness: 380, damping: 40 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

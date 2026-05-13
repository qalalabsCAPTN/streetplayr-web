'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Command Center', href: '/admin', icon: '◈' },
  { label: 'NECTAR', href: '/admin/nectar', icon: '✦' },
  { label: 'Users', href: '/admin/users', icon: '⊙' },
  { label: 'Rewards', href: '/admin/rewards', icon: '◉' },
  { label: 'Referrals', href: '/admin/referrals', icon: '↗' },
  { label: 'Wallet', href: '/admin/wallet', icon: '◈' },
  { label: 'Analytics', href: '/admin/analytics', icon: '◈' },
  { label: 'Orders', href: '/admin/orders', icon: '⊞' },
  { label: 'Products', href: '/admin/products', icon: '⊠' },
  { label: 'OpsOS', href: '/ops', icon: '⚙' },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="admin-sidebar" aria-label="Admin navigation">
      <div className="admin-sidebar-header">
        <Link href="/admin" className="admin-sidebar-brand">
          <span className="admin-sidebar-logo">SP</span>
          <div className="admin-sidebar-brand-text">
            <span className="admin-sidebar-name">STREET PLAYR</span>
            <span className="admin-sidebar-role">Admin Console</span>
          </div>
        </Link>
      </div>
      <div className="admin-sidebar-items">
        {NAV_ITEMS.map(({ label, href, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`admin-sidebar-item ${active ? 'admin-sidebar-item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  layoutId="admin-sidebar-active"
                  className="admin-sidebar-active-bar"
                  transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                />
              )}
              <span className="admin-sidebar-icon">{icon}</span>
              <span className="admin-sidebar-text">{label}</span>
            </Link>
          );
        })}
      </div>
      <div className="admin-sidebar-footer">
        <Link href="/" className="admin-sidebar-back">← Storefront</Link>
      </div>
    </nav>
  );
}

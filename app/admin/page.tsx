'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AdminOverview {
  totalUsers: number; activeCampaigns: number; totalOrders: number; totalSprrIssued: number;
  pendingReferrals: number; activeWallets: number;
}

export default function AdminPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/overview');
        if (res.ok) { setData(await res.json()); }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="admin-loading"><div className="dash-loading-pulse" /></div>;

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <h1 className="admin-hero-title">Command Center</h1>
        <p className="admin-hero-sub">NECTAR Administration · StreetPlayR Operations</p>
      </section>

      <section className="admin-cards-grid">
        {[
          { label: 'Total Users', value: data?.totalUsers ?? 0 },
          { label: 'Active Wallets', value: data?.activeWallets ?? 0 },
          { label: 'SP-RR Issued', value: (data?.totalSprrIssued ?? 0).toLocaleString() },
          { label: 'Active Campaigns', value: data?.activeCampaigns ?? 0 },
          { label: 'Total Orders', value: data?.totalOrders ?? 0 },
          { label: 'Pending Referrals', value: data?.pendingReferrals ?? 0 },
        ].map((stat, i) => (
          <motion.div key={stat.label} className="admin-stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="admin-stat-label">{stat.label}</div>
            <div className="admin-stat-value">{stat.value}</div>
          </motion.div>
        ))}
      </section>

      <section className="admin-nav-grid">
        {[
          { label: 'NECTAR Analytics', href: '/admin/nectar', desc: 'Tier distribution, XP metrics, engagement' },
          { label: 'User Management', href: '/admin/users', desc: 'Profiles, roles, activity' },
          { label: 'Reward Management', href: '/admin/rewards', desc: 'Bonus campaigns, redemptions' },
          { label: 'Referral System', href: '/admin/referrals', desc: 'Referral tree, claims, edges' },
          { label: 'Wallet Oversight', href: '/admin/wallet', desc: 'Transactions, burn rate, adjustments' },
          { label: 'Analytics', href: '/admin/analytics', desc: 'Revenue, orders, user growth' },
          { label: 'Orders', href: '/admin/orders', desc: 'Order management, fulfillment' },
          { label: 'Products', href: '/admin/products', desc: 'Product catalog, inventory' },
        ].map((item) => (
          <a key={item.href} href={item.href} className="admin-nav-card">
            <div className="admin-nav-label">{item.label}</div>
            <div className="admin-nav-desc">{item.desc}</div>
          </a>
        ))}
      </section>
    </div>
  );
}

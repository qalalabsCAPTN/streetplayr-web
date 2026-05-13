import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const admin = createAdminClient();
  const [profilesRes, ordersRes, campaignsRes] = await Promise.all([
    admin.from('profiles').select('role, created_at').limit(1000),
    admin.from('orders').select('status, grand_total, created_at').limit(1000),
    admin.from('bonus_campaigns').select('*'),
  ]);
  const profiles = profilesRes.data ?? []; const orders = ordersRes.data ?? []; const campaigns = campaignsRes.data ?? [];
  const roleCount: Record<string, number> = {};
  profiles.forEach((p: any) => { const r = p.role || 'member'; roleCount[r] = (roleCount[r] || 0) + 1; });
  const totalRevenue = orders.reduce((s: number, o: any) => s + (o.grand_total ?? 0), 0);
  const orderStatuses: Record<string, number> = {};
  orders.forEach((o: any) => { const s = o.status || 'unknown'; orderStatuses[s] = (orderStatuses[s] || 0) + 1; });
  return (
    <div className="admin-page">
      <section className="admin-hero"><h1 className="admin-hero-title">Analytics</h1><p className="admin-hero-sub">Revenue, orders, and user growth</p></section>
      <section className="admin-cards-grid">
        <div className="admin-stat-card"><div className="admin-stat-label">Total Revenue</div><div className="admin-stat-value">₹{(totalRevenue / 100).toLocaleString()}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Total Orders</div><div className="admin-stat-value">{orders.length}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Total Profiles</div><div className="admin-stat-value">{profiles.length}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Campaigns</div><div className="admin-stat-value">{campaigns.length}</div></div>
      </section>
      <div className="admin-grid-cols-2">
        <section className="admin-section"><h2 className="admin-section-title">Role Distribution</h2>
          <div className="admin-stat-list">{Object.entries(roleCount).sort(([,a], [,b]) => b - a).map(([role, count]) => (
            <div key={role} className="admin-stat-row"><span className="admin-role-badge">{role}</span><span className="admin-stat-row-value">{count}</span></div>
          ))}</div></section>
        <section className="admin-section"><h2 className="admin-section-title">Order Status</h2>
          <div className="admin-stat-list">{Object.entries(orderStatuses).sort(([,a], [,b]) => b - a).map(([status, count]) => (
            <div key={status} className="admin-stat-row"><span className="admin-role-badge">{status}</span><span className="admin-stat-row-value">{count}</span></div>
          ))}</div></section>
      </div>
    </div>
  );
}

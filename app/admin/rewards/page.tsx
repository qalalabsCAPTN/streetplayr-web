import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';

export default async function RewardsPage() {
  const admin = createAdminClient();
  const [campaignsRes, redemptionsRes] = await Promise.all([
    admin.from('bonus_campaigns').select('*').order('created_at', { ascending: false }).limit(50),
    admin.from('reward_redemptions').select('*').order('created_at', { ascending: false }).limit(50),
  ]);
  const campaigns = campaignsRes.data ?? []; const redemptions = redemptionsRes.data ?? [];
  return (
    <div className="admin-page">
      <section className="admin-hero"><h1 className="admin-hero-title">Reward Management</h1><p className="admin-hero-sub">{campaigns.length} campaigns · {redemptions.length} redemptions</p></section>
      <section className="admin-section"><h2 className="admin-section-title">Bonus Campaigns</h2>
        {campaigns.length > 0 ? (<div className="admin-cards-grid">{(campaigns as any[]).map((c: any) => (
          <div key={c.id} className="admin-stat-card">
            <div className="flex justify-between items-start mb-2"><div className="admin-stat-label">{c.name}</div><span className={`text-[9px] font-mono uppercase ${c.is_active ? 'text-green-400' : 'text-white/30'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></div>
            {c.description && <p className="admin-stat-sub">{c.description}</p>}
            <div className="admin-badge-row mt-2">{c.sprr_reward > 0 && <span className="admin-badge admin-badge-accent">+{c.sprr_reward} SP-RR</span>}{c.xp_reward > 0 && <span className="admin-badge admin-badge-blue">+{c.xp_reward} XP</span>}</div>
          </div>
        ))}</div>) : <div className="dash-empty"><p className="dash-empty-title">No campaigns found</p></div>}
      </section>
      <section className="admin-section"><h2 className="admin-section-title">Recent Redemptions</h2>
        {redemptions.length > 0 ? (
          <table className="admin-table"><thead><tr><th>Description</th><th>Cost</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{(redemptions as any[]).map((r: any) => (
              <tr key={r.id}><td>{r.description}</td><td>{r.sprr_cost} SP</td>
                <td><span className={`admin-role-badge ${r.status === 'fulfilled' ? 'admin-role-super-admin' : ''}`}>{r.status}</span></td>
                <td className="admin-table-mono">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td></tr>
            ))}</tbody></table>
        ) : <div className="dash-empty"><p className="dash-empty-title">No redemptions yet</p></div>}
      </section>
    </div>
  );
}

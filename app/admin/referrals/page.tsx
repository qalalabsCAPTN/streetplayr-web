import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';

export default async function ReferralsPage() {
  const admin = createAdminClient();
  const [claimsRes, edgesRes] = await Promise.all([
    admin.from('referral_claims').select('*').order('created_at', { ascending: false }).limit(100),
    admin.from('referral_edges').select('*').order('created_at', { ascending: false }).limit(100),
  ]);
  const claims = claimsRes.data ?? []; const edges = edgesRes.data ?? [];
  const totalSprr = claims.reduce((s: number, c: any) => s + (c.bonus_sprr ?? 0), 0);
  const totalXp = claims.reduce((s: number, c: any) => s + (c.bonus_xp ?? 0), 0);
  return (
    <div className="admin-page">
      <section className="admin-hero"><h1 className="admin-hero-title">Referral System</h1><p className="admin-hero-sub">{claims.length} claims · {edges.length} edges</p></section>
      <section className="admin-cards-grid">
        <div className="admin-stat-card"><div className="admin-stat-label">Total Claims</div><div className="admin-stat-value">{claims.length}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Total Edges</div><div className="admin-stat-value">{edges.length}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">SP-RR Awarded</div><div className="admin-stat-value">{totalSprr.toLocaleString()}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">XP Awarded</div><div className="admin-stat-value">{totalXp.toLocaleString()}</div></div>
      </section>
      {claims.length > 0 && (
        <section className="admin-section"><h2 className="admin-section-title">Referral Claims</h2>
          <table className="admin-table"><thead><tr><th>Referrer</th><th>Referred</th><th>Status</th><th>SP-RR</th><th>XP</th><th>Date</th></tr></thead>
            <tbody>{(claims as any[]).map((c: any) => (
              <tr key={c.id}><td className="admin-table-mono">{c.referrer_id?.slice(0, 8)}...</td><td className="admin-table-mono">{c.referred_id?.slice(0, 8)}...</td>
                <td><span className="admin-role-badge">{c.status}</span></td><td>{c.bonus_sprr ?? 0}</td><td>{c.bonus_xp ?? 0}</td>
                <td className="admin-table-mono">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td></tr>
            ))}</tbody></table>
        </section>
      )}
    </div>
  );
}

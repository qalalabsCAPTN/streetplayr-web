import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';

export default async function AdminWalletPage() {
  const admin = createAdminClient();
  const { data: profiles } = await admin.from('profiles').select('sprr_balance, xp').limit(1000);
  const { data: claims } = await admin.from('referral_claims').select('bonus_sprr').limit(1000);
  const { data: adjustments } = await admin.from('manual_wallet_adjustments').select('*').order('created_at', { ascending: false }).limit(50);
  const activeBalances = (profiles ?? []).map((p: any) => p.sprr_balance ?? 0);
  const totalSprrInCirculation = activeBalances.reduce((s: number, b: number) => s + b, 0);
  const activeWallets = activeBalances.filter((b: number) => b > 0).length;
  const avgWallet = activeWallets > 0 ? Math.round(totalSprrInCirculation / activeWallets) : 0;
  const totalSprrAwarded = (claims ?? []).reduce((s: number, c: any) => s + (c.bonus_sprr ?? 0), 0);
  return (
    <div className="admin-page">
      <section className="admin-hero"><h1 className="admin-hero-title">Wallet Oversight</h1><p className="admin-hero-sub">{activeWallets} active wallets · {totalSprrInCirculation.toLocaleString()} SP-RR</p></section>
      <section className="admin-cards-grid">
        <div className="admin-stat-card"><div className="admin-stat-label">Total SP-RR</div><div className="admin-stat-value">{totalSprrInCirculation.toLocaleString()}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Active Wallets</div><div className="admin-stat-value">{activeWallets}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Avg Wallet</div><div className="admin-stat-value">{avgWallet.toLocaleString()}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Total Awarded</div><div className="admin-stat-value">{totalSprrAwarded.toLocaleString()}</div></div>
      </section>
      {(adjustments ?? []).length > 0 && (
        <section className="admin-section"><h2 className="admin-section-title">Manual Adjustments</h2>
          <table className="admin-table"><thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Reason</th><th>Date</th></tr></thead>
            <tbody>{(adjustments as any[]).map((a: any) => (
              <tr key={a.id}><td className="admin-table-mono">{a.user_id?.slice(0, 8)}...</td>
                <td><span className={`admin-role-badge ${a.adjustment_type === 'credit' ? 'admin-role-super-admin' : ''}`}>{a.adjustment_type}</span></td>
                <td>{a.amount}</td><td className="admin-table-mono">{a.reason}</td>
                <td className="admin-table-mono">{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td></tr>
            ))}</tbody></table>
        </section>
      )}
    </div>
  );
}

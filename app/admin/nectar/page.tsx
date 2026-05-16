import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';

export default async function NectarPage() {
  const admin = createAdminClient();
  const [profilesRes, campaignsRes, claimsRes, redemptionsRes] = await Promise.all([
    admin.from('profiles').select('role, xp, lifetime_xp').limit(1000),
    admin.from('bonus_campaigns').select('*'),
    admin.from('referral_claims').select('*'),
    admin.from('reward_redemptions').select('*'),
  ]);
  const profiles = profilesRes.data ?? []; const campaigns = campaignsRes.data ?? []; const claims = claimsRes.data ?? []; const redemptions = redemptionsRes.data ?? [];
  const totalXp = profiles.reduce((s: number, p: any) => s + (p.xp ?? 0), 0);
  const totalLifetimeXp = profiles.reduce((s: number, p: any) => s + (p.lifetime_xp ?? 0), 0);
  const totalSprrFromClaims = claims.reduce((s: number, c: any) => s + (c.bonus_sprr ?? 0), 0);
  const totalSprrRedeemed = redemptions.reduce((s: number, r: any) => s + (r.sprr_cost ?? 0), 0);
  const activeCampaigns = campaigns.filter((c: any) => c.is_active).length;
  return (
    <div className="admin-page">
      <section className="admin-hero"><h1 className="admin-hero-title">NECTAR Analytics</h1><p className="admin-hero-sub">Loyalty engine metrics</p></section>
      <section className="admin-cards-grid">
        <div className="admin-stat-card"><div className="admin-stat-label">Total XP Issued</div><div className="admin-stat-value">{totalXp.toLocaleString()}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Lifetime XP</div><div className="admin-stat-value">{totalLifetimeXp.toLocaleString()}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">SP-RR from Referrals</div><div className="admin-stat-value">{totalSprrFromClaims.toLocaleString()}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">SP-RR Redeemed</div><div className="admin-stat-value">{totalSprrRedeemed.toLocaleString()}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Active Campaigns</div><div className="admin-stat-value">{activeCampaigns}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Total Profiles</div><div className="admin-stat-value">{profiles.length}</div></div>
      </section>
    </div>
  );
}

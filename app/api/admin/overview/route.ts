import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const admin = createAdminClient();

    const [profilesRes, campaignsRes, ordersRes, claimsRes] = await Promise.all([
      admin.from('profiles').select('sprr_balance, role').limit(1000),
      admin.from('bonus_campaigns').select('*').eq('is_active', true),
      admin.from('orders').select('id, status'),
      admin.from('referral_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    const profiles = profilesRes.data ?? [];
    const activeCampaigns = (campaignsRes.data ?? []).length;
    const totalOrders = (ordersRes.data ?? []).length;

    const activeBalances = profiles.map((p: any) => p.sprr_balance ?? 0);
    const totalSprrIssued = activeBalances.reduce((s: number, b: number) => s + b, 0);
    const activeWallets = activeBalances.filter((b: number) => b > 0).length;
    const pendingReferrals = (claimsRes.count ?? 0);

    return NextResponse.json({
      totalUsers: profiles.length,
      activeCampaigns,
      totalOrders,
      totalSprrIssued,
      pendingReferrals,
      activeWallets,
    });
  } catch {
    return NextResponse.json({
      totalUsers: 0, activeCampaigns: 0, totalOrders: 0,
      totalSprrIssued: 0, pendingReferrals: 0, activeWallets: 0,
    });
  }
}

import { createAdminClient } from '@/lib/supabase/admin';
import { TopBar } from '@/components/ops2/top-bar';

export const dynamic = 'force-dynamic';

export default async function AdminReferralsPage() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('referral_claims')
    .select('id, referrer_id, referred_id, bonus_sprr, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Referrals" />
      <div className="flex-1 pt-14 p-5 overflow-y-auto">
        <h2 className="page-title mb-4">Live referral claims</h2>
        {error && <p className="text-sm text-status-error">{error.message}</p>}
        {!error && (data ?? []).length === 0 && (
          <p className="text-sm text-text-muted">No referral_claims rows yet. Demo ambassador names were removed.</p>
        )}
        <div className="space-y-2">
          {(data ?? []).map((row) => (
            <div key={row.id} className="surface p-3 text-sm font-mono">
              {row.referrer_id?.slice(0, 8)} → {row.referred_id?.slice(0, 8)} · {row.bonus_sprr ?? 0} SPRR · {row.created_at}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

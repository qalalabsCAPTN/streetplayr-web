import { createAdminClient } from '@/lib/supabase/admin';
import { TopBar } from '@/components/ops2/top-bar';
import { deriveTier } from '@/lib/nectar/engine';

export const dynamic = 'force-dynamic';

export default async function AdminProgressionPage() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, sprr_balance, xp')
    .order('xp', { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Progression" />
      <div className="flex-1 pt-14 p-5 overflow-y-auto">
        <h2 className="page-title mb-2">Live tiers</h2>
        <p className="text-sm text-text-muted mb-4">Street / Playr / Legend from profiles.sprr_balance. Seed/Bloom/Apex demo tiers removed.</p>
        {error && <p className="text-sm text-status-error">{error.message}</p>}
        <div className="space-y-2">
          {(data ?? []).map((row) => (
            <div key={row.id} className="surface p-3 text-sm">
              {row.email || row.id.slice(0, 8)} · {deriveTier(Number(row.sprr_balance ?? 0))} · {row.xp ?? 0} XP · {row.sprr_balance ?? 0} SPRR
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

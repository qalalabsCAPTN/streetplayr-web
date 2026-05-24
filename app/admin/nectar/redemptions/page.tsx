import { createAdminClient } from '@/lib/supabase/admin';
import { TopBar } from '@/components/ops2/top-bar';
import { RedemptionFulfillButton } from './fulfill-button';

export const dynamic = 'force-dynamic';

export default async function RedemptionsPage() {
  const admin = createAdminClient();

  const { data: pending } = await admin
    .from('reward_redemptions')
    .select('*, profiles(full_name, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const { data: fulfilled } = await admin
    .from('reward_redemptions')
    .select('*, profiles(full_name, email)')
    .eq('status', 'fulfilled')
    .order('fulfilled_at', { ascending: false })
    .limit(50);

  const pendingTotal = (pending ?? []).reduce((s: number, r: any) => s + (r.sprr_cost ?? 0), 0);

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Redemptions" />
      <div className="flex-1 pt-14 overflow-y-auto p-5 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">Reward Redemptions</h2>
            <p className="text-sm text-text-muted mt-0.5">
              Pending fulfillment queue · {pending?.length ?? 0} pending · {pendingTotal.toLocaleString()} SP-RR outstanding
            </p>
          </div>
        </div>

        {/* Pending */}
        <div className="space-y-3">
          <div className="section-title text-status-warning">
            Pending · {pending?.length ?? 0}
          </div>

          {(pending?.length ?? 0) === 0 ? (
            <div className="surface p-8 text-center text-text-muted text-sm">
              No pending redemptions — queue is clear ✓
            </div>
          ) : (
            <div className="surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Description</th>
                    <th className="text-right px-4 py-3">SP-RR Cost</th>
                    <th className="text-left px-4 py-3">Requested</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {(pending ?? []).map((r: any) => (
                    <tr key={r.id} className="hover:bg-base-elevated transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-text-primary font-medium">
                          {r.profiles?.full_name ?? '—'}
                        </div>
                        <div className="text-text-muted text-xs font-mono">
                          {r.profiles?.email ?? r.user_id?.slice(0, 12) + '...'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary max-w-xs truncate">
                        {r.description}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-nectar-300">
                        {r.sprr_cost?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">
                        {new Date(r.redeemed_at ?? r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RedemptionFulfillButton id={r.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Fulfilled */}
        <div className="space-y-3">
          <div className="section-title text-text-muted">
            Recently Fulfilled · {fulfilled?.length ?? 0}
          </div>

          {(fulfilled?.length ?? 0) === 0 ? (
            <div className="surface p-6 text-center text-text-muted text-xs">
              No fulfilled redemptions yet
            </div>
          ) : (
            <div className="surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Description</th>
                    <th className="text-right px-4 py-3">SP-RR Cost</th>
                    <th className="text-left px-4 py-3">Fulfilled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {(fulfilled ?? []).map((r: any) => (
                    <tr key={r.id} className="opacity-60 hover:opacity-100 transition-opacity">
                      <td className="px-4 py-3">
                        <div className="text-text-primary font-medium">
                          {r.profiles?.full_name ?? '—'}
                        </div>
                        <div className="text-text-muted text-xs font-mono">
                          {r.profiles?.email ?? r.user_id?.slice(0, 12) + '...'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary max-w-xs truncate">
                        {r.description}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-muted">
                        {r.sprr_cost?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">
                        {r.fulfilled_at ? new Date(r.fulfilled_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

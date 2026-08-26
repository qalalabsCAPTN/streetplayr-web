import { TopBar } from '@/components/ops2/top-bar';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminAchievementsPage() {
  const admin = createAdminClient();
  const { data, error } = await admin.from('loyalty_quests').select('slug,name,description,steps,sprr_reward,xp_reward,is_active');

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Achievements" />
      <div className="flex-1 pt-14 p-5 overflow-y-auto">
        <h2 className="page-title mb-4">Loyalty quests</h2>
        {error && <p className="text-sm text-status-error">{error.message}</p>}
        {!error && (data ?? []).length === 0 && (
          <p className="text-sm text-text-muted">No live quests. Apply migration 100008.</p>
        )}
        <div className="space-y-3">
          {(data ?? []).map((q) => (
            <div key={q.slug} className="surface p-4">
              <div className="font-medium">{q.name}</div>
              <div className="text-sm text-text-muted">{q.description}</div>
              <div className="text-xs font-mono mt-2">
                {q.slug} · {q.steps} steps · {q.sprr_reward} SPRR · {q.xp_reward} XP · {q.is_active ? 'active' : 'off'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

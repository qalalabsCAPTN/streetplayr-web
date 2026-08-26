'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getWalletBalance, getWalletTransactions } from '@/lib/nectar/wallet';
import { deriveTier, getProgress } from '@/lib/nectar/engine';
import { getOrGenerateCode, getReferralStats, getReferralEdges } from '@/lib/nectar/referrals';

export type LoyaltyQuestView = {
  id: string;
  slug: string;
  name: string;
  description: string;
  steps: number;
  done: number;
  status: 'active' | 'completed' | 'available';
};

export async function getLoyaltySnapshotAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'Not authenticated.' };

  const wallet = await getWalletBalance(user.id);
  const progress = getProgress(wallet.sprrBalance);
  const code = await getOrGenerateCode(user.id);
  const stats = await getReferralStats(user.id);
  const edges = await getReferralEdges(user.id);

  const admin = createAdminClient();
  let questViews: LoyaltyQuestView[] = [];
  try {
    const { data: quests } = await admin.from('loyalty_quests').select('*').eq('is_active', true);
    const { data: questProgress } = await admin
      .from('loyalty_quest_progress')
      .select('*')
      .eq('user_id', user.id);

    const progressByQuest = new Map((questProgress ?? []).map((row: any) => [row.quest_id, row]));
    questViews = (quests ?? []).map((q: any) => {
      const row = progressByQuest.get(q.id);
      const done = Number(row?.done ?? 0);
      const steps = Number(q.steps ?? 1);
      const completed = Boolean(row?.completed_at) || done >= steps;
      return {
        id: q.id,
        slug: q.slug,
        name: q.name,
        description: q.description ?? '',
        steps,
        done,
        status: completed ? 'completed' : done > 0 ? 'active' : 'available',
      };
    });
  } catch {
    questViews = [];
  }

  return {
    success: true as const,
    data: {
      userId: user.id,
      email: user.email ?? '',
      sprrBalance: wallet.sprrBalance,
      xp: wallet.xp,
      lifetimeEarned: wallet.lifetimeEarned,
      lifetimeRedeemed: wallet.lifetimeRedeemed,
      tier: deriveTier(wallet.sprrBalance),
      nextTier: progress.next,
      progressPct: Math.round(progress.progress * 100),
      referralCode: code,
      referralStats: stats,
      referralEdges: edges,
      quests: questViews,
    },
  };
}

export async function getLeaderboardAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'Not authenticated.' };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, email, xp, sprr_balance')
    .order('xp', { ascending: false })
    .limit(25);
  if (error) return { success: false as const, error: error.message };
  return {
    success: true as const,
    data: (data ?? []).map((row, index) => ({
      rank: index + 1,
      id: row.id,
      name: row.full_name || row.email || 'Member',
      xp: Number(row.xp ?? 0),
      sprr: Number(row.sprr_balance ?? 0),
      isSelf: row.id === user.id,
    })),
  };
}

export async function getActivityAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'Not authenticated.' };
  const txs = await getWalletTransactions(user.id);
  return { success: true as const, data: txs };
}

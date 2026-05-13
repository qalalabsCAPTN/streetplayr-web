import { createAdminClient } from '@/lib/supabase/admin';

export interface UserProgression {
  tier: string;
  lifetimeXp: number;
  seasonXp: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveAt: string | null;
}

/**
 * Get progression data for a user from their profile.
 */
export async function getProgression(userId: string): Promise<UserProgression | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('profiles')
      .select('xp, lifetime_xp, current_streak_days, longest_streak_days, last_active_at, sprr_balance')
      .eq('id', userId)
      .single();

    if (!data) return null;

    const { deriveTier } = await import('./engine');
    const tier = deriveTier(data.sprr_balance ?? 0);

    return {
      tier,
      lifetimeXp: data.lifetime_xp ?? data.xp ?? 0,
      seasonXp: data.xp ?? 0,
      currentStreakDays: data.current_streak_days ?? 0,
      longestStreakDays: data.longest_streak_days ?? 0,
      lastActiveAt: data.last_active_at,
    };
  } catch {
    return null;
  }
}

/**
 * Record daily activity — updates streak via RPC.
 */
export async function recordActivity(userId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.rpc('update_user_streak', { p_user_id: userId });
  } catch {
    // Non-critical — streak tracking is best-effort
  }
}

import { createAdminClient } from '@/lib/supabase/admin';

export type Tier = 'STREET' | 'PLAYER' | 'LEGEND';

export const TIER_THRESHOLDS: Record<Tier, { min: number; max: number | null; label: string }> = {
  STREET: { min: 0, max: 500, label: 'Street' },
  PLAYER: { min: 500, max: 5000, label: 'Playr' },
  LEGEND: { min: 5000, max: null, label: 'Legend' },
};

export function deriveTier(sprr: number): Tier {
  if (sprr >= 5000) return 'LEGEND';
  if (sprr >= 500) return 'PLAYER';
  return 'STREET';
}

export function getProgress(sprr: number): { tier: Tier; progress: number; next: Tier | null } {
  const tier = deriveTier(sprr);
  const threshold = TIER_THRESHOLDS[tier];
  const nextTier = tier === 'STREET' ? 'PLAYER' : tier === 'PLAYER' ? 'LEGEND' : null;
  if (!threshold.max) return { tier, progress: 1, next: null };
  return { tier, progress: Math.min(1, (sprr - threshold.min) / (threshold.max - threshold.min)), next: nextTier };
}

/**
 * Get the tier multiplier for reward calculations.
 * Adapted from Nectar's RewardEngine multiplier pattern.
 */
export function getTierMultiplier(tier: Tier): number {
  const multipliers: Record<Tier, number> = {
    STREET: 1.0,
    PLAYER: 1.25,
    LEGEND: 1.5,
  };
  return multipliers[tier] ?? 1.0;
}

/**
 * Get a human-readable streak tier label.
 */
export function getStreakLabel(days: number): string {
  if (days >= 30) return 'Unstoppable';
  if (days >= 14) return 'On Fire';
  if (days >= 7) return 'Consistent';
  if (days >= 3) return 'Building';
  if (days >= 1) return 'Getting Started';
  return 'Start Your Streak';
}

/**
 * Award XP to a user profile.
 */
export async function awardXP(userId: string, amount: number, _source: string): Promise<void> {
  if (amount <= 0) return;
  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('xp').eq('id', userId).single();
  const currentXp = profile?.xp ?? 0;
  await admin.from('profiles').update({ xp: currentXp + amount }).eq('id', userId);
}

/**
 * Award SPRR and log a wallet transaction.
 */
export async function awardSPRR(
  userId: string,
  amount: number,
  source: string,
  type: 'earned' | 'referral_bonus' | 'adjustment' = 'earned'
): Promise<void> {
  if (amount <= 0) return;
  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('sprr_balance').eq('id', userId).single();
  const currentSprr = profile?.sprr_balance ?? 0;
  await admin.from('profiles').update({ sprr_balance: currentSprr + amount }).eq('id', userId);
  await admin.from('wallet_transactions').insert({
    user_id: userId,
    type,
    delta: amount,
    source,
  });
}

/**
 * Get active bonus campaigns.
 */
export async function getActiveCampaigns() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('bonus_campaigns')
    .select('*')
    .eq('is_active', true)
    .lte('starts_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  return data ?? [];
}

/**
 * Claim a bonus campaign for a user (awards SPRR + XP).
 */
export async function claimBonus(userId: string, campaignId: string): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: campaign } = await admin.from('bonus_campaigns').select('*').eq('id', campaignId).single();
  if (!campaign) return { success: false, error: 'Campaign not found' };
  if (!campaign.is_active) return { success: false, error: 'Campaign is not active' };
  if (campaign.ends_at && new Date(campaign.ends_at) < new Date()) return { success: false, error: 'Campaign has ended' };

  if (campaign.sprr_reward > 0) {
    await awardSPRR(userId, campaign.sprr_reward, `Bonus: ${campaign.name}`, 'earned');
  }
  if (campaign.xp_reward > 0) {
    await awardXP(userId, campaign.xp_reward, `Bonus: ${campaign.name}`);
  }

  return { success: true };
}

/**
 * Process a referral: award the referrer when the referred user completes their first order.
 */
export async function processReferral(referredUserId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: claim } = await admin
    .from('referral_claims')
    .select('*')
    .eq('referred_id', referredUserId)
    .single();

  if (!claim || claim.status !== 'pending') return;

  const sprrBonus = 200;
  const xpBonus = 100;

  await awardSPRR(claim.referrer_id, sprrBonus, 'Referral bonus', 'referral_bonus');
  await awardXP(claim.referrer_id, xpBonus, 'Referral bonus');

  await admin.from('referral_claims').update({
    status: 'fulfilled',
    bonus_sprr: sprrBonus,
    bonus_xp: xpBonus,
    claimed_at: new Date().toISOString(),
  }).eq('id', claim.id);
}

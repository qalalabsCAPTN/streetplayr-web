import { createAdminClient } from '@/lib/supabase/admin';

export type Tier = 'ROOKIE' | 'PRO' | 'LEGEND' | 'CREATORS' | 'TALENT';

export const TIER_THRESHOLDS: Record<Tier, { min: number; max: number | null; label: string }> = {
  ROOKIE: { min: 1, max: 3, label: 'Rookie' },
  PRO: { min: 3, max: 5, label: 'Pro' },
  LEGEND: { min: 5, max: null, label: 'Legend' },
  CREATORS: { min: 999999, max: null, label: 'Creators' },
  TALENT: { min: 999999, max: null, label: 'Talent' },
};

export function deriveTier(purchaseCount: number): Tier {
  if (purchaseCount >= 5) return 'LEGEND';
  if (purchaseCount >= 3) return 'PRO';
  return 'ROOKIE';
}

export function getProgress(purchaseCount: number): { tier: Tier; progress: number; next: Tier | null } {
  const tier = deriveTier(purchaseCount);
  const threshold = TIER_THRESHOLDS[tier];
  const nextTier = tier === 'ROOKIE' ? 'PRO' : tier === 'PRO' ? 'LEGEND' : null;
  if (!threshold.max) return { tier, progress: 1, next: null };
  return { tier, progress: Math.min(1, Math.max(0, (purchaseCount - threshold.min) / (threshold.max - threshold.min))), next: nextTier };
}

/**
 * Get the tier multiplier for reward calculations.
 * Adapted from Nectar's RewardEngine multiplier pattern.
 */
export function getTierMultiplier(tier: Tier): number {
  const multipliers: Record<Tier, number> = {
    ROOKIE: 1.0,
    PRO: 1.0,
    LEGEND: 1.0,
    CREATORS: 1.0,
    TALENT: 1.0,
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
  type: 'earned' | 'referral_bonus' | 'adjustment' = 'earned',
  mirrorXp: boolean = true
): Promise<void> {
  if (amount <= 0) return;
  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('sprr_balance, xp').eq('id', userId).single();
  const currentSprr = profile?.sprr_balance ?? 0;
  
  // XP Mirroring Rule: 50% of Points earned are mirrored as XP
  const currentXp = profile?.xp ?? 0;
  const xpAmount = mirrorXp ? Math.floor(amount * 0.5) : 0;

  await admin.from('profiles').update({ 
    sprr_balance: currentSprr + amount,
    xp: currentXp + xpAmount 
  }).eq('id', userId);
  
  await admin.from('wallet_transactions').insert({
    user_id: userId,
    type,
    delta: amount,
    source,
  });
}

/**
 * Deduct member credits once per order. Idempotent on source string.
 */
export async function redeemSPRR(userId: string, amount: number, source: string): Promise<boolean> {
  if (amount <= 0) return true;
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('wallet_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('source', source)
    .eq('type', 'redemption')
    .maybeSingle();
  if (existing) return true;

  const { data: profile } = await admin.from('profiles').select('sprr_balance').eq('id', userId).single();
  const currentSprr = profile?.sprr_balance ?? 0;
  if (currentSprr < amount) return false;
  await admin.from('profiles').update({ sprr_balance: currentSprr - amount }).eq('id', userId);
  await admin.from('wallet_transactions').insert({
    user_id: userId,
    type: 'redemption',
    delta: -amount,
    source,
  });
  return true;
}

/**
 * Restore credits after cancelled/refunded payment. Idempotent on source string.
 */
export async function refundSPRR(userId: string, amount: number, source: string): Promise<void> {
  if (amount <= 0) return;
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('wallet_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('source', source)
    .maybeSingle();
  if (existing) return;
  await awardSPRR(userId, amount, source, 'adjustment', false);
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
 * Grant a welcome bonus to a new user.
 * Idempotent — checks welcome_bonus_granted before granting.
 * Adapted from NECTAR 2.0 ReferralService convertReferral welcome bonus pattern.
 */
export const WELCOME_BONUS_SPRR = 100;
export const WELCOME_BONUS_XP = 50;

export async function grantWelcomeBonus(userId: string): Promise<void> {
  const admin = createAdminClient();

  // Idempotency check — only grant once
  const { data: profile } = await admin
    .from('profiles')
    .select('welcome_bonus_granted, sprr_balance, xp')
    .eq('id', userId)
    .single();

  if (!profile || profile.welcome_bonus_granted) return;

  const newSprr = (profile.sprr_balance ?? 0) + WELCOME_BONUS_SPRR;
  const newXp = (profile.xp ?? 0) + WELCOME_BONUS_XP;

  // Atomic update: balance + flag in single query
  await admin.from('profiles').update({
    sprr_balance: newSprr,
    xp: newXp,
    welcome_bonus_granted: true,
  }).eq('id', userId);

  // Log wallet transaction
  try {
    await admin.from('wallet_transactions').insert({
      user_id: userId,
      type: 'earned',
      delta: WELCOME_BONUS_SPRR,
      source: 'welcome_bonus',
      description: 'Welcome bonus — thanks for joining StreetPlayR',
    });
  } catch (err) {
    console.error('[welcome_bonus] wallet_transactions insert failed:', err);
  }
}

/**
 * Grant a social signup bonus (e.g., via Google/Facebook OAuth).
 * Feature-gated and strictly idempotent per user lifetime.
 */
export async function grantSocialSignupBonus(userId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('wallet_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'social_signup')
    .maybeSingle();

  if (existing) return;

  const SOCIAL_SIGNUP_BONUS = 50;

  // Award the points. awardSPRR automatically handles XP mirroring (50% = 25 XP)
  await awardSPRR(userId, SOCIAL_SIGNUP_BONUS, 'social_signup', 'earned');
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

  const sprrBonus = 50;
  const xpBonus = 25;

  await awardSPRR(claim.referrer_id, sprrBonus, 'Referral bonus', 'referral_bonus');
  await awardXP(claim.referrer_id, xpBonus, 'Referral bonus');

  await admin.from('referral_claims').update({
    status: 'fulfilled',
    bonus_sprr: sprrBonus,
    bonus_xp: xpBonus,
    claimed_at: new Date().toISOString(),
  }).eq('id', claim.id);
}

/**
 * Manually assign a user to the CREATORS or TALENT tier.
 * This overrides standard purchase-count progression.
 * Passing 'NONE' reverts the user back to normal progression.
 */
export async function assignManualTier(
  adminUserId: string,
  targetUserId: string,
  tier: 'CREATORS' | 'TALENT' | 'NONE'
): Promise<void> {
  const admin = createAdminClient();
  
  // Security check: verify adminUserId is actually an admin
  const { data: adminProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', adminUserId)
    .single();

  if (!adminProfile || (adminProfile.role !== 'super_admin' && adminProfile.role !== 'ops_admin')) {
    throw new Error('Unauthorized: Only admins can manually assign tiers.');
  }

  // Idempotency check
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('tier')
    .eq('id', targetUserId)
    .single();

  const currentTier = targetProfile?.tier?.toUpperCase();
  const targetTier = tier === 'NONE' ? null : tier;
  
  if (currentTier === targetTier) return;
  if (tier === 'NONE' && currentTier !== 'CREATORS' && currentTier !== 'TALENT') return;

  // Reversible update
  await admin.from('profiles').update({ tier: targetTier }).eq('id', targetUserId);
  
  // Auditable
  try {
    await admin.from('operational_events').insert({
      domain: 'loyalty',
      action: 'tier.manual_override',
      actor_id: adminUserId,
      resource_type: 'profiles',
      resource_id: targetUserId,
      message: `Manually set tier to ${tier}`,
      metadata: { oldTier: currentTier, newTier: targetTier },
    });
  } catch (err) {
    console.warn('[tier.manual_override] failed to log operational event:', err);
  }
}

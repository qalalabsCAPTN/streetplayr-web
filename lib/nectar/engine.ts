import { createAdminClient } from '@/lib/supabase/admin';
import { debitNectarWallet, creditNectarWallet } from '@/lib/nectar/ledger-write';
import { syncSprrBalanceFromNectar } from '@/lib/nectar/balance';

export type Tier = 'ROOKIE' | 'PRO' | 'LEGEND' | 'CREATORS' | 'TALENT';

export const TIER_THRESHOLDS: Record<Tier, { min: number; max: number | null; label: string }> = {
  ROOKIE: { min: 1, max: 16, label: 'Rookie' },
  PRO: { min: 16, max: 31, label: 'Pro' },
  LEGEND: { min: 31, max: null, label: 'Legend' },
  CREATORS: { min: 999999, max: null, label: 'Creators' },
  TALENT: { min: 999999, max: null, label: 'Talent' },
};

export function deriveTier(purchaseCount: number): Tier {
  if (purchaseCount >= 31) return 'LEGEND';
  if (purchaseCount >= 16) return 'PRO';
  return 'ROOKIE';
}

const CONFIRMED_ORDER_STATUSES = ['confirmed', 'processing', 'fulfilling', 'shipped', 'delivered'] as const;

/**
 * Count paid orders for tier progression. Uses orders.notes (auth user id
 * set at checkout) first, then customers.email → customers.id linkage.
 */
export async function countConfirmedOrdersForUser(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string,
  email?: string | null
): Promise<number> {
  const { count: byNotes } = await admin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('notes', profileId)
    .in('status', [...CONFIRMED_ORDER_STATUSES]);

  if ((byNotes ?? 0) > 0) return byNotes ?? 0;

  if (!email) return 0;

  const { data: customer } = await admin
    .from('customers')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!customer?.id) return 0;

  const { count } = await admin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customer.id)
    .in('status', [...CONFIRMED_ORDER_STATUSES]);

  return count ?? 0;
}

/** Checkout tier: special creator/talent roles stick; everyone else derives from order count. */
export async function resolveMemberTier(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string,
  storedTier: string | null | undefined,
  email?: string | null
): Promise<Tier> {
  const tier = (storedTier as Tier) || 'ROOKIE';
  if (tier === 'CREATORS' || tier === 'TALENT') return tier;
  const purchaseCount = await countConfirmedOrdersForUser(admin, profileId, email);
  return deriveTier(purchaseCount);
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
  // Client requested dropping the XP concept and unifying everything as Points (SPRR).
  // This is now a no-op to prevent breaking existing API contracts in tests.
  return Promise.resolve();
}

/**
 * Award SPRR points to a user.
 */
export async function awardSPRR(
  userId: string,
  amount: number,
  source: string,
  type: 'earned' | 'referral_bonus' | 'adjustment' = 'earned',
  _mirrorXp: boolean = true // Kept for API compatibility, but unused
): Promise<void> {
  if (amount <= 0) return;
  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('sprr_balance').eq('id', userId).single();
  const currentSprr = profile?.sprr_balance ?? 0;

  await admin.from('profiles').update({ 
    sprr_balance: currentSprr + amount
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

  await syncSprrBalanceFromNectar(userId);

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

  const nectarDebit = await debitNectarWallet({
    userId,
    amount,
    idempotencyKey: `checkout:${source}`,
    source: 'checkout_redemption',
    referenceType: 'order',
    description: source,
  });
  if (!nectarDebit.ok && !nectarDebit.skipped) {
    console.warn('[nectar] checkout debit mirror failed after local redeem', {
      userId,
      amount,
      source,
      error: nectarDebit.error,
    });
  }

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

  await creditNectarWallet({
    userId,
    amount,
    idempotencyKey: `refund:${source}`,
    source: 'checkout_refund',
    referenceType: 'order',
    description: source,
  });

  await awardSPRR(userId, amount, source, 'adjustment', false);
  await syncSprrBalanceFromNectar(userId);
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

export async function grantWelcomeBonus(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('welcome_bonus_granted, sprr_balance')
    .eq('id', userId)
    .single();

  if (!profile || profile.welcome_bonus_granted) return;

  const newSprr = (profile.sprr_balance ?? 0) + WELCOME_BONUS_SPRR;

  // Atomic update: balance + flag in single query
  await admin.from('profiles').update({
    sprr_balance: newSprr,
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

  await awardSPRR(claim.referrer_id, sprrBonus, 'Referral bonus', 'referral_bonus');

  await admin.from('referral_claims').update({
    status: 'fulfilled',
    bonus_sprr: sprrBonus,
    bonus_xp: 0,
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

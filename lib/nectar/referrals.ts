import { createAdminClient } from '@/lib/supabase/admin';
import { awardSPRR, awardXP } from './engine';

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  status: string;
  bonusSprr: number;
  bonusXp: number;
  createdAt: string;
}

export interface ReferralEdge {
  referrerId: string;
  referredUserId: string;
  depth: number;
  createdAt: string;
}

/**
 * Generate a unique referral code for a user (uses existing profile.referral_code).
 */
export async function getOrGenerateCode(userId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();
    return data?.referral_code ?? null;
  } catch {
    return null;
  }
}

/**
 * Attribute a signup to a referral code.
 * Creates the referral claim and graph edge.
 * Self-referral guard included.
 */
export async function attributeSignup(
  referralCode: string,
  newUserId: string
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data: referrer } = await admin
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .single();

    if (!referrer) return false;
    if (referrer.id === newUserId) return false;

    // Check existing claim
    const { data: existing } = await admin
      .from('referral_claims')
      .select('id')
      .eq('referred_id', newUserId)
      .single();

    if (existing) return true;

    // Create claim
    const { data: claim } = await admin
      .from('referral_claims')
      .insert({
        referrer_id: referrer.id,
        referred_id: newUserId,
        bonus_sprr: 0,
        bonus_xp: 0,
        status: 'pending',
      })
      .select('id')
      .single();

    if (claim) {
      // Write graph edge
      await admin.from('referral_edges').insert({
        referrer_id: referrer.id,
        referred_user_id: newUserId,
        depth: 1,
        referral_id: claim.id,
      });
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get referral stats for a user.
 */
export async function getReferralStats(userId: string): Promise<{
  total: number;
  converted: number;
  pending: number;
  earnedSprr: number;
}> {
  try {
    const admin = createAdminClient();
    const { data: claims } = await admin
      .from('referral_claims')
      .select('status, bonus_sprr')
      .eq('referrer_id', userId);

    const all = claims ?? [];
    return {
      total: all.length,
      converted: all.filter((c: any) => c.status === 'fulfilled').length,
      pending: all.filter((c: any) => c.status === 'pending').length,
      earnedSprr: all.reduce((s: number, c: any) => s + (c.bonus_sprr ?? 0), 0),
    };
  } catch {
    return { total: 0, converted: 0, pending: 0, earnedSprr: 0 };
  }
}

/**
 * Get referral edges (who the user referred).
 */
export async function getReferralEdges(userId: string): Promise<ReferralEdge[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('referral_edges')
      .select('referrer_id, referred_user_id, depth, created_at')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    return (data ?? []).map((r: any) => ({
      referrerId: r.referrer_id,
      referredUserId: r.referred_user_id,
      depth: r.depth,
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

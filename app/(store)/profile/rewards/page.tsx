/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { deriveTier, TIER_THRESHOLDS, getActiveCampaigns, getStreakLabel, getTierMultiplier } from '@/lib/nectar/engine';
import { getProgression } from '@/lib/nectar/progression';
import { getReferralStats } from '@/lib/nectar/referrals';
import { ReferralShare } from '@/components/profile/ReferralShare';

function formatNumber(n: number): string {
  return n.toLocaleString('en-IN');
}

export default async function RewardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('sprr_balance, xp, referral_code, referred_by, current_streak_days, longest_streak_days')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  const sprr = profile.sprr_balance ?? 0;
  const xp = profile.xp ?? 0;
  const streakDays = profile.current_streak_days ?? 0;
  const tier = deriveTier(sprr);
  const threshold = TIER_THRESHOLDS[tier];
  const nextTier = tier === 'STREET' ? 'PLAYER' : tier === 'PLAYER' ? 'LEGEND' : null;
  const progress = threshold.max ? Math.min(1, (sprr - threshold.min) / (threshold.max - threshold.min)) : 1;
  const multiplier = getTierMultiplier(tier);

  const [campaigns, redemptionsResult, referralStats] = await Promise.all([
    getActiveCampaigns(),
    admin.from('reward_redemptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    getReferralStats(user.id),
  ]);

  const { data: referrals } = await admin
    .from('referral_claims')
    .select('*')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const redemptions = redemptionsResult.data ?? [];

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-3xl font-display uppercase tracking-tight">NECTAR Rewards</h1>
        <p className="mt-2 text-sm text-white/60">Your loyalty progression and rewards</p>
      </section>

      {/* Tier + Wallet + XP cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 border border-white/10 bg-white/[0.02]">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Tier</div>
          <div className="text-4xl font-display text-white">{threshold.label}</div>
          <div className="text-[10px] font-mono text-white/30 mt-1">x{multiplier} reward multiplier</div>
          {nextTier && (
            <div className="mt-4">
              <div className="h-1 w-full bg-white/10">
                <div className="h-full bg-white/40 transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className="mt-1 text-[10px] font-mono text-white/40">
                {formatNumber(sprr - threshold.min)} / {formatNumber(threshold.max! - threshold.min)} to {TIER_THRESHOLDS[nextTier].label}
              </p>
            </div>
          )}
        </div>

        <div className="p-8 border border-white/10 bg-white/[0.02]">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">SP-RR Balance</div>
          <div className="text-4xl font-display text-white">{formatNumber(sprr)}</div>
          <p className="mt-2 text-[10px] font-mono text-white/40">Spendable loyalty points</p>
        </div>

        <div className="p-8 border border-white/10 bg-white/[0.02]">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">XP</div>
          <div className="text-4xl font-display text-white">{formatNumber(xp)}</div>
          <p className="mt-2 text-[10px] font-mono text-white/40">Experience points earned</p>
        </div>
      </section>

      {/* Streak card */}
      <section className="p-8 border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Activity Streak</div>
            <div className="text-4xl font-display text-white">{streakDays} days</div>
            <p className="mt-1 text-xs text-white/50">{getStreakLabel(streakDays)}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Best</div>
            <div className="text-2xl font-display text-white">{profile.longest_streak_days ?? 0}d</div>
          </div>
        </div>
      </section>

      {/* Referral */}
      {profile.referral_code && (
        <ReferralShare code={profile.referral_code} referralCount={referralStats.converted} />
      )}

      {/* Referral Stats */}
      {referralStats.total > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-white/10 bg-white/[0.02]">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Total Referrals</div>
            <div className="text-3xl font-display text-white mt-2">{referralStats.total}</div>
          </div>
          <div className="p-6 border border-white/10 bg-white/[0.02]">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Converted</div>
            <div className="text-3xl font-display text-white mt-2">{referralStats.converted}</div>
          </div>
          <div className="p-6 border border-white/10 bg-white/[0.02]">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">SP-RR Earned</div>
            <div className="text-3xl font-display text-white mt-2">{formatNumber(referralStats.earnedSprr)}</div>
          </div>
        </section>
      )}

      {/* Active campaigns */}
      {campaigns.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-display uppercase tracking-tight">Active Bonus Campaigns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((c: any) => (
              <div key={c.id} className="p-6 border border-white/10 bg-white/[0.02]">
                <h3 className="text-base font-display text-white uppercase">{c.name}</h3>
                {c.description && <p className="mt-1 text-xs text-white/50">{c.description}</p>}
                <div className="mt-4 flex gap-4 text-[10px] font-mono">
                  {c.sprr_reward > 0 && <span className="text-white/80">+{formatNumber(c.sprr_reward)} SP-RR</span>}
                  {c.xp_reward > 0 && <span className="text-white/60">+{formatNumber(c.xp_reward)} XP</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Redemption history */}
      {redemptions.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-display uppercase tracking-tight">Redemption History</h2>
          <div className="space-y-3">
            {redemptions.map((r: any) => (
              <div key={r.id} className="flex justify-between items-center p-4 border border-white/10 bg-white/[0.02]">
                <div>
                  <div className="text-sm text-white">{r.description}</div>
                  <div className="text-[10px] font-mono text-white/40">{r.status}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-white/60">-{formatNumber(r.sprr_cost)} SP</div>
                  <div className="text-[10px] font-mono text-white/40">
                    {new Date(r.redeemed_at ?? r.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

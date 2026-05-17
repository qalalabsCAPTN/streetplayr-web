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
    <div className="max-w-[1200px]">
      {/* ═══ HEADER ═══ */}
      <header className="mb-10 border-l-4 border-[#ddb7ff] pl-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff] block mb-2">
          [ REWARDS // OPERATIONS ]
        </span>
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-tight text-[#eadfed] leading-none">
          Rewards Center
        </h1>
      </header>

      {/* ═══ BENTO GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-10">
        {/* Tier card (4 cols) */}
        <div className="lg:col-span-4 bg-[#1f1a23] border border-white/[0.06] p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-[0.04] pointer-events-none">
            <span className="font-display text-[80px] text-white leading-none">{threshold.label[0]}</span>
          </div>
          <div className="relative z-10">
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 block mb-2">Tier</span>
            <h2 className="font-display text-4xl uppercase text-[#eadfed] mb-1">{threshold.label}</h2>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">x{multiplier} reward multiplier</p>
            {nextTier && (
              <div className="mt-4">
                <div className="w-full h-1.5 bg-white/[0.06] mb-2">
                  <div className="h-full bg-[#ddb7ff] transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
                <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/25">
                  {formatNumber(sprr - threshold.min)} / {formatNumber(threshold.max! - threshold.min)} to {TIER_THRESHOLDS[nextTier].label}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SP-RR card (4 cols) */}
        <div className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6 md:p-8">
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 block mb-2">SP-RR Balance</span>
          <h2 className="font-display text-4xl uppercase text-[#eadfed]">{formatNumber(sprr)}</h2>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 mt-2">Spendable loyalty points</p>
        </div>

        {/* XP card (4 cols) */}
        <div className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6 md:p-8">
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 block mb-2">Experience Points</span>
          <h2 className="font-display text-4xl uppercase text-[#eadfed]">{formatNumber(xp)}</h2>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 mt-2">Total XP earned</p>
        </div>

        {/* Streak card (12 cols) */}
        <div className="lg:col-span-12 bg-[#1f1a23] border border-white/[0.06] p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 block mb-2">Activity Streak</span>
              <div className="flex items-baseline gap-3">
                <h2 className="font-display text-4xl uppercase text-[#eadfed]">{streakDays} days</h2>
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">{getStreakLabel(streakDays)}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 block mb-1">Best</span>
              <span className="font-display text-3xl uppercase text-[#eadfed]">{profile.longest_streak_days ?? 0}d</span>
            </div>
          </div>
        </div>

        {/* Referral section */}
        {profile.referral_code && (
          <div className="lg:col-span-12">
            <ReferralShare code={profile.referral_code} referralCount={referralStats.converted} />
          </div>
        )}

        {/* Referral stats */}
        {referralStats.total > 0 && (
          <>
            <div className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25">Total Referrals</span>
              <p className="font-display text-3xl uppercase text-[#eadfed] mt-2">{referralStats.total}</p>
            </div>
            <div className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25">Converted</span>
              <p className="font-display text-3xl uppercase text-[#eadfed] mt-2">{referralStats.converted}</p>
            </div>
            <div className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25">SP-RR Earned</span>
              <p className="font-display text-3xl uppercase text-[#eadfed] mt-2">{formatNumber(referralStats.earnedSprr)}</p>
            </div>
          </>
        )}
      </div>

      {/* ═══ ACTIVE CAMPAIGNS ═══ */}
      {campaigns.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.05]">
            <h2 className="font-display text-3xl uppercase text-[#ddb7ff]">Active Campaigns</h2>
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20">{campaigns.length} ACTIVE</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((c: any) => (
              <div key={c.id} className="bg-[#1f1a23] border border-white/[0.06] p-6 hover:border-[#ddb7ff]/30 transition-colors">
                <h3 className="font-display text-xl uppercase text-[#eadfed]">{c.name}</h3>
                {c.description && <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 mt-2">{c.description}</p>}
                <div className="flex gap-4 mt-4">
                  {c.sprr_reward > 0 && <span className="font-mono text-[9px] text-[#ddb7ff]">+{formatNumber(c.sprr_reward)} SP-RR</span>}
                  {c.xp_reward > 0 && <span className="font-mono text-[9px] text-white/40">+{formatNumber(c.xp_reward)} XP</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ REDEMPTION HISTORY ═══ */}
      {redemptions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.05]">
            <h2 className="font-display text-3xl uppercase text-[#ddb7ff]">Redemption History</h2>
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20">ARCHIVE</span>
          </div>
          <div className="space-y-3">
            {redemptions.map((r: any) => (
              <div key={r.id} className="flex justify-between items-center p-4 bg-[#1f1a23] border border-white/[0.06] hover:border-white/[0.1] transition-colors">
                <div>
                  <p className="font-mono text-xs text-white/70">{r.description}</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 mt-1">
                    {r.status} · {new Date(r.redeemed_at ?? r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right font-mono text-[10px] text-[#ddb7ff]">
                  -{formatNumber(r.sprr_cost)} SP-RR
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

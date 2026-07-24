/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { deriveTier, TIER_THRESHOLDS, getActiveCampaigns, getStreakLabel, getTierMultiplier } from '@/lib/nectar/engine';
import { getReferralStats } from '@/lib/nectar/referrals';
import { ReferralShare } from '@/components/profile/ReferralShare';
import { RedeemButton } from '@/components/profile/RedeemButton';

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

  const redemptions = redemptionsResult.data ?? [];

  return (
    <div>
      <div className="acct-hero">
        <p className="acct-hero__greet">Loyalty</p>
        <h1 className="acct-hero__name">Rewards</h1>
      </div>

      <div className="acct-grid">
        <div className="acct-card">
          <span className="acct-card__eyebrow">Tier</span>
          <h2 className="acct-card__head-title">{threshold.label}</h2>
          <p className="acct-card__sub">x{multiplier} reward multiplier</p>
          {nextTier && (
            <div className="acct-progress" style={{ marginTop: 14, paddingBottom: 0, border: 0 }}>
              <div className="acct-progress__track">
                <div className="acct-progress__fill" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className="acct-card__sub" style={{ marginTop: 8 }}>
                {formatNumber(sprr - threshold.min)} / {formatNumber(threshold.max! - threshold.min)} to {TIER_THRESHOLDS[nextTier].label}
              </p>
            </div>
          )}
        </div>

        <div className="acct-card">
          <span className="acct-card__eyebrow">SP-RR Balance</span>
          <h2 className="acct-card__head-title">{formatNumber(sprr)}</h2>
          <p className="acct-card__sub">Spendable loyalty points</p>
        </div>

        <div className="acct-card">
          <span className="acct-card__eyebrow">Experience Points</span>
          <h2 className="acct-card__head-title">{formatNumber(xp)}</h2>
          <p className="acct-card__sub">Total XP earned</p>
        </div>

        <div className="acct-card acct-card--wide">
          <div className="acct-card__head">
            <div>
              <span className="acct-card__eyebrow">Activity streak</span>
              <h2 className="acct-card__head-title">{streakDays} days <small className="acct-card__sub">{getStreakLabel(streakDays)}</small></h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="acct-card__eyebrow">Best</span>
              <h3 className="acct-card__head-title">{profile.longest_streak_days ?? 0}d</h3>
            </div>
          </div>
        </div>

        {profile.referral_code && (
          <div className="acct-card--wide" style={{ gridColumn: '1 / -1' }}>
            <ReferralShare code={profile.referral_code} referralCount={referralStats.converted} />
          </div>
        )}

        {referralStats.total > 0 && (
          <>
            <div className="acct-card">
              <span className="acct-card__eyebrow">Total referrals</span>
              <h2 className="acct-card__head-title">{referralStats.total}</h2>
            </div>
            <div className="acct-card">
              <span className="acct-card__eyebrow">Converted</span>
              <h2 className="acct-card__head-title">{referralStats.converted}</h2>
            </div>
            <div className="acct-card">
              <span className="acct-card__eyebrow">SP-RR earned</span>
              <h2 className="acct-card__head-title">{formatNumber(referralStats.earnedSprr)}</h2>
            </div>
          </>
        )}
      </div>

      {campaigns.length > 0 && (
        <>
          <div className="acct-section-head">
            <h2>Active Campaigns ({campaigns.length})</h2>
          </div>
          <div className="acct-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {campaigns.map((c: any) => (
              <div key={c.id} className="acct-card">
                <h3 className="acct-campaign__title">{c.name}</h3>
                {c.description && <p className="acct-card__sub" style={{ marginTop: 6 }}>{c.description}</p>}
                <div className="acct-campaign__rewards">
                  {c.sprr_reward > 0 && <span>+{formatNumber(c.sprr_reward)} SP-RR</span>}
                  {c.xp_reward > 0 && <span className="muted">+{formatNumber(c.xp_reward)} XP</span>}
                </div>
                {c.sprr_reward > 0 && (
                  <RedeemButton
                    currentBalance={sprr}
                    campaignName={c.name}
                    campaignId={c.id}
                    sprrCost={c.sprr_reward}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {redemptions.length > 0 && (
        <>
          <div className="acct-section-head">
            <h2>Redemption History</h2>
          </div>
          <div className="acct-txlog">
            {redemptions.map((r: any) => (
              <div key={r.id} className="acct-txrow">
                <div className="acct-txrow__info">
                  <p>{r.description}</p>
                  <span>{r.status} · {new Date(r.redeemed_at ?? r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="acct-txrow__amount negative">
                  <span>-{formatNumber(r.sprr_cost)} SP-RR</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

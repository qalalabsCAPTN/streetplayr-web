// Redemption logic

function nonNegativeInt(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

export const MEMBER_CREDIT_MAX_RATIO = {
  ROOKIE: 0.05,
  PRO: 0.075,
  LEGEND: 0.10,
  CREATORS: 0.10,
  TALENT: 0.10
};

export type MemberCreditTier = keyof typeof MEMBER_CREDIT_MAX_RATIO;

export function memberCreditCapRatio(tier: MemberCreditTier = 'ROOKIE'): number {
  return MEMBER_CREDIT_MAX_RATIO[tier] ?? 0.05;
}

/** Human-readable cap label for checkout UI, e.g. "5%", "7.5%", "10%". */
export function formatMemberCreditCap(tier: MemberCreditTier = 'ROOKIE'): string {
  const pct = memberCreditCapRatio(tier) * 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct}%`;
}

export function maxRedeemableCredits(balance: number, subtotal: number, tier: MemberCreditTier = 'ROOKIE'): number {
  const credits = nonNegativeInt(balance);
  const total = nonNegativeInt(subtotal);
  const cap = Math.floor(total * memberCreditCapRatio(tier));
  return Math.min(credits, cap, total);
}

export function payableAfterCredits(subtotal: number, creditsApplied: number): number {
  const total = nonNegativeInt(subtotal);
  const applied = nonNegativeInt(creditsApplied);
  return Math.max(0, total - applied);
}

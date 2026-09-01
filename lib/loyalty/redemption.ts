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

export function maxRedeemableCredits(balance: number, subtotal: number, tier: 'ROOKIE' | 'PRO' | 'LEGEND' | 'CREATORS' | 'TALENT' = 'ROOKIE'): number {
  const credits = nonNegativeInt(balance);
  const total = nonNegativeInt(subtotal);
  const ratio = MEMBER_CREDIT_MAX_RATIO[tier] ?? 0.05;
  const cap = Math.floor(total * ratio);
  return Math.min(credits, cap, total);
}

export function payableAfterCredits(subtotal: number, creditsApplied: number): number {
  const total = nonNegativeInt(subtotal);
  const applied = nonNegativeInt(creditsApplied);
  return Math.max(0, total - applied);
}

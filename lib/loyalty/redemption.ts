export const MEMBER_CREDIT_MAX_RATIO = 0.5;

function nonNegativeInt(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

/** 1 member credit = ₹1. Max redeemable is min(balance, floor(subtotal * 0.5), subtotal). */
export function maxRedeemableCredits(balance: number, subtotal: number): number {
  const credits = nonNegativeInt(balance);
  const total = nonNegativeInt(subtotal);
  const half = Math.floor(total * MEMBER_CREDIT_MAX_RATIO);
  return Math.min(credits, half, total);
}

export function payableAfterCredits(subtotal: number, creditsApplied: number): number {
  const total = nonNegativeInt(subtotal);
  const applied = nonNegativeInt(creditsApplied);
  return Math.max(0, total - applied);
}

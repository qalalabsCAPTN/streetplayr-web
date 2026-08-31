export const MEMBER_CREDIT_MAX_RATIO = 0.1;

function nonNegativeInt(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

/** 1 member credit = ₹1. Max redeemable is min(balance, floor(subtotal * 0.1), subtotal). */
export function maxRedeemableCredits(balance: number, subtotal: number): number {
  const credits = nonNegativeInt(balance);
  const total = nonNegativeInt(subtotal);
  const cap = Math.floor(total * MEMBER_CREDIT_MAX_RATIO);
  return Math.min(credits, cap, total);
}

export function payableAfterCredits(subtotal: number, creditsApplied: number): number {
  const total = nonNegativeInt(subtotal);
  const applied = nonNegativeInt(creditsApplied);
  return Math.max(0, total - applied);
}

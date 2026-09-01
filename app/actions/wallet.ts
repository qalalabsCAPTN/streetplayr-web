'use server';

import { createClient } from '@/lib/supabase/server';
import { resolveCheckoutBalance } from '@/lib/nectar/balance';
import type { CheckoutBalanceResult } from '@/lib/nectar/balance';

/**
 * Sync member wallet from Nectar before checkout / profile display.
 */
export async function syncMemberWalletAction(): Promise<CheckoutBalanceResult | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return resolveCheckoutBalance(user.id);
}

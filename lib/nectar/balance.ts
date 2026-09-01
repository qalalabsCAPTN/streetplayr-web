/**
 * Nectar ↔ StreetPlayR wallet sync for checkout spend.
 *
 * Nectar `wallet_balances` is the earn-side source of truth.
 * `profiles.sprr_balance` is the spend cache used at checkout.
 * `redeemSPRR` / `refundSPRR` keep both in sync via ledger-write.ts.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { recordEvent } from '@/lib/orchestration/events';
import { getWalletBalance } from '@/lib/nectar/service';

/** Wallet types tried in order when resolving spendable balance. */
export const CHECKOUT_WALLET_TYPES = ['points', 'credits'] as const;

export type CheckoutWalletType = (typeof CHECKOUT_WALLET_TYPES)[number];

export interface CheckoutBalanceResult {
  balance: number;
  source: 'nectar' | 'local';
  nectarAvailable: number | null;
  walletType: CheckoutWalletType | null;
  synced: boolean;
}

export async function readNectarSpendableBalance(
  userId: string
): Promise<{ available: number; walletType: CheckoutWalletType } | null> {
  for (const walletType of CHECKOUT_WALLET_TYPES) {
    const bal = await getWalletBalance(userId, walletType);
    if (bal) {
      return {
        available: Math.max(0, Math.floor(bal.available)),
        walletType,
      };
    }
  }
  return null;
}

export async function getLocalSprrBalance(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('sprr_balance')
    .eq('id', userId)
    .maybeSingle();
  return typeof data?.sprr_balance === 'number' ? Math.max(0, Math.floor(data.sprr_balance)) : 0;
}

async function setLocalSprrBalance(userId: string, balance: number): Promise<void> {
  const admin = createAdminClient();
  await admin.from('profiles').update({ sprr_balance: balance }).eq('id', userId);
}

/**
 * Pull Nectar available balance into profiles.sprr_balance when a wallet exists.
 * No-op when the user has no Nectar wallet (legacy local-only balance).
 */
export async function syncSprrBalanceFromNectar(userId: string): Promise<CheckoutBalanceResult> {
  const nectar = await readNectarSpendableBalance(userId);
  if (!nectar) {
    const local = await getLocalSprrBalance(userId);
    return {
      balance: local,
      source: 'local',
      nectarAvailable: null,
      walletType: null,
      synced: false,
    };
  }

  const local = await getLocalSprrBalance(userId);
  if (local !== nectar.available) {
    await setLocalSprrBalance(userId, nectar.available);
    await recordEvent({
      domain: 'system',
      severity: 'info',
      action: 'nectar.balance_synced',
      actorId: 'system',
      resourceType: 'profiles',
      resourceId: userId,
      message: `Synced sprr_balance ${local} → ${nectar.available} from Nectar ${nectar.walletType} wallet`,
      metadata: {
        userId,
        previousBalance: local,
        nectarAvailable: nectar.available,
        walletType: nectar.walletType,
      },
    });
  }

  return {
    balance: nectar.available,
    source: 'nectar',
    nectarAvailable: nectar.available,
    walletType: nectar.walletType,
    synced: true,
  };
}

/**
 * Authoritative spendable balance for checkout — syncs from Nectar first.
 */
export async function resolveCheckoutBalance(userId: string): Promise<CheckoutBalanceResult> {
  return syncSprrBalanceFromNectar(userId);
}

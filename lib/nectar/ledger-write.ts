/**
 * Server-side Nectar ledger writes for checkout spend mirroring.
 *
 * Earn-side credits stay on Nectar's RewardEngine (purchase.completed).
 * Checkout redemptions debit both local sprr_balance (redeemSPRR) and
 * the Nectar ledger here so balances stay aligned.
 */
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordEvent } from '@/lib/orchestration/events';
import { CHECKOUT_WALLET_TYPES, type CheckoutWalletType } from '@/lib/nectar/balance';
import { getWalletBalance } from '@/lib/nectar/service';

export interface LedgerWriteResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

async function findWalletAccount(
  userId: string
): Promise<{ walletId: string; walletType: CheckoutWalletType } | null> {
  const admin = createAdminClient();
  for (const walletType of CHECKOUT_WALLET_TYPES) {
    const { data } = await admin
      .from('wallet_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('wallet_type', walletType)
      .maybeSingle();
    if (data?.id) return { walletId: data.id, walletType };
  }
  return null;
}

async function ledgerTxExists(idempotencyKey: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('nectar_wallet_transactions')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Debit Nectar wallet for checkout credit spend. Idempotent on idempotencyKey.
 * Never throws — mirrors emitEvent() delivery semantics.
 */
export async function debitNectarWallet(params: {
  userId: string;
  amount: number;
  idempotencyKey: string;
  source: string;
  referenceId?: string;
  referenceType?: string;
  description?: string;
}): Promise<LedgerWriteResult> {
  const amount = Math.floor(params.amount);
  if (amount <= 0) return { ok: true, skipped: true };

  try {
    if (await ledgerTxExists(params.idempotencyKey)) {
      return { ok: true, skipped: true };
    }

    const wallet = await findWalletAccount(params.userId);
    if (!wallet) {
      return { ok: false, skipped: true, error: 'no_nectar_wallet' };
    }

    const nectarBal = await getWalletBalance(params.userId, wallet.walletType);
    const balanceAfter = Math.max(0, (nectarBal?.available ?? 0) - amount);

    const admin = createAdminClient();
    const { error } = await admin.from('nectar_wallet_transactions').insert({
      id: randomUUID(),
      wallet_id: wallet.walletId,
      user_id: params.userId,
      type: 'debit',
      status: 'confirmed',
      source: params.source,
      amount,
      balance_after: balanceAfter,
      idempotency_key: params.idempotencyKey,
      reference_id: params.referenceId ?? null,
      reference_type: params.referenceType ?? 'checkout',
      description: params.description ?? params.source,
    });

    if (error) {
      if (/duplicate|unique/i.test(error.message)) {
        return { ok: true, skipped: true };
      }
      await recordEvent({
        domain: 'system',
        severity: 'error',
        action: 'nectar.debit_failed',
        actorId: 'system',
        resourceType: 'profiles',
        resourceId: params.userId,
        message: `Nectar ledger debit failed: ${error.message}`,
        metadata: { ...params, amount },
      });
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

/**
 * Credit Nectar wallet (e.g. checkout credit refund). Idempotent on idempotencyKey.
 */
export async function creditNectarWallet(params: {
  userId: string;
  amount: number;
  idempotencyKey: string;
  source: string;
  referenceId?: string;
  referenceType?: string;
  description?: string;
}): Promise<LedgerWriteResult> {
  const amount = Math.floor(params.amount);
  if (amount <= 0) return { ok: true, skipped: true };

  try {
    if (await ledgerTxExists(params.idempotencyKey)) {
      return { ok: true, skipped: true };
    }

    const wallet = await findWalletAccount(params.userId);
    if (!wallet) {
      return { ok: false, skipped: true, error: 'no_nectar_wallet' };
    }

    const nectarBal = await getWalletBalance(params.userId, wallet.walletType);
    const balanceAfter = (nectarBal?.available ?? 0) + amount;

    const admin = createAdminClient();
    const { error } = await admin.from('nectar_wallet_transactions').insert({
      id: randomUUID(),
      wallet_id: wallet.walletId,
      user_id: params.userId,
      type: 'credit',
      status: 'confirmed',
      source: params.source,
      amount,
      balance_after: balanceAfter,
      idempotency_key: params.idempotencyKey,
      reference_id: params.referenceId ?? null,
      reference_type: params.referenceType ?? 'checkout_refund',
      description: params.description ?? params.source,
    });

    if (error) {
      if (/duplicate|unique/i.test(error.message)) {
        return { ok: true, skipped: true };
      }
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

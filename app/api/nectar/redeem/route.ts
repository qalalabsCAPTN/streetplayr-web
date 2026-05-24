import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/nectar/redeem
 *
 * Body: { description: string, sprrCost: number }
 *
 * Flow (adapted from NECTAR 2.0 LedgerRepository pattern):
 *   1. Authenticate user
 *   2. Validate input
 *   3. Read current balance
 *   4. Check sufficient funds
 *   5. Atomically: deduct sprr_balance + insert redemption row + log wallet_transaction
 *   6. Return new balance + redemption id
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse + validate body
    const body = await req.json().catch(() => null);
    if (!body || typeof body.sprrCost !== 'number' || typeof body.description !== 'string') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { description, sprrCost } = body as { description: string; sprrCost: number };

    if (sprrCost <= 0 || !Number.isInteger(sprrCost)) {
      return NextResponse.json({ error: 'sprrCost must be a positive integer' }, { status: 400 });
    }
    if (!description.trim()) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 });
    }

    // Use admin client for atomic balance operations (bypass RLS read/write)
    const admin = createAdminClient();

    // 3. Read current balance
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('sprr_balance')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const currentBalance = profile.sprr_balance ?? 0;

    // 4. Check sufficient funds (mirrors NECTAR 2.0 InsufficientBalanceError pattern)
    if (currentBalance < sprrCost) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          available: currentBalance,
          requested: sprrCost,
        },
        { status: 422 }
      );
    }

    const newBalance = currentBalance - sprrCost;

    // 5a. Deduct balance atomically
    const { error: updateErr } = await admin
      .from('profiles')
      .update({ sprr_balance: newBalance })
      .eq('id', user.id);

    if (updateErr) {
      console.error('[redeem] Balance update failed:', updateErr);
      return NextResponse.json({ error: 'Balance update failed' }, { status: 500 });
    }

    // 5b. Insert redemption record
    const { data: redemption, error: redemptionErr } = await admin
      .from('reward_redemptions')
      .insert({
        user_id: user.id,
        description: description.trim(),
        sprr_cost: sprrCost,
        status: 'pending',
        redeemed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (redemptionErr || !redemption) {
      // Rollback balance on redemption write failure
      await admin.from('profiles').update({ sprr_balance: currentBalance }).eq('id', user.id);
      console.error('[redeem] Redemption insert failed:', redemptionErr);
      return NextResponse.json({ error: 'Redemption failed' }, { status: 500 });
    }

    // 5c. Log wallet transaction (debit) — append-only ledger entry
    try {
      await admin.from('wallet_transactions').insert({
        user_id: user.id,
        type: 'redemption',
        delta: -sprrCost,
        source: 'redemption',
      });
    } catch (err) {
      // Non-fatal: transaction log failure shouldn't roll back the redemption
      console.error('[redeem] Wallet transaction log failed:', err);
    }

    // 6. Return result
    return NextResponse.json({
      success: true,
      redemptionId: redemption.id,
      newBalance,
      deducted: sprrCost,
    });
  } catch (err) {
    console.error('[redeem] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

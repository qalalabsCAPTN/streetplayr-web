import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isApiError, requireOpsApi } from '@/lib/auth/api-guard';

/**
 * POST /api/admin/nectar/fulfill/[id]
 * Marks a reward_redemption as fulfilled (admin only).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOpsApi(['super_admin', 'ops_admin']);
  if (isApiError(auth)) return auth;

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from('reward_redemptions')
    .update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending');

  if (error) {
    console.error('[fulfill] Update failed:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

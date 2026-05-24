import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'ops'].includes(profile.role ?? '')) return null;
  return user;
}

/**
 * GET /api/admin/nectar/campaigns
 * Returns all bonus_campaigns ordered by created_at desc
 */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('bonus_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [] });
}

/**
 * POST /api/admin/nectar/campaigns
 * Create a new bonus campaign
 */
export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('bonus_campaigns')
    .insert({
      name: body.name,
      description: body.description ?? null,
      sprr_reward: body.sprrReward ?? 0,
      xp_reward: body.xpReward ?? 0,
      is_active: body.isActive ?? false,
      starts_at: body.startsAt ?? null,
      ends_at: body.endsAt ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}

/**
 * PATCH /api/admin/nectar/campaigns
 * Update a campaign (activate/pause/edit)
 * Body: { id, ...fields }
 */
export async function PATCH(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { id, ...rest } = body;
  const updates: Record<string, unknown> = {};
  if (rest.name !== undefined) updates.name = rest.name;
  if (rest.description !== undefined) updates.description = rest.description;
  if (rest.sprrReward !== undefined) updates.sprr_reward = rest.sprrReward;
  if (rest.xpReward !== undefined) updates.xp_reward = rest.xpReward;
  if (rest.isActive !== undefined) updates.is_active = rest.isActive;
  if (rest.startsAt !== undefined) updates.starts_at = rest.startsAt;
  if (rest.endsAt !== undefined) updates.ends_at = rest.endsAt;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('bonus_campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}

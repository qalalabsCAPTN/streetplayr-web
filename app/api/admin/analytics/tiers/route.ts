import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deriveTier } from '@/lib/nectar/engine';

/**
 * GET /api/admin/analytics/tiers
 * Returns real tier distribution counts from profiles.sprr_balance
 */
export async function GET() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('profiles')
    .select('sprr_balance')
    .not('sprr_balance', 'is', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts: Record<string, number> = {
    LEGEND: 0,
    PLAYER: 0,
    STREET: 0,
  };

  for (const profile of data ?? []) {
    const tier = deriveTier(profile.sprr_balance ?? 0);
    counts[tier] = (counts[tier] ?? 0) + 1;
  }

  const total = Object.values(counts).reduce((s, v) => s + v, 0);

  return NextResponse.json({
    tiers: [
      { tier: 'Legend', key: 'LEGEND', count: counts.LEGEND, color: '#C026D3' },
      { tier: 'Playr',  key: 'PLAYER', count: counts.PLAYER, color: '#F5A800' },
      { tier: 'Street', key: 'STREET', count: counts.STREET, color: '#34D399' },
    ],
    total,
  });
}

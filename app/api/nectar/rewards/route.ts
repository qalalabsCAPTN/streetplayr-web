import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ campaigns: [], redemptions: [] });

    const [campaignsRes, redemptionsRes] = await Promise.all([
      supabase.from('bonus_campaigns').select('*').eq('is_active', true).limit(50),
      supabase.from('reward_redemptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);

    return NextResponse.json({
      campaigns: campaignsRes.data ?? [],
      redemptions: redemptionsRes.data ?? [],
    });
  } catch {
    return NextResponse.json({ campaigns: [], redemptions: [] });
  }
}

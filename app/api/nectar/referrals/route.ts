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
    if (!user) return NextResponse.json({ stats: null, code: '' });

    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    const code = profile?.referral_code ?? '';

    const { data: claims } = await supabase
      .from('referral_claims')
      .select('*')
      .eq('referrer_id', user.id);

    const stats = {
      total: claims?.length ?? 0,
      converted: claims?.filter((c: any) => c.status === 'claimed' || c.status === 'fulfilled').length ?? 0,
      pending: claims?.filter((c: any) => c.status === 'pending').length ?? 0,
      earnedSprr: claims?.reduce((s: number, c: any) => s + (c.bonus_sprr ?? 0), 0) ?? 0,
    };

    return NextResponse.json({ stats, code });
  } catch {
    return NextResponse.json({ stats: null, code: '' });
  }
}

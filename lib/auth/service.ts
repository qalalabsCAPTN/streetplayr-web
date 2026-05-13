import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { User } from '@/store/authStore';
import type { UserRole } from '@/lib/auth/gateway';

/**
 * Auth Service — domain logic for authentication and profile management.
 */
export const AuthService = {
  /**
   * Returns the role for a given user ID.
   * Uses admin client to bypass RLS for role checks.
   */
  async getUserRole(userId: string): Promise<UserRole> {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      return (data?.role as UserRole) || 'member';
    } catch {
      return 'member';
    }
  },
  /**
   * Fetches the current user profile from Supabase.
   * Only queries columns that exist in the profiles table — missing columns
   * (sprr_balance, referral_code, wallet_id, etc.) are gracefully defaulted.
   */
  async getCurrentProfile(): Promise<User | null> {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    console.log('[AuthService] getSession result:', { hasSession: !!session, userId: session?.user?.id });

    if (!session) {
      console.log('[AuthService] No session found, returning null');
      return null;
    }

    const fetchProfile = async () => {
      // ONLY query columns that exist in the profiles table on this Supabase project.
      // The profiles table has: id, email, full_name, avatar_url, role, created_at,
      // updated_at, xp, referred_by, current_streak_days, longest_streak_days,
      // last_active_at, lifetime_xp.
      // Columns like sprr_balance, referral_code, wallet_id, joined_from,
      // is_onboarded, username do NOT exist yet and would cause the query to fail.
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, created_at')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.log('[AuthService] Profile fetch error:', error.message);
      }

      return data;
    };

    let profile = await fetchProfile();

    // If profile doesn't exist yet (race with trigger or fresh signup), attempt creation
    if (!profile) {
      console.log('[AuthService] Profile missing — attempting bootstrap insert');

      // Use admin client to avoid RLS issues; only set role for known super_admin
      const admin = createAdminClient();
      const userEmail = session.user.email?.toLowerCase();
      const bootstrapRole = userEmail === 'aayushsingh1107@gmail.com' ? 'super_admin' : 'member';

      const { error: insertError } = await admin
        .from('profiles')
        .insert({
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name || null,
          avatar_url: session.user.user_metadata?.avatar_url || null,
          email: userEmail,
          role: bootstrapRole,
        });

      if (insertError) {
        console.log('[AuthService] Profile bootstrap insert error:', insertError.message);
      } else {
        console.log('[AuthService] Profile created with role:', bootstrapRole);
      }

      // Re-fetch after insert attempt
      profile = await fetchProfile();
    }

    if (!profile) {
      console.log('[AuthService] Profile still null after bootstrap — returning null');
      return null;
    }

    console.log('[AuthService] Profile found:', { id: profile.id, role: profile.role, email: profile.email });

    return {
      id: profile.id,
      username: '',
      name: profile.full_name || '',
      phone: session.user.phone || '',
      email: profile.email || session.user.email || null,
      avatar: profile.avatar_url,
      referralCode: '',
      walletId: '',
      joinedFrom: '',
      authProvider: (session.user.app_metadata?.provider as any) || 'google',
      isOnboarded: false,
      memberSince: profile.created_at,
      sprrBalance: 0,
      role: (profile.role as UserRole) || 'member',
    };
  },

  /**
   * Starts the OTP flow.
   */
  async signInWithPhone(phone: string) {
    const supabase = await createClient();
    const prefix = process.env.NEXT_PUBLIC_PHONE_PREFIX || '+91';
    const { error } = await supabase.auth.signInWithOtp({
      phone: `${prefix}${phone}`,
    });
    return { error };
  },

  /**
   * Verifies the OTP.
   */
  async verifyOTP(phone: string, token: string) {
    const supabase = await createClient();
    const prefix = process.env.NEXT_PUBLIC_PHONE_PREFIX || '+91';
    const { data, error } = await supabase.auth.verifyOtp({
      phone: `${prefix}${phone}`,
      token,
      type: 'sms',
    });
    return { data, error };
  },

  /**
   * Starts the Google Auth flow.
   */
  async signInWithGoogle(redirectTo: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
    return { data, error };
  },

  /**
   * Signs out the current user.
   */
  async signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
};

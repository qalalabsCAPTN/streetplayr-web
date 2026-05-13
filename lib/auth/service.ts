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
   */
  async getCurrentProfile(): Promise<User | null> {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, referral_code, wallet_id, joined_from, is_onboarded, created_at, sprr_balance, role')
        .eq('id', session.user.id)
        .single();
      return data;
    };

    let profile = await fetchProfile();

    // If profile doesn't exist yet (race with trigger), attempt creation
    if (!profile) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ id: session.user.id });

      if (!insertError) {
        // Re-fetch after insert
        profile = await fetchProfile();
      }
    }

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      username: profile.username,
      name: profile.full_name || '',
      phone: session.user.phone || '',
      email: session.user.email || null,
      avatar: profile.avatar_url,
      referralCode: profile.referral_code,
      walletId: profile.wallet_id,
      joinedFrom: profile.joined_from,
      authProvider: session.user.app_metadata.provider as any,
      isOnboarded: profile.is_onboarded,
      memberSince: profile.created_at,
      sprrBalance: profile.sprr_balance || 0,
      role: (profile.role as UserRole) ?? 'member',
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

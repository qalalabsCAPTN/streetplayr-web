import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { User } from '@/store/authStore';
import type { UserRole } from '@/lib/auth/gateway';

const debug = process.env.NODE_ENV === 'development'
  ? (msg: string, ...args: unknown[]) => console.log('[AuthService]', msg, ...args)
  : () => {};

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

    debug('getSession result:', { hasSession: !!session, userId: session?.user?.id });

    if (!session) {
      debug('no session found');
      return null;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, created_at')
        .eq('id', session.user.id)
        .single();

      if (error) debug('profile fetch error:', error.message);
      return data;
    };

    let profile = await fetchProfile();

    if (!profile) {
      debug('profile missing — attempting bootstrap insert');

      const admin = createAdminClient();
      const userEmail = session.user.email?.toLowerCase();

      // Role is ALWAYS member on bootstrap. Ops roles are granted only via admin tooling.
      const { error: insertError } = await admin
        .from('profiles')
        .insert({
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name || null,
          avatar_url: session.user.user_metadata?.avatar_url || null,
          email: userEmail,
          role: 'member',
        });

      if (insertError) {
        debug('profile bootstrap insert error:', insertError.message);
      } else {
        debug('profile created with role: member');
      }

      profile = await fetchProfile();
    } else if (!profile.email && session.user.email) {
      debug('profile email missing — executing self-healing update');
      const admin = createAdminClient();
      const userEmail = session.user.email.toLowerCase();
      const { error: updateError } = await admin
        .from('profiles')
        .update({ email: userEmail })
        .eq('id', session.user.id);

      if (updateError) {
        debug('profile email update error:', updateError.message);
      } else {
        debug('profile email updated successfully');
        profile.email = userEmail;
      }
    }

    if (!profile) {
      debug('profile still null after bootstrap');
      return null;
    }

    debug('profile found:', { id: profile.id, role: profile.role, email: profile.email });

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
   * Email + password sign in.
   */
  async signInWithEmail(email: string, password: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  /**
   * Email + password sign up.
   */
  async signUpWithEmail(email: string, password: string, fullName?: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName ?? '' },
      },
    });
    return { data, error };
  },

  /**
   * Send password reset email.
   */
  async resetPasswordRequest(email: string, redirectTo: string) {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { error };
  },

  /**
   * Update password (called after reset link click).
   */
  async updatePassword(newPassword: string) {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
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
   * Starts the Facebook Auth flow.
   */
  async signInWithFacebook(redirectTo: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
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

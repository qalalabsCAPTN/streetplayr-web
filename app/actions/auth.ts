'use server';

import { AuthService } from '@/lib/auth/service';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { grantWelcomeBonus } from '@/lib/nectar/engine';
import { attributeSignup } from '@/lib/nectar/referrals';
import { rateLimit, clientKey } from '@/lib/security/rate-limit';
import { sendTransactionalEmail } from '@/lib/notifications/email';
import {
  allowedAppOrigin,
  emailConfirmEmail,
  passwordResetEmail,
  recoveryRedirectUrl,
  signupConfirmUrl,
  signupRedirectUrl,
} from '@/lib/auth/password-reset';

/**
 * Standardized Response Wrapper
 */
type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server Action: Sign Out
 */
export async function logoutAction(): Promise<ActionResponse> {
  try {
    await AuthService.signOut();
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    console.error('Logout error:', e);
    return { success: false, error: e.message || 'Logout failed' };
  } finally {
    redirect('/home');
  }
}

/**
 * Server Action: Get Profile
 */
export async function getProfileAction() {
  try {
    return await AuthService.getCurrentProfile();
  } catch (e) {
    console.error('Get profile error:', e);
    return null;
  }
}

/**
 * Server Action: Start OTP
 */
export async function signInWithPhoneAction(phone: string): Promise<ActionResponse> {
  try {
    const result = await AuthService.signInWithPhone(phone);
    if (result.error) return { success: false, error: result.error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: 'Failed to send code. Please try again.' };
  }
}

/**
 * Server Action: Verify OTP
 */
export async function verifyOTPAction(phone: string, token: string, referredBy?: string): Promise<ActionResponse> {
  try {
    const result = await AuthService.verifyOTP(phone, token);
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Capture referral code on first signup
    if (referredBy && result.data?.user?.id) {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from('profiles')
        .select('referred_by')
        .eq('id', result.data.user.id)
        .single();
      if (profile && !profile.referred_by) {
        await admin
          .from('profiles')
          .update({ referred_by: referredBy, joined_from: 'referral' })
          .eq('id', result.data.user.id);
        // Wire: attributeSignup creates the referral_claim + referral_edges row
        await attributeSignup(referredBy, result.data.user.id).catch(err =>
          console.error('[auth] attributeSignup failed:', err)
        );
      }
    }

    // Grant welcome bonus to new user (idempotent)
    if (result.data?.user?.id) {
      await grantWelcomeBonus(result.data.user.id).catch(err =>
        console.error('[auth] grantWelcomeBonus failed:', err)
      );
    }

    revalidatePath('/');
    return { success: true, data: result.data };
  } catch (e: any) {
    return { success: false, error: 'Verification failed. Please try again.' };
  }
}

/**
 * Server Action: Email Sign In
 */
export async function signInWithEmailAction(email: string, password: string): Promise<ActionResponse> {
  try {
    const result = await AuthService.signInWithEmail(email, password);
    if (result.error) return { success: false, error: result.error.message };
    return { success: true, data: result.data };
  } catch (e: any) {
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

/**
 * Server Action: Email Sign Up
 */
export async function signUpWithEmailAction(
  email: string,
  password: string,
  fullName?: string,
  referredBy?: string,
  redirectOrigin?: string
): Promise<ActionResponse> {
  try {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return { success: false, error: 'Enter a valid email.' };
    }
    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }

    const hdrs = await headers();
    const rl = await rateLimit({
      key: `signup:${clientKey(hdrs, normalized)}`,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });
    if (!rl.ok) return { success: false, error: 'Too many sign up attempts. Try again later.' };

    const redirectTo = signupRedirectUrl(redirectOrigin || 'https://www.streetplayr.com');
    if (!redirectTo) return { success: false, error: 'Invalid sign up destination.' };

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'signup',
      email: normalized,
      password,
      options: {
        data: { full_name: fullName?.trim() ?? '' },
        redirectTo,
      },
    });

    if (error) {
      const msg = error.message || '';
      if (/already (been )?registered|already exists/i.test(msg)) {
        return {
          success: false,
          error: 'An account with this email already exists. Sign in or reset your password.',
        };
      }
      console.error('[auth] generateLink signup failed:', msg);
      return { success: false, error: 'Sign up failed. Please try again.' };
    }

    const origin =
      allowedAppOrigin(redirectOrigin || '') || 'https://www.streetplayr.com';
    const hashed = data?.properties?.hashed_token;
    const link = hashed ? signupConfirmUrl(origin, hashed, 'signup') : null;
    if (!link) {
      if (data?.user?.id) {
        await admin.auth.admin.deleteUser(data.user.id).catch(() => undefined);
      }
      return { success: false, error: 'Sign up failed. Please try again.' };
    }

    const mail = emailConfirmEmail(link);
    const sent = await sendTransactionalEmail({
      to: normalized,
      template: 'email_confirm',
      html: mail.html,
      text: mail.text,
    });
    if (!sent.sent) {
      if (data?.user?.id) {
        await admin.auth.admin.deleteUser(data.user.id).catch(() => undefined);
      }
      return {
        success: false,
        error: sent.error?.includes('not configured')
          ? 'Email delivery is not configured yet.'
          : 'Failed to send confirmation email. Please try again.',
      };
    }

    const userId = data?.user?.id;
    if (userId) {
      await grantWelcomeBonus(userId).catch((err) =>
        console.error('[auth] grantWelcomeBonus failed:', err)
      );
      if (referredBy) {
        await attributeSignup(referredBy, userId).catch((err) =>
          console.error('[auth] attributeSignup (email) failed:', err)
        );
      }
    }

    return { success: true, data: { user: data.user, session: null } };
  } catch (e: unknown) {
    console.error('[auth] sign up failed:', e);
    return { success: false, error: 'Sign up failed. Please try again.' };
  }
}

/**
 * Server Action: Forgot Password
 */
export async function forgotPasswordAction(email: string, redirectTo: string): Promise<ActionResponse> {
  try {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return { success: false, error: 'Enter a valid email.' };
    }

    const hdrs = await headers();
    const rl = await rateLimit({
      key: `forgot-password:${clientKey(hdrs, normalized)}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!rl.ok) return { success: false, error: 'Too many reset requests. Try again later.' };

    const recoveryTo = recoveryRedirectUrl(redirectTo);
    if (!recoveryTo) return { success: false, error: 'Invalid reset destination.' };

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: normalized,
      options: { redirectTo: recoveryTo },
    });

    // Unknown emails look the same as sent — do not leak account existence.
    if (error) {
      const msg = error.message || '';
      if (/not found|unable to find|user not found/i.test(msg)) return { success: true };
      console.error('[auth] generateLink recovery failed:', msg);
      return { success: false, error: 'Failed to send reset email. Please try again.' };
    }

    const link = data?.properties?.action_link;
    if (!link) return { success: true };

    const mail = passwordResetEmail(link);
    const sent = await sendTransactionalEmail({
      to: normalized,
      template: 'password_reset',
      html: mail.html,
      text: mail.text,
    });
    if (!sent.sent) {
      return {
        success: false,
        error: sent.error?.includes('not configured')
          ? 'Email delivery is not configured yet.'
          : 'Failed to send reset email. Please try again.',
      };
    }
    return { success: true };
  } catch (e: unknown) {
    console.error('[auth] forgot password failed:', e);
    return { success: false, error: 'Failed to send reset email. Please try again.' };
  }
}

/**
 * Server Action: Reset Password
 */
export async function resetPasswordAction(newPassword: string): Promise<ActionResponse> {
  try {
    const result = await AuthService.updatePassword(newPassword);
    if (result.error) return { success: false, error: result.error.message };
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: 'Password reset failed. Please try again.' };
  }
}

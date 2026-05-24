'use server';

import { AuthService } from '@/lib/auth/service';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { grantWelcomeBonus } from '@/lib/nectar/engine';
import { attributeSignup } from '@/lib/nectar/referrals';

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
    redirect('/');
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
  referredBy?: string
): Promise<ActionResponse> {
  try {
    const result = await AuthService.signUpWithEmail(email, password, fullName);
    if (result.error) return { success: false, error: result.error.message };

    const userId = result.data?.user?.id;

    if (userId) {
      // Grant welcome bonus (idempotent)
      await grantWelcomeBonus(userId).catch(err =>
        console.error('[auth] grantWelcomeBonus failed:', err)
      );

      // Wire referral attribution (adapted from NECTAR 2.0 attributeSignup)
      if (referredBy) {
        await attributeSignup(referredBy, userId).catch(err =>
          console.error('[auth] attributeSignup (email) failed:', err)
        );
      }
    }

    return { success: true, data: result.data };
  } catch (e: any) {
    return { success: false, error: 'Sign up failed. Please try again.' };
  }
}

/**
 * Server Action: Forgot Password
 */
export async function forgotPasswordAction(email: string, redirectTo: string): Promise<ActionResponse> {
  try {
    const result = await AuthService.resetPasswordRequest(email, redirectTo);
    if (result.error) return { success: false, error: result.error.message };
    return { success: true };
  } catch (e: any) {
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

/**
 * Server Action: Start Google Login
 */
export async function signInWithGoogleAction(redirectTo: string): Promise<ActionResponse> {
  try {
    const result = await AuthService.signInWithGoogle(redirectTo);
    if (result.error) return { success: false, error: result.error.message };
    return { success: true, data: result.data };
  } catch (e: any) {
    return { success: false, error: 'Google login failed.' };
  }
}

/**
 * Server Action: Start Facebook Login
 */
export async function signInWithFacebookAction(redirectTo: string): Promise<ActionResponse> {
  try {
    const result = await AuthService.signInWithFacebook(redirectTo);
    if (result.error) return { success: false, error: result.error.message };
    return { success: true, data: result.data };
  } catch (e: any) {
    return { success: false, error: 'Facebook login failed.' };
  }
}

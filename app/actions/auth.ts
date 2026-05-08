'use server';

import { AuthService } from '@/lib/auth/service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
export async function verifyOTPAction(phone: string, token: string): Promise<ActionResponse> {
  try {
    const result = await AuthService.verifyOTP(phone, token);
    if (result.error) return { success: false, error: result.error.message };
    
    revalidatePath('/');
    return { success: true, data: result.data };
  } catch (e: any) {
    return { success: false, error: 'Verification failed. Please try again.' };
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

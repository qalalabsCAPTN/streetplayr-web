'use client';

import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  signInWithGoogleAction,
  signInWithFacebookAction,
  signInWithEmailAction,
  signInWithPhoneAction,
  verifyOTPAction,
} from '@/app/actions/auth';
import { isSupabaseConfigured, demoLogin } from '@/lib/auth/demo';

const EASE = [0.22, 1, 0.36, 1] as const;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

type AuthMode = 'email' | 'phone';
type PhoneStep = 'enter' | 'otp';

export default function LoginModal({
  open,
  onClose,
  redirectTo = '/profile',
}: {
  open: boolean;
  onClose: () => void;
  redirectTo?: string;
}) {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>('email');
  const [socialPending, setSocialPending] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] = useState<'google' | 'facebook' | null>(null);
  const [authError, setAuthError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailPending, setEmailPending] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('enter');
  const [phonePending, setPhonePending] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleSocial(_action: typeof signInWithGoogleAction, provider: 'google' | 'facebook') {
    setAuthError('');
    if (!isSupabaseConfigured) {
      demoLogin({ provider: provider === 'facebook' ? 'google' : provider });
      finishLogin();
      return;
    }
    setSocialPending(true);
    setActiveSocialProvider(provider);
    // IMPORTANT: Must use the BROWSER client here — signInWithOAuth must store
    // the PKCE code_verifier in a browser cookie. Calling via a Server Action
    // uses the server-side client which cannot write cookies to the browser,
    // causing exchangeCodeForSession() to fail with a PKCE mismatch.
    const supabase = createBrowserSupabaseClient();
    const siteUrl = window.location.origin;
    const callback = `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider === 'facebook' ? 'facebook' : 'google',
      options: { redirectTo: callback },
    });
    if (error || !data?.url) {
      setSocialPending(false);
      setActiveSocialProvider(null);
      setAuthError(error?.message || 'Sign-in failed. Please try again.');
      return;
    }
    window.location.href = data.url;
  }

  function finishLogin() {
    onClose();
    router.push(redirectTo);
    router.refresh();
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    setAuthError('');
    if (!email.trim()) { setEmailError('Email required.'); return; }
    if (!password) { setEmailError('Password required.'); return; }
    if (!isSupabaseConfigured) {
      demoLogin({ email: email.trim(), provider: 'google' });
      finishLogin();
      return;
    }
    setEmailPending(true);
    const result = await signInWithEmailAction(email.trim(), password);
    setEmailPending(false);
    if (!result.success) {
      setEmailError(result.error || 'Login failed.');
      return;
    }
    finishLogin();
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setPhoneError('');
    setAuthError('');
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) { setPhoneError('Enter a valid phone number.'); return; }
    if (!isSupabaseConfigured) {
      setPhoneStep('otp');
      setResendCooldown(30);
      return;
    }
    setPhonePending(true);
    const result = await signInWithPhoneAction(cleaned);
    setPhonePending(false);
    if (!result.success) {
      setPhoneError(result.error || 'Failed to send code.');
      return;
    }
    setPhoneStep('otp');
    setResendCooldown(30);
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setPhoneError('');
    setAuthError('');
    if (otp.length < 4) { setPhoneError('Enter the code.'); return; }
    const cleaned = phone.replace(/\D/g, '');
    if (!isSupabaseConfigured) {
      demoLogin({ phone: `+${cleaned}`, provider: 'phone' });
      finishLogin();
      return;
    }
    setPhonePending(true);
    const result = await verifyOTPAction(cleaned, otp);
    setPhonePending(false);
    if (!result.success) {
      setPhoneError(result.error || 'Invalid code.');
      return;
    }
    finishLogin();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="lmodal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className="lmodal"
            role="dialog"
            aria-modal="true"
            aria-label="Sign in"
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.35, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="lmodal__close" onClick={onClose} aria-label="Close">
              &times;
            </button>

            <span className="lmodal__eyebrow">My Account</span>
            <h2 className="lmodal__title">Sign in to Streetplayr</h2>
            <p className="lmodal__sub">Wallet, rewards, orders &amp; faster checkout.</p>

            {authError && (
              <p className="lmodal__error" style={{ marginBottom: 16, textAlign: 'center' }}>
                {authError}
              </p>
            )}

            <div className="lmodal__socials">
              <button
                type="button"
                className="lmodal__social"
                disabled={socialPending}
                onClick={() => handleSocial(signInWithGoogleAction, 'google')}
              >
                {activeSocialProvider === 'google' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg className="animate-spin" viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  <>
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="lmodal__social"
                disabled={socialPending}
                onClick={() => handleSocial(signInWithFacebookAction, 'facebook')}
              >
                {activeSocialProvider === 'facebook' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg className="animate-spin" viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  <>
                    <FacebookIcon />
                    <span>Continue with Facebook</span>
                  </>
                )}
              </button>
            </div>

            <div className="lmodal__divider"><span>or</span></div>

            <div className="lmodal__tabs">
              <button
                type="button"
                className={`lmodal__tab${mode === 'email' ? ' active' : ''}`}
                onClick={() => setMode('email')}
              >
                Email
              </button>
              <button
                type="button"
                className={`lmodal__tab${mode === 'phone' ? ' active' : ''}`}
                onClick={() => setMode('phone')}
              >
                Phone OTP
              </button>
            </div>

            {mode === 'email' ? (
              <form onSubmit={handleEmailLogin} noValidate className="lmodal__form">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  disabled={emailPending}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={emailPending}
                />
                {emailError && <p className="lmodal__error">{emailError}</p>}
                <button type="submit" className="lmodal__submit" disabled={emailPending}>
                  {emailPending ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            ) : phoneStep === 'enter' ? (
              <form onSubmit={handleSendOTP} noValidate className="lmodal__form">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  autoComplete="tel"
                  disabled={phonePending}
                />
                {phoneError && <p className="lmodal__error">{phoneError}</p>}
                <button type="submit" className="lmodal__submit" disabled={phonePending}>
                  {phonePending ? 'Sending…' : 'Send code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} noValidate className="lmodal__form">
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter code"
                  autoComplete="one-time-code"
                  disabled={phonePending}
                />
                {phoneError && <p className="lmodal__error">{phoneError}</p>}
                <button type="submit" className="lmodal__submit" disabled={phonePending}>
                  {phonePending ? 'Verifying…' : 'Verify & sign in'}
                </button>
                <button
                  type="button"
                  className="lmodal__resend"
                  disabled={resendCooldown > 0 || phonePending}
                  onClick={(e) => handleSendOTP(e as unknown as React.FormEvent)}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </form>
            )}

            <p className="lmodal__foot">
              New here?{' '}
              <a href="/create-account" className="lmodal__foot-link">Create an account</a>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

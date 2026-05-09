'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { signInWithGoogleAction, signInWithPhoneAction, verifyOTPAction } from '@/app/actions/auth';
import { useAuthStore } from '@/store/authStore';

// ─── Google Icon SVG ─────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ─── OTP Digit Input ─────────────────────────────────────────────────────────
interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  onComplete: (code: string) => void;
}

function OtpInput({ value, onChange, onComplete }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === 'Backspace') {
      const next = [...digits];
      if (next[idx]) {
        next[idx] = '';
        const str = next.join('');
        onChange(str);
      } else if (idx > 0) {
        next[idx - 1] = '';
        const str = next.join('');
        onChange(str);
        refs.current[idx - 1]?.focus();
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const raw = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = raw;
    const str = next.join('');
    onChange(str);
    if (raw && idx < 5) refs.current[idx + 1]?.focus();
    if (str.replace(/\s/g, '').length === 6) onComplete(str);
  }

  return (
    <div className="flex gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKey(e, i)}
          aria-label={`OTP digit ${i + 1}`}
          id={`otp-digit-${i}`}
          className="otp-digit"
        />
      ))}
    </div>
  );
}

// ─── Phone Step ───────────────────────────────────────────────────────────────
const PHONE_PREFIX = process.env.NEXT_PUBLIC_PHONE_PREFIX || '+91';
interface PhoneStepProps {
  onNext: (phone: string) => void;
}
function PhoneStep({ onNext }: PhoneStepProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('Enter a valid mobile number');
      return;
    }
    
    setIsPending(true);
    const { error: authError } = await signInWithPhoneAction(cleaned);
    setIsPending(false);

    if (authError) {
      setError(authError);
      return;
    }
    
    onNext(cleaned);
  }

  return (
    <motion.div
      key="phone"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="auth-overline">Member Access</p>
      <h1 className="auth-headline">Enter your<br />number.</h1>
      <p className="auth-subtext">
        We&apos;ll send a one-time code.<br />No passwords. No noise.
      </p>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="auth-field">
          <label htmlFor="phone-input" className="auth-label">Mobile Number</label>
          <div className="auth-input-row">
            <span className="auth-country-code">{PHONE_PREFIX}</span>
            <input
              id="phone-input"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(''); }}
              placeholder="98765 43210"
              className="auth-input"
              autoComplete="tel"
              autoFocus
              disabled={isPending}
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
        </div>

        <button type="submit" className="auth-cta" id="phone-submit-btn" disabled={isPending}>
          {isPending ? 'Sending…' : 'Send Code'}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <GoogleAuthButton />

      <p className="auth-fine-print">
        By continuing, you agree to our{' '}
        <Link href="/terms" className="auth-link">Terms</Link> &amp;{' '}
        <Link href="/privacy" className="auth-link">Privacy Policy</Link>.
      </p>
    </motion.div>
  );
}

// ─── OTP Step ─────────────────────────────────────────────────────────────────
interface OtpStepProps {
  phone: string;
  onVerify: () => void;
  onBack: () => void;
}
function OtpStep({ phone, onVerify, onBack }: OtpStepProps) {
  const PHONE_PREFIX = process.env.NEXT_PUBLIC_PHONE_PREFIX || '+91';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleComplete(val: string) {
    setIsPending(true);
    setError('');
    
    const { error: verifyError } = await verifyOTPAction(phone, val);
    
    if (verifyError) {
      setError(verifyError);
      setIsPending(false);
    } else {
      onVerify();
    }
  }

  async function handleResend() {
    setResent(true);
    await signInWithPhoneAction(phone);
    setTimeout(() => setResent(false), 3000);
  }

  const maskedPhone = `${PHONE_PREFIX} XXXXX ${phone.slice(-5)}`;

  return (
    <motion.div
      key="otp"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <button onClick={onBack} className="auth-back" id="otp-back-btn" aria-label="Go back" disabled={isPending}>
        ← Back
      </button>
      <p className="auth-overline">Verification</p>
      <h1 className="auth-headline">Check your<br />messages.</h1>
      <p className="auth-subtext">
        Code sent to {maskedPhone}.
      </p>

      <div className="auth-form">
        <div className="auth-field">
          <label className="auth-label">One-Time Code</label>
          <OtpInput value={code} onChange={setCode} onComplete={handleComplete} />
          {isPending && <p className="auth-success-text">Verifying…</p>}
          {error && <p className="auth-error">{error}</p>}
        </div>

        <button 
          onClick={() => handleComplete(code)} 
          className="auth-cta" 
          id="otp-verify-btn" 
          disabled={isPending || code.length < 6}
        >
          {isPending ? 'Verifying…' : 'Enter StreetPlayR'}
        </button>
      </div>

      <button
        onClick={handleResend}
        className="auth-resend"
        id="resend-otp-btn"
        type="button"
        disabled={isPending}
      >
        {resent ? 'Code resent ✓' : 'Resend code'}
      </button>
    </motion.div>
  );
}

// ─── Google Auth Button ───────────────────────────────────────────────────────
function GoogleAuthButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleGoogleLogin() {
    setIsPending(true);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { data, error } = await signInWithGoogleAction(redirectTo);
    
    if (error) {
      console.error('Google login error:', error);
      setIsPending(false);
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  }

  return (
    <button
      onClick={handleGoogleLogin}
      className="auth-google-btn"
      id="google-login-btn"
      type="button"
      disabled={isPending}
    >
      <GoogleIcon />
      <span>{isPending ? 'Connecting…' : 'Continue with Google'}</span>
    </button>
  );
}

// ─── Left Editorial Panel ─────────────────────────────────────────────────────
function EditorialPanel() {
  return (
    <div className="auth-panel-left" aria-hidden="true">
      <div className="auth-panel-noise" />
      <div className="auth-panel-gradient" />

      <div className="auth-panel-content">
        <Link href="/" className="auth-logo-mark">
          <span className="auth-logo-box">SP</span>
          <span className="auth-logo-text">STREET PLAYR</span>
        </Link>

        <div className="auth-panel-copy">
          <p className="auth-panel-eyebrow">SS25 Collection</p>
          <h2 className="auth-panel-headline">
            Style is<br />
            identity.<br />
            Own yours.
          </h2>
          <p className="auth-panel-sub">
            Exclusive membership.<br />Limited drops. No waitlists.
          </p>
        </div>

        <div className="auth-panel-bottom">
          <div className="auth-panel-stat">
            <span className="auth-panel-stat-num">4,200+</span>
            <span className="auth-panel-stat-label">Members</span>
          </div>
          <div className="auth-panel-stat-divider" />
          <div className="auth-panel-stat">
            <span className="auth-panel-stat-num">SS25</span>
            <span className="auth-panel-stat-label">Current Season</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inner Login Page (reads searchParams) ────────────────────────────────────
function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const isDemoAuth = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEMO_AUTH === 'true';

  // Redirect if already logged in
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      const redirectPath = searchParams.get('redirect') ?? '/profile';
      router.replace(redirectPath);
    }
  }, [isHydrated, isAuthenticated, router, searchParams]);

  function handlePhoneNext(p: string) {
    setPhone(p);
    setStep('otp');
  }

  function handleVerify() {
    // AuthProvider will detect session change and sync the store
  }

  if (!isHydrated || isAuthenticated) return null;

  return (
    <main className="auth-root" id="auth-main">
      <EditorialPanel />

      <div className="auth-panel-right">
        {/* Mobile logo */}
        <Link href="/" className="auth-logo-mark auth-logo-mobile">
          <span className="auth-logo-box">SP</span>
          <span className="auth-logo-text">STREET PLAYR</span>
        </Link>

        <div className="auth-form-container">
          {isDemoAuth ? (
            <AnimatePresence mode="wait">
              {step === 'phone' ? (
                <PhoneStep onNext={handlePhoneNext} />
              ) : (
                <OtpStep
                  phone={phone}
                  onVerify={handleVerify}
                  onBack={() => setStep('phone')}
                />
              )}
            </AnimatePresence>
          ) : (
            <motion.div
              key="google-auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="auth-overline">Member Access</p>
              <h1 className="auth-headline">Welcome<br />back.</h1>
              <p className="auth-subtext">
                Sign in with Google to enter.<br />No passwords. No noise.
              </p>

              <GoogleAuthButton />

              <p className="auth-fine-print">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="auth-link">Terms</Link> &amp;{' '}
                <Link href="/privacy" className="auth-link">Privacy Policy</Link>.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

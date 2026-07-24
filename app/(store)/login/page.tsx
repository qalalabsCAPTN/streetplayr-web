"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  signInWithEmailAction,
  signInWithPhoneAction,
  verifyOTPAction,
} from "@/app/actions/auth";
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from "@/store/authStore";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function SocialAuthButton({ icon, label, provider, isPending, onPending, activeProvider, setActiveProvider, onError }: {
  provider: 'google' | 'facebook';
  icon: React.ReactNode;
  label: string;
  isPending: boolean;
  onPending: (v: boolean) => void;
  activeProvider: string | null;
  setActiveProvider: (v: string | null) => void;
  onError: (v: string) => void;
}) {
  const searchParams = useSearchParams();

  async function handleLogin() {
    onError("");
    onPending(true);
    setActiveProvider(provider);
    const redirect = searchParams.get("redirect");
    const params = redirect ? `?next=${encodeURIComponent(redirect)}` : "";
    const siteUrl = window.location.origin;
    const redirectTo = `${siteUrl}/auth/callback${params}`;
    // IMPORTANT: Must use the BROWSER client — signInWithOAuth must store the
    // PKCE code_verifier in a browser cookie. Using a Server Action invokes the
    // server-side Supabase client which cannot write cookies to the browser,
    // so the verifier is never stored and exchangeCodeForSession() fails.
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      onPending(false);
      setActiveProvider(null);
      onError(error.message || "Sign-in failed. Please try again.");
      return;
    }
    if (data?.url) {
      window.location.href = data.url;
    }
  }

  const isCurrentPending = activeProvider === provider;

  return (
    <button type="button" onClick={handleLogin} disabled={isPending} className="lmodal__social">
      {isCurrentPending ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg className="animate-spin" viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"></circle>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing in…
        </span>
      ) : (
        <>
          {icon}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

type AuthMode = "email" | "phone";
type PhoneStep = "enter" | "otp";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<AuthMode>("email");
  const [socialPending, setSocialPending] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailPending, setEmailPending] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("enter");
  const [phonePending, setPhonePending] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleEmailLogin() {
    setEmailError("");
    setAuthError("");
    if (!email.trim()) { setEmailError("Email required."); return; }
    if (!password) { setEmailError("Password required."); return; }
    setEmailPending(true);
    const result = await signInWithEmailAction(email.trim(), password);
    setEmailPending(false);
    if (!result.success) {
      setEmailError(result.error || "Login failed.");
      return;
    }
    const redirectPath = searchParams.get("redirect") ?? "/profile";
    router.replace(redirectPath);
    router.refresh();
  }

  async function handleSendOTP() {
    setPhoneError("");
    setAuthError("");
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) { setPhoneError("Enter valid phone number."); return; }
    setPhonePending(true);
    const result = await signInWithPhoneAction(cleaned);
    setPhonePending(false);
    if (!result.success) {
      setPhoneError(result.error || "Failed to send code.");
      return;
    }
    setPhoneStep("otp");
    setResendCooldown(30);
  }

  async function handleVerifyOTP() {
    setPhoneError("");
    setAuthError("");
    if (otp.length < 4) { setPhoneError("Enter the code."); return; }
    setPhonePending(true);
    const cleaned = phone.replace(/\D/g, "");
    const result = await verifyOTPAction(cleaned, otp);
    setPhonePending(false);
    if (!result.success) {
      setPhoneError(result.error || "Verification failed.");
      return;
    }
    const redirectPath = searchParams.get("redirect") ?? "/profile";
    router.replace(redirectPath);
    router.refresh();
  }

  async function handleResendOTP() {
    if (resendCooldown > 0) return;
    const cleaned = phone.replace(/\D/g, "");
    setPhonePending(true);
    await signInWithPhoneAction(cleaned);
    setPhonePending(false);
    setResendCooldown(30);
  }

  const isAnyPending = socialPending || emailPending || phonePending;

  return (
    <div className="lmodal" style={{ position: 'static', width: '100%', maxWidth: 420 }}>
      <span className="lmodal__eyebrow">My Account</span>
      <h2 className="lmodal__title">Member Access</h2>
      <p className="lmodal__sub">Wallet, rewards, orders &amp; faster checkout.</p>

      {authError && (
        <p className="lmodal__error" style={{ marginBottom: 16, textAlign: 'center' }}>
          {authError}
        </p>
      )}

      <div className="lmodal__tabs">
        {(["email", "phone"] as AuthMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setEmailError(""); setPhoneError(""); setPhoneStep("enter"); setAuthError(""); }}
            className={`lmodal__tab${mode === m ? ' active' : ''}`}
          >
            {m === 'email' ? 'Email' : 'Phone OTP'}
          </button>
        ))}
      </div>

      {mode === "email" && (
        <div className="lmodal__form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
            placeholder="Email"
            autoComplete="email"
            disabled={isAnyPending}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
            placeholder="Password"
            autoComplete="current-password"
            disabled={isAnyPending}
          />

          {emailError && <p className="lmodal__error">{emailError}</p>}

          <div style={{ textAlign: 'right' }}>
            <Link href="/forgot-password" className="lmodal__foot-link" style={{ fontSize: 11 }}>
              Forgot password
            </Link>
          </div>

          <button type="button" onClick={handleEmailLogin} disabled={isAnyPending} className="lmodal__submit">
            {emailPending ? "Verifying…" : "Sign in"}
          </button>
        </div>
      )}

      {mode === "phone" && phoneStep === "enter" && (
        <div className="lmodal__form">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
            placeholder="Phone number"
            autoComplete="tel"
            disabled={isAnyPending}
          />
          {phoneError && <p className="lmodal__error">{phoneError}</p>}
          <button type="button" onClick={handleSendOTP} disabled={isAnyPending} className="lmodal__submit">
            {phonePending ? "Sending…" : "Send code"}
          </button>
        </div>
      )}

      {mode === "phone" && phoneStep === "otp" && (
        <div className="lmodal__form">
          <p className="lmodal__sub" style={{ margin: 0 }}>Code sent to +91 {phone}</p>
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
            placeholder="Enter code"
            autoComplete="one-time-code"
            disabled={isAnyPending}
          />
          {phoneError && <p className="lmodal__error">{phoneError}</p>}
          <button type="button" onClick={handleVerifyOTP} disabled={isAnyPending} className="lmodal__submit">
            {phonePending ? "Verifying…" : "Verify & sign in"}
          </button>
          <div className="acct-confirm__actions" style={{ justifyContent: 'space-between' }}>
            <button type="button" onClick={() => { setPhoneStep("enter"); setOtp(""); setPhoneError(""); }} className="acct-confirm__cancel">
              Change number
            </button>
            <button type="button" onClick={handleResendOTP} disabled={resendCooldown > 0 || isAnyPending} className="lmodal__resend">
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}

      <div className="lmodal__divider"><span>or</span></div>

      <div className="lmodal__socials">
        <SocialAuthButton
          provider="google"
          icon={<GoogleIcon />}
          label="Continue with Google"
          isPending={isAnyPending}
          onPending={setSocialPending}
          activeProvider={activeSocialProvider}
          setActiveProvider={setActiveSocialProvider}
          onError={setAuthError}
        />
        <SocialAuthButton
          provider="facebook"
          icon={<FacebookIcon />}
          label="Continue with Facebook"
          isPending={isAnyPending}
          onPending={setSocialPending}
          activeProvider={activeSocialProvider}
          setActiveProvider={setActiveSocialProvider}
          onError={setAuthError}
        />
      </div>

      <p className="lmodal__foot">
        New here? <Link href="/create-account" className="lmodal__foot-link">Create an account</Link>
      </p>
    </div>
  );
}

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      const redirectPath = searchParams.get("redirect") ?? "/profile";
      router.replace(redirectPath);
    }
  }, [isHydrated, isAuthenticated, router, searchParams]);

  if (!isHydrated || isAuthenticated) return null;

  return (
    <>
      <Navbar />
      <div className="listing" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100, paddingBottom: 60 }}>
        <LoginForm />
      </div>
      <Footer />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

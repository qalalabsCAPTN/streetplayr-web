"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

import { signUpWithEmailAction, signInWithGoogleAction, signInWithFacebookAction } from "@/app/actions/auth";

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

function CreateAccountForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [socialPending, setSocialPending] = useState(false);
  const [error, setError] = useState("");
  const [verifyEmail, setVerifyEmail] = useState(false);

  const isAnyPending = pending || socialPending;

  async function handleSignUp() {
    setError("");
    if (!fullName.trim()) { setError("Name required."); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Valid email required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setPending(true);
    const result = await signUpWithEmailAction(email.trim(), password, fullName.trim());
    setPending(false);

    if (!result.success) {
      setError(result.error || "Sign up failed.");
      return;
    }

    // Supabase may require email confirmation
    if (result.data?.user && !result.data.session) {
      setVerifyEmail(true);
      return;
    }

    router.replace("/profile");
  }

  async function handleOAuth(action: (redirectTo: string) => Promise<any>, provider: string) {
    setSocialPending(true);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const redirectTo = `${siteUrl}/auth/callback`;
    const { data, error } = await action(redirectTo);
    if (error) {
      console.error(`${provider} error:`, error);
      setSocialPending(false);
      return;
    }
    if (data?.url) window.location.href = data.url;
  }

  if (verifyEmail) {
    return (
      <div className="lmodal__verify">
        <p className="lmodal__title" style={{ fontSize: 18 }}>Verify your email</p>
        <p className="lmodal__sub">Confirmation sent to {email}</p>
        <Link href="/login" className="lmodal__foot-link">Back to login</Link>
      </div>
    );
  }

  return (
    <div className="lmodal__form">
      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" autoComplete="name" disabled={isAnyPending} />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" disabled={isAnyPending} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="new-password" disabled={isAnyPending} />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
        placeholder="Confirm password"
        autoComplete="new-password"
        disabled={isAnyPending}
      />

      {error && <p className="lmodal__error">{error}</p>}

      <button type="button" onClick={handleSignUp} disabled={isAnyPending} className="lmodal__submit">
        {pending ? "Creating…" : "Create account"}
      </button>

      <div className="lmodal__divider"><span>or</span></div>

      <div className="lmodal__socials">
        <button type="button" onClick={() => handleOAuth(signInWithGoogleAction, "google")} disabled={isAnyPending} className="lmodal__social">
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>
        <button type="button" onClick={() => handleOAuth(signInWithFacebookAction, "facebook")} disabled={isAnyPending} className="lmodal__social">
          <FacebookIcon />
          <span>Continue with Facebook</span>
        </button>
      </div>

      <p className="lmodal__foot">
        Already a member? <Link href="/login" className="lmodal__foot-link">Sign in</Link>
      </p>
    </div>
  );
}

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function CreateAccountPage() {
  return (
    <>
      <Navbar />
      <div className="listing" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100, paddingBottom: 60 }}>
        <div className="lmodal" style={{ position: 'static', width: '100%', maxWidth: 420 }}>
          <span className="lmodal__eyebrow">My Account</span>
          <h2 className="lmodal__title">Join Streetplayr</h2>
          <p className="lmodal__sub">Wallet, rewards, orders &amp; faster checkout.</p>

          <Suspense>
            <CreateAccountForm />
          </Suspense>
        </div>
      </div>
      <Footer />
    </>
  );
}

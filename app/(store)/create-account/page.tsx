"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

import { signUpWithEmailAction, signInWithGoogleAction, signInWithFacebookAction } from "@/app/actions/auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="#1877F2">
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
      <div className="space-y-6 text-center">
        <div className="w-12 h-12 rounded-full border border-[#ddb7ff]/30 flex items-center justify-center mx-auto">
          <svg className="w-5 h-5 text-[#ddb7ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="space-y-2">
          <p className="font-mono text-[12px] text-[#eadfed] tracking-[0.12em] uppercase">Verify your email</p>
          <p className="font-mono text-[11px] text-white/50 tracking-[0.08em]">
            Confirmation sent to {email}
          </p>
        </div>
        <Link
          href="/login"
          className="block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 hover:text-[#eadfed] transition-colors"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 mb-2.5">
          Full Name
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          className="w-full bg-transparent border-b border-white/[0.10] py-4 font-mono text-[13px] text-[#eadfed] outline-none focus:border-[#ddb7ff]/40 transition-colors"
        />
      </div>

      <div>
        <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 mb-2.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="w-full bg-transparent border-b border-white/[0.10] py-4 font-mono text-[13px] text-[#eadfed] outline-none focus:border-[#ddb7ff]/40 transition-colors"
        />
      </div>

      <div>
        <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 mb-2.5">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full bg-transparent border-b border-white/[0.10] py-4 font-mono text-[13px] text-[#eadfed] outline-none focus:border-[#ddb7ff]/40 transition-colors"
        />
      </div>

      <div>
        <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 mb-2.5">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
          autoComplete="new-password"
          className="w-full bg-transparent border-b border-white/[0.10] py-4 font-mono text-[13px] text-[#eadfed] outline-none focus:border-[#ddb7ff]/40 transition-colors"
        />
      </div>

      {error && (
        <p className="font-mono text-[11px] text-red-400/90 tracking-[0.1em]">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSignUp}
        disabled={isAnyPending}
        className="relative w-full py-4 mt-2 overflow-hidden group border border-white/[0.12] transition-all duration-500 hover:border-[#ddb7ff] disabled:opacity-40"
      >
        <span className="absolute inset-0 bg-[#ddb7ff] transition-transform duration-500 group-hover:scale-y-0 origin-bottom" />
        <span className="absolute inset-0 bg-[#eadfed] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />
        <span className="relative z-10 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-[#16111b]">
          {pending ? "Creating..." : "Create Account"}
        </span>
      </button>

      <div className="flex items-center gap-4 my-2">
        <span className="flex-1 h-px bg-white/[0.12]" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-white/60">or</span>
        <span className="flex-1 h-px bg-white/[0.12]" />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleOAuth(signInWithGoogleAction, "google")}
          disabled={isAnyPending}
          className="flex-1 flex items-center justify-center gap-2.5 py-3.5 border border-white/[0.15] font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/90 hover:text-white hover:border-white/[0.30] hover:bg-white/[0.05] transition-all duration-300 disabled:opacity-40"
        >
          <GoogleIcon />
          <span>Google</span>
        </button>
        <button
          type="button"
          onClick={() => handleOAuth(signInWithFacebookAction, "facebook")}
          disabled={isAnyPending}
          className="flex-1 flex items-center justify-center gap-2.5 py-3.5 border border-white/[0.15] font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/90 hover:text-white hover:border-white/[0.30] hover:bg-white/[0.05] transition-all duration-300 disabled:opacity-40"
        >
          <FacebookIcon />
          <span>Facebook</span>
        </button>
      </div>

      <div className="pt-3 text-center">
        <Link
          href="/login"
          className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/60 hover:text-white/80 transition-colors"
        >
          Already a member? Sign In
        </Link>
      </div>
    </div>
  );
}

export default function CreateAccountPage() {
  return (
    <main className="relative min-h-screen bg-[#16111b] flex items-center justify-center overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(221,183,255,0.04)_0%,transparent_55%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full px-6 sm:px-8 py-12"
      >
        <div className="w-full max-w-[420px] mx-auto">
          <div className="border border-white/[0.08] bg-[#1b1620]/60">
            <div className="p-6 sm:p-8">
              <div className="flex justify-center mb-8">
                <img src="/assets/streetplayr-logo.png" alt="StreetPlayR" width="160" height="40" className="h-10 w-auto object-contain opacity-90" />
              </div>

              <div className="text-center mb-8">
                <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-[0.06em] text-[#eadfed] mb-2">
                  Join the Play
                </h1>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/[0.18] to-transparent mx-auto" />
              </div>

              <Suspense>
                <CreateAccountForm />
              </Suspense>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

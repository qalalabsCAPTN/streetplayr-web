'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { signInWithGoogleAction } from '@/app/actions/auth';
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

// ─── Google Auth Button ─────────────────────────────────────────────────────
function GoogleAuthButton() {
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);

  async function handleGoogleLogin() {
    setIsPending(true);
    const redirect = searchParams.get('redirect');
    const params = redirect ? `?next=${encodeURIComponent(redirect)}` : '';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const redirectTo = `${siteUrl}/auth/callback${params}`;
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
      type="button"
      onClick={handleGoogleLogin}
      disabled={isPending}
      className="rounded-none group relative w-full py-5 text-center overflow-hidden transition-all active:scale-[0.98] disabled:opacity-40"
    >
      <span className="absolute inset-0 bg-[#ddb7ff] transition-transform duration-500 group-hover:scale-y-0 origin-bottom" />
      <span className="absolute inset-0 bg-[#eadfed] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />
      <span className="relative z-10 flex items-center justify-center gap-3 text-sm uppercase tracking-[0.2em] text-[#16111b] font-light">
        <GoogleIcon />
        <span>{isPending ? 'Connecting…' : 'Initialize Session'}</span>
      </span>
    </button>
  );
}

// ─── Left Visual Panel ───────────────────────────────────────────────────────
function VisualPanel() {
  return (
    <div className="w-full md:w-1/2 min-h-screen flex flex-col justify-between p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/[0.06] relative overflow-hidden">
      {/* Panel ambient glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ddb7ff]/[0.03] blur-[120px] rounded-full" />

      {/* ── Header ── */}
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-white flex items-center justify-center">
            <span className="font-display text-sm text-black tracking-wide">SP</span>
          </div>
          <div>
            <span className="block font-display text-base uppercase tracking-wider text-[#eadfed] leading-tight">Street PlayR</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">Member Access</span>
          <span className="w-px h-3 bg-white/[0.1]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">V2.0</span>
        </div>
      </div>

      {/* ── Central Framed Visual ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-8 md:py-12">
        <div className="relative w-full max-w-[420px] border border-white/[0.08] bg-[#1f1a23]/40">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/[0.12] pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/[0.12] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/[0.12] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/[0.12] pointer-events-none" />

          {/* Content area */}
          <div className="p-6 md:p-10">
            {/* Brand monogram hero */}
            <div className="aspect-[4/5] bg-[#231e27] border border-white/[0.04] flex items-center justify-center relative overflow-hidden">
              {/* Grid texture */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }}
              />
              {/* Accent glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(221,183,255,0.08)_0%,transparent_60%)]" />

              {/* Large brand lettering */}
              <span className="relative z-10 font-display text-7xl md:text-8xl uppercase tracking-[0.1em] text-[#eadfed]/15 select-none">
                SP
              </span>

              {/* REC overlay — top left */}
              <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ff3b30] animate-pulse" />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/[0.45]">00:18:42</span>
              </div>

              {/* Tier metadata — bottom left */}
              <div className="absolute bottom-3 left-3 z-20">
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#ddb7ff]/[0.5]">
                  ACCESS TIER: MEMBER
                </span>
              </div>

              {/* Bottom-right bracket */}
              <div className="absolute bottom-3 right-3 z-20 font-mono text-[10px] text-white/[0.12]">
                {'>_'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="relative z-10 pt-4 border-t border-white/[0.05]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full border border-white/20" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
              Authorization: Pending
            </span>
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/15">ID: STR-24</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/15">TERM: 0x7A</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Right Form Panel ────────────────────────────────────────────────────────
function FormPanel() {
  return (
    <div className="w-full md:w-1/2 min-h-screen flex flex-col items-center justify-center p-8 md:p-12 relative overflow-hidden">
      {/* Panel ambient glow */}
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#ddb7ff]/[0.02] blur-[100px] rounded-full" />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* ── Heading ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff]">[</span>
            <h1 className="font-display text-4xl md:text-5xl uppercase tracking-wide text-[#eadfed]">Security Entry</h1>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff]">]</span>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-[#ddb7ff]/30 via-white/[0.06] to-transparent" />
        </motion.div>

        {/* ── Auth Content ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          {/* Intro */}
          <div className="space-y-3 pb-6 border-b border-white/[0.05]">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              Terminal Authentication Required
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/20 leading-relaxed">
              Authorize via Google OAuth to access your dashboard, manage orders, and claim exclusive drops.
            </p>
          </div>

          {/* Google Auth */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Authentication</span>
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#ddb7ff]/[0.4]">REQ_OAUTH</span>
            </div>
            <GoogleAuthButton />
          </div>

          {/* Secondary actions */}
          <div className="flex pt-2">
            <Link
              href="/contact"
              className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25 hover:text-white/50 transition-colors"
            >
              Recovery Mode
            </Link>
          </div>
        </motion.div>

        {/* ── Footer ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 pt-6 border-t border-white/[0.05] space-y-4"
        >
          <div className="flex items-center gap-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500/60" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Connection: Secure</span>
          </div>

          <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/15 leading-relaxed">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-white/30 hover:text-white/50 transition-colors">Terms</Link>
            {' '}&amp;{' '}
            <Link href="/privacy" className="text-white/30 hover:text-white/50 transition-colors">Privacy Policy</Link>.
          </p>

          <div className="pt-1 flex items-center gap-4">
            <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/10">ENCRYPTION: TLS 1.3</span>
            <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/10">SYS: ONLINE</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Inner Login Page ────────────────────────────────────────────────────────
function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Redirect if already logged in
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      const redirectPath = searchParams.get('redirect') ?? '/profile';
      router.replace(redirectPath);
    }
  }, [isHydrated, isAuthenticated, router, searchParams]);

  if (!isHydrated || isAuthenticated) return null;

  return (
    <main className="relative min-h-screen bg-[#16111b]">
      {/* ── Environmental background layers ── */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.25)_0%,transparent_10%,transparent_90%,rgba(0,0,0,0.25)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(221,183,255,0.05)_0%,transparent_55%)]" />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,87,26,0.03)_0%,transparent_60%)]" />

      {/* ── Left vertical framing rail ── */}
      <div className="fixed left-0 top-0 bottom-0 w-px bg-white/[0.04] z-20 pointer-events-none" />
      <div className="fixed left-0 top-0 bottom-0 w-px bg-white/[0.02] translate-x-[7px] z-20 pointer-events-none" />

      {/* ── Split layout ── */}
      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        <VisualPanel />
        <FormPanel />
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

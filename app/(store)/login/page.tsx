"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { signInWithGoogleAction, signInWithFacebookAction } from "@/app/actions/auth";
import { useAuthStore } from "@/store/authStore";

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

function SocialAuthButton({ provider, icon, label, action, isPending: externalPending, onPending }: {
  provider: string;
  icon: React.ReactNode;
  label: string;
  action: (redirectTo: string) => Promise<any>;
  isPending: boolean;
  onPending: (v: boolean) => void;
}) {
  const searchParams = useSearchParams();

  async function handleLogin() {
    onPending(true);
    const redirect = searchParams.get("redirect");
    const params = redirect ? `?next=${encodeURIComponent(redirect)}` : "";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const redirectTo = `${siteUrl}/auth/callback${params}`;
    const { data, error } = await action(redirectTo);
    if (error) {
      console.error(`${provider} login error:`, error);
      onPending(false);
      return;
    }
    if (data?.url) {
      window.location.href = data.url;
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={externalPending}
      className="flex items-center justify-center gap-2.5 w-full py-3 border border-white/[0.10] font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 hover:text-[#eadfed] hover:border-white/[0.20] transition-all duration-300 disabled:opacity-40"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [socialPending, setSocialPending] = useState(false);

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div className="border border-white/[0.08] bg-[#1b1620]/60">
        <div className="p-8 sm:p-10">
          <div className="flex justify-center mb-8">
            <img src="/assets/streetplayr-logo.png" alt="StreetPlayR" className="h-10 w-auto object-contain opacity-90" />
          </div>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#ddb7ff]/50">[</span>
              <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-[0.06em] text-[#eadfed]">
                Member Access
              </h1>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#ddb7ff]/50">]</span>
            </div>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent mx-auto" />
          </div>

          <div className="space-y-5">
            <div>
              <label className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-white/30 mb-2">
                <span className="text-[#ddb7ff]/40">{">_"}</span>
                Email / Phone
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                className="w-full bg-transparent border-b border-white/[0.10] py-3 font-mono text-[13px] text-[#eadfed] outline-none focus:border-[#ddb7ff]/40 transition-colors placeholder:text-white/[0.08]"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-white/30 mb-2">
                <span className="text-[#ddb7ff]/40">{">_"}</span>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                className="w-full bg-transparent border-b border-white/[0.10] py-3 font-mono text-[13px] text-[#eadfed] outline-none focus:border-[#ddb7ff]/40 transition-colors placeholder:text-white/[0.08]"
              />
            </div>

            <div className="flex justify-end pt-1">
              <Link
                href="#"
                className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25 hover:text-[#ddb7ff]/60 transition-colors"
              >
                Forgot Password
              </Link>
            </div>

            <button
              type="button"
              className="relative w-full py-4 mt-2 overflow-hidden group border border-white/[0.12] transition-all duration-500 hover:border-[#ddb7ff]"
            >
              <span className="absolute inset-0 bg-[#ddb7ff] transition-transform duration-500 group-hover:scale-y-0 origin-bottom" />
              <span className="absolute inset-0 bg-[#eadfed] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />
              <span className="relative z-10 font-mono text-[10px] uppercase tracking-[0.28em] text-[#16111b]">
                Access System
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4 my-6">
            <span className="flex-1 h-px bg-white/[0.06]" />
            <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/20">or</span>
            <span className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <SocialAuthButton
                provider="google"
                icon={<GoogleIcon />}
                label="Google"
                action={signInWithGoogleAction}
                isPending={socialPending}
                onPending={setSocialPending}
              />
            </div>
            <div className="flex-1">
              <SocialAuthButton
                provider="facebook"
                icon={<FacebookIcon />}
                label="Facebook"
                action={signInWithFacebookAction}
                isPending={socialPending}
                onPending={setSocialPending}
              />
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <Link
              href="#"
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/30 hover:text-[#eadfed] transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-8 sm:px-10 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500/50" />
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20">Terminal Active</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <span className="font-mono text-[7px] tracking-[0.2em] text-white/[0.15] uppercase flex items-center gap-1.5">
              <span className="inline-block w-1 h-1 rounded-full bg-green-500/40" />
              NETWORK ONLINE
            </span>
            <span className="font-mono text-[7px] tracking-[0.2em] text-white/[0.15] uppercase flex items-center gap-1.5">
              <span className="inline-block w-1 h-1 rounded-full bg-green-500/40" />
              IDENTITY ACTIVE
            </span>
            <span className="font-mono text-[7px] tracking-[0.2em] text-white/[0.15] uppercase flex items-center gap-1.5">
              <span className="inline-block w-1 h-1 rounded-full bg-green-500/40" />
              ACCESS READY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <main className="relative min-h-screen bg-[#16111b] flex items-center justify-center overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(221,183,255,0.04)_0%,transparent_55%)]" />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full px-6 sm:px-8 py-12"
      >
        <LoginForm />
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { resetPasswordAction } from "@/app/actions/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setPending(true);
    const result = await resetPasswordAction(password);
    setPending(false);
    if (!result.success) {
      setError(result.error || "Reset failed.");
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/login"), 2500);
  }

  return (
    <main className="relative min-h-screen bg-transparent flex items-center justify-center overflow-hidden">
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
                  New Password
                </h1>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/[0.18] to-transparent mx-auto" />
              </div>

              {done ? (
                <div className="space-y-6 text-center">
                  <div className="w-12 h-12 rounded-full border border-[#ddb7ff]/30 flex items-center justify-center mx-auto">
                    <svg className="w-5 h-5 text-[#ddb7ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <p className="font-mono text-[12px] text-[#eadfed] tracking-[0.12em] uppercase">Password updated</p>
                    <p className="font-mono text-[11px] text-white/50 tracking-[0.08em]">Redirecting to login...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 mb-2.5">
                      New Password
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
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      autoComplete="new-password"
                      className="w-full bg-transparent border-b border-white/[0.10] py-4 font-mono text-[13px] text-[#eadfed] outline-none focus:border-[#ddb7ff]/40 transition-colors"
                    />
                  </div>

                  {error && (
                    <p className="font-mono text-[11px] text-red-400/90 tracking-[0.1em]">{error}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={pending}
                    className="relative w-full py-4 mt-2 overflow-hidden group border border-white/[0.12] transition-all duration-500 hover:border-[#ddb7ff] disabled:opacity-40"
                  >
                    <span className="absolute inset-0 bg-[#ddb7ff] transition-transform duration-500 group-hover:scale-y-0 origin-bottom" />
                    <span className="absolute inset-0 bg-[#eadfed] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />
                    <span className="relative z-10 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-[#16111b]">
                      {pending ? "Updating..." : "Update Password"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

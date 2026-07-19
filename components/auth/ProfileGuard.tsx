'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import LoginModal from './LoginModal';

/**
 * In-place auth gate for the account section. Instead of redirecting to
 * /login, renders a Bluorng-styled sign-in panel with the login popup, so
 * the user never leaves the dashboard shell.
 */
export default function ProfileGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [loginOpen, setLoginOpen] = useState(true);

  // Avoid flash before localStorage rehydrates
  if (!isHydrated) return null;

  if (!isAuthenticated) {
    return (
      <div className="acct">
        <div className="acct-empty" style={{ maxWidth: 560, margin: '40px auto 0' }}>
          <span className="acct-head__eyebrow">My Account</span>
          <p className="acct-empty__title">Sign in to view your account</p>
          <p className="acct-empty__sub">
            Wallet, rewards, orders and saved addresses live here.
          </p>
          <button type="button" className="pill" onClick={() => setLoginOpen(true)}>
            Sign in
          </button>
        </div>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  return <>{children}</>;
}

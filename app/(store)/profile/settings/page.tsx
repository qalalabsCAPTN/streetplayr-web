'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

// ─── Toggle Switch ───────────────────────────────────────────────────────
function ToggleSwitch({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <label htmlFor={id} className="flex items-center justify-between py-3 cursor-pointer group">
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/50 group-hover:text-white/70 transition-colors">{label}</span>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 border transition-colors duration-300 ${
          checked ? 'bg-[#ddb7ff]/20 border-[#ddb7ff]/40' : 'bg-white/[0.04] border-white/[0.1]'
        }`}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white/60"
          animate={{ left: checked ? 'calc(100% - 20px)' : '2px' }}
          transition={{ type: 'spring', stiffness: 600, damping: 40 }}
        />
      </button>
    </label>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────
function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pb-6 mb-6 border-b border-white/[0.05] last:border-b-0 last:mb-0 last:pb-0"
    >
      <h2 className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#ddb7ff]/[0.6] mb-4">{title}</h2>
      <div className="space-y-1">{children}</div>
    </motion.section>
  );
}

// ─── Settings Field ──────────────────────────────────────────────────────
function SettingsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 py-2">
      <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">{label}</label>
      {children}
    </div>
  );
}

// ─── Info Row ────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">{label}</span>
      <span className="font-mono text-[10px] text-white/50">{value}</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [nameSaved, setNameSaved] = useState(false);

  const [notifDrops, setNotifDrops] = useState(true);
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifRewards, setNotifRewards] = useState(false);

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      updateProfile({ name: name.trim(), email: email.trim() || null });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    }
  }

  function handleSignOut() {
    logout();
    router.push('/');
  }

  if (!user) return null;

  return (
    <div className="max-w-[1200px]">
      {/* ═══ HEADER ═══ */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 border-l-4 border-[#ddb7ff] pl-6"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff] block mb-2">
          [ SYSTEM // PREFERENCES ]
        </span>
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-tight text-[#eadfed] leading-none">
          Settings
        </h1>
      </motion.header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-[640px]">
        {/* ── Identity ── */}
        <SettingsSection title="Identity">
          <form onSubmit={handleSaveName} noValidate>
            <div className="space-y-4">
              <SettingsField label="Display Name">
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border border-white/[0.08] px-4 py-2.5 font-mono text-xs text-white/70 outline-none transition-colors placeholder:text-white/20 focus:border-[#ddb7ff]/40"
                  placeholder="Your name"
                />
              </SettingsField>

              <SettingsField label="Email">
                <input
                  id="settings-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border border-white/[0.08] px-4 py-2.5 font-mono text-xs text-white/70 outline-none transition-colors placeholder:text-white/20 focus:border-[#ddb7ff]/40"
                  placeholder="your@email.com"
                />
              </SettingsField>

              <SettingsField label="Mobile">
                <div className="flex items-center h-[42px] px-4 border border-white/[0.05] bg-white/[0.02]">
                  <span className="font-mono text-xs text-white/30">{user.phone}</span>
                </div>
                <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/15 mt-1">Cannot be changed</p>
              </SettingsField>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#ddb7ff] text-[#16111b] font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-white transition-colors"
                >
                  Save Changes
                </button>
                <AnimatePresence>
                  {nameSaved && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="font-mono text-[9px] uppercase tracking-[0.15em] text-green-400"
                    >
                      ✓ Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </form>
        </SettingsSection>

        {/* ── Notifications ── */}
        <SettingsSection title="Notifications">
          <ToggleSwitch id="notif-drops" checked={notifDrops} onChange={setNotifDrops} label="Drop alerts" />
          <ToggleSwitch id="notif-orders" checked={notifOrders} onChange={setNotifOrders} label="Order updates" />
          <ToggleSwitch id="notif-rewards" checked={notifRewards} onChange={setNotifRewards} label="SP-RR rewards" />
        </SettingsSection>

        {/* ── Account ── */}
        <SettingsSection title="Account">
          <InfoRow label="Auth method" value={user.authProvider === 'google' ? 'Google' : 'Phone OTP'} />
          <InfoRow label="Member since" value={new Date(user.memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} />
          <InfoRow label="Referral code" value={user.referralCode} />
        </SettingsSection>

        {/* ── Session ── */}
        <SettingsSection title="Session">
          <AnimatePresence mode="wait">
            {!showSignOutConfirm ? (
              <motion.button
                key="signout-btn"
                type="button"
                onClick={() => setShowSignOutConfirm(true)}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border border-white/[0.12] px-6 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 hover:bg-white/[0.04] hover:text-white transition-all"
              >
                Sign Out
              </motion.button>
            ) : (
              <motion.div
                key="signout-confirm"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">Are you sure you want to sign out?</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="border border-white/[0.12] px-6 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 hover:bg-white/[0.06] transition-all"
                  >
                    Yes, sign out
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSignOutConfirm(false)}
                    className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SettingsSection>

        {/* ── Danger Zone ── */}
        <SettingsSection title="Danger Zone">
          <AnimatePresence mode="wait">
            {!showDeleteConfirm ? (
              <motion.div key="delete-initial" exit={{ opacity: 0 }}>
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-red-400/50 mb-3">
                  Permanently remove your account, membership, and SP-RR balance.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border border-red-500/30 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                  Delete Account
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="delete-confirm"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-red-400/70">
                  This cannot be undone. All data will be permanently erased.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { logout(); router.push('/'); }}
                    className="border border-red-500/40 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    Yes, delete everything
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 hover:text-white transition-colors"
                  >
                    Keep my account
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SettingsSection>
      </div>
    </div>
  );
}

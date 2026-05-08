'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

// ─── Toggle Switch ────────────────────────────────────────────────────────────
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
    <label htmlFor={id} className="settings-toggle-row" aria-label={label}>
      <span className="settings-toggle-label">{label}</span>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`settings-toggle ${checked ? 'settings-toggle--on' : ''}`}
      >
        <motion.span
          className="settings-toggle-thumb"
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 40 }}
        />
      </button>
    </label>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      className="settings-section"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="settings-section-title">{title}</h2>
      <div className="settings-section-body">{children}</div>
    </motion.section>
  );
}

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
    <div className="profile-page-root">
      <motion.div
        className="profile-page-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="profile-page-eyebrow">Preferences</p>
        <h1 className="profile-page-title">Settings</h1>
      </motion.div>

      {/* ── Profile Info ─────────────────────────────────────────────── */}
      <SettingsSection title="Identity">
        <form onSubmit={handleSaveName} className="settings-form" noValidate>
          <div className="auth-field">
            <label htmlFor="settings-name" className="auth-label">Display Name</label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              placeholder="Your name"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="settings-email" className="auth-label">Email (optional)</label>
            <input
              id="settings-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="your@email.com"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Mobile</label>
            <input
              type="tel"
              value={user.phone}
              className="auth-input auth-input--readonly"
              readOnly
              aria-readonly="true"
              tabIndex={-1}
            />
            <p className="settings-readonly-hint">Mobile number cannot be changed</p>
          </div>

          <div className="settings-save-row">
            <button type="submit" className="auth-cta" id="save-profile-btn">
              Save Changes
            </button>
            <AnimatePresence>
              {nameSaved && (
                <motion.span
                  className="settings-saved-badge"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  ✓ Saved
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </form>
      </SettingsSection>

      {/* ── Notifications ────────────────────────────────────────────── */}
      <SettingsSection title="Notifications">
        <ToggleSwitch
          id="notif-drops"
          checked={notifDrops}
          onChange={setNotifDrops}
          label="Drop alerts"
        />
        <ToggleSwitch
          id="notif-orders"
          checked={notifOrders}
          onChange={setNotifOrders}
          label="Order updates"
        />
        <ToggleSwitch
          id="notif-rewards"
          checked={notifRewards}
          onChange={setNotifRewards}
          label="SP-RR rewards"
        />
      </SettingsSection>

      {/* ── Auth Info ────────────────────────────────────────────────── */}
      <SettingsSection title="Account">
        <div className="settings-info-row">
          <span className="settings-info-label">Auth method</span>
          <span className="settings-info-value">
            {user.authProvider === 'google' ? 'Google' : 'Phone OTP'}
          </span>
        </div>
        <div className="settings-info-row">
          <span className="settings-info-label">Member since</span>
          <span className="settings-info-value">
            {new Date(user.memberSince).toLocaleDateString('en-IN', {
              month: 'long', year: 'numeric',
            })}
          </span>
        </div>
        <div className="settings-info-row">
          <span className="settings-info-label">Referral code</span>
          <span className="settings-info-value" style={{ color: 'var(--sp-accent)', fontFamily: 'var(--font-sp-mono)' }}>
            {user.referralCode}
          </span>
        </div>
      </SettingsSection>

      {/* ── Sign Out ─────────────────────────────────────────────────── */}
      <SettingsSection title="Session">
        <AnimatePresence mode="wait">
          {!showSignOutConfirm ? (
            <motion.button
              key="signout-btn"
              type="button"
              onClick={() => setShowSignOutConfirm(true)}
              className="settings-danger-btn"
              id="sign-out-btn"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Sign Out
            </motion.button>
          ) : (
            <motion.div
              key="signout-confirm"
              className="settings-confirm-row"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="settings-confirm-text">Are you sure you want to sign out?</p>
              <div className="settings-confirm-actions">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="settings-danger-btn"
                  id="confirm-sign-out-btn"
                >
                  Yes, sign out
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(false)}
                  className="settings-cancel-btn"
                  id="cancel-sign-out-btn"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SettingsSection>

      {/* ── Delete Account ────────────────────────────────────────────── */}
      <SettingsSection title="Danger Zone">
        <AnimatePresence mode="wait">
          {!showDeleteConfirm ? (
            <motion.div key="delete-initial" exit={{ opacity: 0 }}>
              <p className="settings-danger-hint">
                Permanently remove your account, membership, and SP-RR balance.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="settings-delete-btn"
                id="delete-account-btn"
              >
                Delete Account
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="delete-confirm"
              className="settings-confirm-row"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="settings-confirm-text" style={{ color: 'var(--sp-error)' }}>
                This cannot be undone. All data will be permanently erased.
              </p>
              <div className="settings-confirm-actions">
                <button
                  type="button"
                  onClick={() => { logout(); router.push('/'); }}
                  className="settings-delete-btn"
                  id="confirm-delete-btn"
                >
                  Yes, delete everything
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="settings-cancel-btn"
                  id="cancel-delete-btn"
                >
                  Keep my account
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SettingsSection>
    </div>
  );
}

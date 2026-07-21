'use client';

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
    <label htmlFor={id} className="acct-toggle">
      <span>{label}</span>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`acct-toggle__switch ${checked ? 'on' : ''}`}
      >
        <span className="acct-toggle__thumb" />
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
    <section className="acct-settings-section">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

// ─── Settings Field ──────────────────────────────────────────────────────
function SettingsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="checkout-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

// ─── Info Row ────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="acct-inforow">
      <span>{label}</span>
      <span>{value}</span>
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
    router.push('/home');
  }

  if (!user) return null;

  return (
    <div>
      <div className="acct-hero">
        <h1>Settings</h1>
      </div>

      <div className="acct-settings">
        <SettingsSection title="Identity">
          <form onSubmit={handleSaveName} noValidate className="checkout-fields">
            <SettingsField label="Display name">
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </SettingsField>

            <SettingsField label="Email">
              <input
                id="settings-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </SettingsField>

            <SettingsField label="Mobile">
              <div className="acct-static-field">{user.phone}</div>
              <p className="acct-static-hint">Cannot be changed</p>
            </SettingsField>

            <div className="acct-settings-save">
              <button type="submit" className="pill">Save changes</button>
              {nameSaved && <span className="acct-settings-saved">✓ Saved</span>}
            </div>
          </form>
        </SettingsSection>

        <SettingsSection title="Notifications">
          <ToggleSwitch id="notif-drops" checked={notifDrops} onChange={setNotifDrops} label="Drop alerts" />
          <ToggleSwitch id="notif-orders" checked={notifOrders} onChange={setNotifOrders} label="Order updates" />
          <ToggleSwitch id="notif-rewards" checked={notifRewards} onChange={setNotifRewards} label="SP-RR rewards" />
        </SettingsSection>

        <SettingsSection title="Account">
          <InfoRow label="Auth method" value={user.authProvider === 'google' ? 'Google' : 'Phone OTP'} />
          <InfoRow label="Member since" value={new Date(user.memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} />
          <InfoRow label="Referral code" value={user.referralCode} />
        </SettingsSection>

        <SettingsSection title="Session">
          {!showSignOutConfirm ? (
            <button type="button" onClick={() => setShowSignOutConfirm(true)} className="acct-btn-outline">
              Sign out
            </button>
          ) : (
            <div className="acct-confirm">
              <p>Are you sure you want to sign out?</p>
              <div className="acct-confirm__actions">
                <button type="button" onClick={handleSignOut} className="acct-btn-outline">Yes, sign out</button>
                <button type="button" onClick={() => setShowSignOutConfirm(false)} className="acct-confirm__cancel">Cancel</button>
              </div>
            </div>
          )}
        </SettingsSection>

        <SettingsSection title="Danger Zone">
          {!showDeleteConfirm ? (
            <div>
              <p className="acct-danger__text">Permanently remove your account, membership, and SP-RR balance.</p>
              <button type="button" onClick={() => setShowDeleteConfirm(true)} className="acct-btn-danger">
                Delete account
              </button>
            </div>
          ) : (
            <div className="acct-confirm">
              <p className="acct-danger__text">This cannot be undone. All data will be permanently erased.</p>
              <div className="acct-confirm__actions">
                <button type="button" onClick={() => { logout(); router.push('/home'); }} className="acct-btn-danger">
                  Yes, delete everything
                </button>
                <button type="button" onClick={() => setShowDeleteConfirm(false)} className="acct-confirm__cancel">
                  Keep my account
                </button>
              </div>
            </div>
          )}
        </SettingsSection>
      </div>
    </div>
  );
}

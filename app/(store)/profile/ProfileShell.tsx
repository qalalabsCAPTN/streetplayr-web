'use client';

import { ProfileSidebar, ProfileTopTabs } from '@/components/profile/ProfileNav';

export default function ProfileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="listing acct-shell">
      <header className="acct-shell__header">
        <span className="storefront-eyebrow acct-shell__eyebrow">StreetPlayR</span>
        <h1 className="acct-shell__title">Account</h1>
      </header>

      <ProfileTopTabs />

      <div className="acct-layout">
        <ProfileSidebar />
        <main className="acct-content" id="profile-content">
          {children}
        </main>
      </div>
    </div>
  );
}

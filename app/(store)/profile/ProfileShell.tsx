'use client';

import { ProfileSidebar, ProfileTopTabs } from '@/components/profile/ProfileNav';

export default function ProfileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="listing acct-shell">
      <div className="listing__head">
        <h1 className="listing__title">My Account</h1>
      </div>

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

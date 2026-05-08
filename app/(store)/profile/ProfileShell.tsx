'use client';

import { ProfileSidebar, ProfileTabBar } from '@/components/profile/ProfileNav';

export default function ProfileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="profile-root">
        {/* Desktop: sidebar (hidden on mobile via CSS) */}
        <ProfileSidebar />
        {/* Main content area */}
        <main className="profile-content" id="profile-content">
          {children}
        </main>
      </div>
      {/* Mobile: bottom tab bar (fixed position, outside grid) */}
      <ProfileTabBar />
    </>
  );
}

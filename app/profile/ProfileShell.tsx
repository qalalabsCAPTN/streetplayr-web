'use client';

import { ProfileSidebar, ProfileTabBar } from '@/components/profile/ProfileNav';

export default function ProfileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="profile-root">
      {/* Desktop: sidebar + content */}
      <ProfileSidebar />

      <main className="profile-content" id="profile-content">
        {children}
      </main>

      {/* Mobile: bottom tab bar */}
      <ProfileTabBar />
    </div>
  );
}

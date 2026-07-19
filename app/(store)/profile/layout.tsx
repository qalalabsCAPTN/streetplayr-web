import type { Metadata } from 'next';
import ProfileGuard from '@/components/auth/ProfileGuard';
import Navbar from '@/components/layout/Navbar';
import ProfileShell from './ProfileShell';

export const metadata: Metadata = {
  title: 'My Profile | Street PlayR',
  description: 'Your Street PlayR membership identity, wallet, and orders.',
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <ProfileGuard>
        <ProfileShell>{children}</ProfileShell>
      </ProfileGuard>
    </>
  );
}

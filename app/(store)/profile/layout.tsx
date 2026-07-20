import type { Metadata } from 'next';
import ProfileGuard from '@/components/auth/ProfileGuard';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
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
    <div className="profile-layout min-h-screen bg-transparent flex flex-col">
      <Navbar />
      <main className="flex-grow pb-28 md:pb-0">
        <ProfileGuard>
          <ProfileShell>{children}</ProfileShell>
        </ProfileGuard>
      </main>
      <Footer />
    </div>
  );
}

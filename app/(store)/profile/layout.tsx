import type { Metadata } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
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
    <ProtectedRoute>
      <Navbar />
      <ProfileShell>{children}</ProfileShell>
    </ProtectedRoute>
  );
}

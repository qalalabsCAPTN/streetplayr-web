import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DashboardShell } from './DashboardShell';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}

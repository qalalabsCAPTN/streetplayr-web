import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminShell } from './AdminShell';

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}

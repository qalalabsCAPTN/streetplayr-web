'use client';

import { AdminSidebar } from '@/components/admin/AdminNav';

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root">
      <AdminSidebar />
      <main className="admin-content">{children}</main>
    </div>
  );
}

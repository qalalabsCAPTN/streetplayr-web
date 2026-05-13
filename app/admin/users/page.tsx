import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const admin = createAdminClient();
  const { data: profiles } = await admin.from('profiles').select('id, email, full_name, role, created_at').order('created_at', { ascending: false }).limit(100);
  return (
    <div className="admin-page">
      <section className="admin-hero"><h1 className="admin-hero-title">User Management</h1><p className="admin-hero-sub">{profiles?.length ?? 0} profiles</p></section>
      <section className="admin-table-section">
        <table className="admin-table"><thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody>{(profiles ?? []).map((p: any) => (
            <tr key={p.id}><td className="admin-table-mono">{p.email || '—'}</td><td>{p.full_name || '—'}</td>
              <td><span className={`admin-role-badge admin-role-${(p.role || 'member').replace('_', '-')}`}>{p.role || 'member'}</span></td>
              <td className="admin-table-mono">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td></tr>
          ))}</tbody></table>
        {(!profiles || profiles.length === 0) && <div className="dash-empty"><p className="dash-empty-title">No users found</p></div>}
      </section>
    </div>
  );
}

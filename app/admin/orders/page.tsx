import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const admin = createAdminClient();
  const { data: orders } = await admin.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
  return (
    <div className="admin-page">
      <section className="admin-hero"><h1 className="admin-hero-title">Orders</h1><p className="admin-hero-sub">{orders?.length ?? 0} orders</p></section>
      {orders && orders.length > 0 ? (
        <section className="admin-table-section">
          <table className="admin-table"><thead><tr><th>Order #</th><th>Status</th><th>Total</th><th>Date</th></tr></thead>
            <tbody>{(orders as any[]).map((o: any) => (
              <tr key={o.id}><td className="admin-table-mono">{o.order_number || o.id?.slice(0, 8)}</td>
                <td><span className="admin-role-badge">{o.status || 'draft'}</span></td>
                <td>₹{((o.grand_total ?? o.total ?? 0) / 100).toLocaleString()}</td>
                <td className="admin-table-mono">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td></tr>
            ))}</tbody></table>
        </section>
      ) : <div className="dash-empty"><p className="dash-empty-title">No orders found</p></div>}
    </div>
  );
}

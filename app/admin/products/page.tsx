import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const admin = createAdminClient();
  const [productsRes, variantsRes] = await Promise.all([
    admin.from('products').select('*').order('created_at', { ascending: false }).limit(50),
    admin.from('product_variants').select('product_id, stock_quantity, price'),
  ]);
  const products = productsRes.data ?? []; const variants = variantsRes.data ?? [];
  const variantMap: Record<string, { count: number; stock: number }> = {};
  (variants as any[]).forEach((v: any) => {
    if (!variantMap[v.product_id]) variantMap[v.product_id] = { count: 0, stock: 0 };
    variantMap[v.product_id].count++; variantMap[v.product_id].stock += v.stock_quantity ?? 0;
  });
  return (
    <div className="admin-page">
      <section className="admin-hero"><h1 className="admin-hero-title">Products</h1><p className="admin-hero-sub">{products.length} products</p></section>
      {products.length > 0 ? (
        <section className="admin-table-section">
          <table className="admin-table"><thead><tr><th>Title</th><th>Status</th><th>Variants</th><th>Stock</th><th>Created</th></tr></thead>
            <tbody>{(products as any[]).map((p: any) => (
              <tr key={p.id}><td>{p.title || 'Untitled'}</td><td><span className="admin-role-badge">{p.status || 'draft'}</span></td>
                <td>{variantMap[p.id]?.count ?? 0}</td><td>{variantMap[p.id]?.stock ?? 0}</td>
                <td className="admin-table-mono">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td></tr>
            ))}</tbody></table>
        </section>
      ) : <div className="dash-empty"><p className="dash-empty-title">No products found</p></div>}
    </div>
  );
}

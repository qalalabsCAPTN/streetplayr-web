import { getOrderAction } from '@/app/actions/order';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getOrderAction(id);
  if (!result.success || !result.data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const order = result.data;
  const ship = order.shippingAddress as Record<string, string>;
  const rows = order.items
    .map(
      (item) =>
        `<tr><td>${item.productTitle ?? item.productId}</td><td>${item.quantity}</td><td>INR ${item.price}</td></tr>`
    )
    .join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${order.orderNumber}</title></head>
<body>
<h1>StreetPlayR invoice</h1>
<p>Order ${order.orderNumber}</p>
<p>Status: ${order.status} · Payment: ${order.paymentStatus ?? 'pending'}</p>
<p>Bill to: ${ship.name || ship.email || 'Customer'}</p>
<p>${ship.line1 || ship.address_line_1 || ''} ${ship.city || ''} ${ship.postalCode || ship.pincode || ''} ${ship.country || ''}</p>
<table border="1" cellpadding="6" cellspacing="0">
<thead><tr><th>Item</th><th>Qty</th><th>Unit</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<p>Subtotal INR ${order.subtotal}</p>
<p>Shipping INR ${order.shippingCost}</p>
<p>Tax INR ${order.taxAmount}</p>
<p>Discount INR ${order.discountTotal ?? 0}</p>
<h2>Grand total INR ${order.total}</h2>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="streetplayr-invoice-${order.orderNumber}.html"`,
      'Cache-Control': 'no-store',
    },
  });
}

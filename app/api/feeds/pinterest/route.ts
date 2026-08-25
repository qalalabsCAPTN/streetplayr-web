import { NextResponse } from 'next/server';
import { ProductQueries } from '@/lib/products/queries';

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET() {
  const products = await ProductQueries.getCatalogProducts();
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://streetplayr.com';

  const header = [
    'id',
    'title',
    'description',
    'link',
    'image_link',
    'price',
    'availability',
    'brand',
  ].join(',');

  const rows = products.map((p) => {
    const url = `${base}/product/${encodeURIComponent(p.slug)}`;
    const image = p.image.startsWith('http') ? p.image : `${base}${p.image}`;
    return [
      csvCell(p.id),
      csvCell(p.name),
      csvCell((p.description || p.name).slice(0, 5000)),
      csvCell(url),
      csvCell(image),
      csvCell(`${p.price} INR`),
      csvCell('in stock'),
      csvCell('StreetplayR'),
    ].join(',');
  });

  return new NextResponse([header, ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

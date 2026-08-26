import { NextResponse } from 'next/server';
import { ProductQueries } from '@/lib/products/queries';
import { getAvailableInventory } from '@/lib/inventory';

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET() {
  const products = await ProductQueries.getCatalogProducts();
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://streetplayr.com';

  const items = (
    await Promise.all(
      products.map(async (p) => {
        const variants = p.variants ?? [];
        let available = 0;
        if (variants.length) {
          const stocks = await Promise.all(variants.map((v) => getAvailableInventory(v.id)));
          available = stocks.reduce((s, n) => s + n, 0);
        }
        const availability = available > 0 ? 'in stock' : 'out of stock';
        const url = `${base}/product/${encodeURIComponent(p.slug)}`;
        const image = p.image.startsWith('http') ? p.image : `${base}${p.image}`;
        const title = xmlEscape(p.name);
        const desc = xmlEscape((p.description || p.name).slice(0, 5000));
        return `<item>
        <g:id>${xmlEscape(p.id)}</g:id>
        <g:title>${title}</g:title>
        <g:description>${desc}</g:description>
        <g:link>${xmlEscape(url)}</g:link>
        <g:image_link>${xmlEscape(image)}</g:image_link>
        <g:availability>${availability}</g:availability>
        <g:price>${p.price} INR</g:price>
        <g:brand>StreetplayR</g:brand>
        <g:condition>new</g:condition>
      </item>`;
      })
    )
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>StreetplayR Product Feed</title>
    <link>${xmlEscape(base)}</link>
    <description>StreetplayR apparel catalog</description>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

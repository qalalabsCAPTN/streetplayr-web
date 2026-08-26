import { MetadataRoute } from 'next';
import { ProductQueries } from '@/lib/products/queries';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://streetplayr.com';

  const staticRoutes = [
    '',
    '/home',
    '/contact',
    '/collections',
    '/shop',
    '/about',
    '/faq',
    '/lookbook',
    '/shipping-policy',
    '/refund-policy',
    '/privacy-policy',
    '/terms',
    '/exchanges',
    '/collaborations',
    '/stores',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' || route === '/home' ? 1.0 : 0.8,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await ProductQueries.getCatalogProducts();
    productRoutes = products.map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: new Date(product.createdAt || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (err) {
    console.warn('[sitemap] catalog load failed:', err);
  }

  return [...staticRoutes, ...productRoutes];
}

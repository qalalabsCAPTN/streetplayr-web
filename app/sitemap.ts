import { MetadataRoute } from 'next';
import { LOCAL_PRODUCTS } from '@/lib/products/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://streetplayr.com';

  const staticRoutes = [
    '',
    '/home',
    '/about',
    '/contact',
    '/collections',
    '/shop',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' || route === '/home' ? 1.0 : 0.8,
  }));

  const productRoutes = LOCAL_PRODUCTS.map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}

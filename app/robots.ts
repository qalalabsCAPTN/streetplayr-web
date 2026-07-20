import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/ops/', '/api/'],
    },
    sitemap: 'https://streetplayr.com/sitemap.xml',
  };
}

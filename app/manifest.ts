import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'STREET playR',
    short_name: 'STREET playR',
    description: 'StreetplayR - Enter The Play. Exclusive drops, luxury streetwear membership.',
    start_url: '/home',
    display: 'standalone',
    background_color: '#16111b',
    theme_color: '#16111b',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

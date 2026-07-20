import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Street PlayR',
    short_name: 'StreetPlayR',
    description: 'Street PlayR - Enter The Play. Exclusive drops, luxury streetwear membership.',
    start_url: '/',
    display: 'standalone',
    background_color: '#16111b',
    theme_color: '#ddb7ff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}

import type { MetadataRoute } from 'next';
import { publicEnv } from '@/shared/config/env.public';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/checkout', '/carrito', '/pedido/'],
      },
    ],
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
    host: new URL(publicEnv.siteUrl).host,
  };
}

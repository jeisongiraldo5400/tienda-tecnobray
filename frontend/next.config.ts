import type { NextConfig } from 'next';
import { isLocalHost, parseImageHosts } from './src/shared/config/image-hosts';

const remotePatterns = parseImageHosts(process.env.NEXT_IMAGE_REMOTE_HOSTS);
const isProd = process.env.NODE_ENV === 'production';
// MinIO/S3 local (127.0.0.1) solo se permite fuera de producción (Next 16 bloquea IPs locales).
const allowLocal = !isProd && remotePatterns.some((p) => isLocalHost(p.hostname));

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowLocalIP: allowLocal,
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};

export default nextConfig;

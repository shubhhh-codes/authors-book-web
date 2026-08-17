import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Gzip/Brotli compression for all responses
  compress: true,

  // ✅ Tree-shake Three.js — only bundle what's actually imported
  experimental: {
    optimizePackageImports: ['three'],
  },

  // ✅ Serve WebP/AVIF instead of JPEG/PNG; 1-year cache for processed images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },

  // ✅ HTTP cache headers — products API cached at edge
  async headers() {
    return [
      {
        // Public catalog: 1 min edge cache, serve stale for 5 min while revalidating
        source: '/api/products/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        // Shelf books: 1 min edge cache
        source: '/api/shelf-books',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        // Homepage data: 5 min edge cache
        source: '/api/homepage',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=3600',
          },
        ],
      },
    ];
  },

  // ✅ Dev origins — keep for local network access
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    'localhost',
    '127.0.0.1',
    '10.255.163.178',
    '10.255.163.2',
  ],
};

export default nextConfig;

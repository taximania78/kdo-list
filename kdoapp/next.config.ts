import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname:
          process.env.NODE_ENV === 'production' ? 'kdo-api' : 'localhost',
        port: '8000',
        pathname: '/api/kdos/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/kdos/:path*',
        destination:
          process.env.NODE_ENV === 'production'
            ? 'http://fastapi:8000/api/kdos/:path*'
            : 'http://localhost:8000/api/kdos/:path*',
      },
    ];
  },
};

export default nextConfig;

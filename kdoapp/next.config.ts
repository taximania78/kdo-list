import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'fastapi', // ⬅ même nom que ci‑dessus
        port: '8000',
        pathname: '/api/kdos/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/kdos/:path*',
        destination: 'http://fastapi:8000/api/kdos/:path*',
      },
    ];
  },
};

export default nextConfig;

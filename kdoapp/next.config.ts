import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // si ApiAdress pointe sur localhost:3000
    domains: ['localhost'],
    // ou, plus finement (Next 13.4+)
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/kdos/**',
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from 'next';

const serverActionsAllowedOrigins = [
  'localhost:9002',
  '127.0.0.1:9002',
  '*.devtunnels.ms',
  '*.brs.devtunnels.ms',
  ...(process.env.NEXT_SERVER_ACTIONS_ALLOWED_ORIGINS
    ? process.env.NEXT_SERVER_ACTIONS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : []),
];

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: serverActionsAllowedOrigins,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'logopng.com.br',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  allowedDevOrigins: ['192.168.1.2'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;

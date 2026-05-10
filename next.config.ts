import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  allowedDevOrigins: ['192.168.1.2'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ['service.ntsexp.site', 'service.ntsexp.local'],
    },
  },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;

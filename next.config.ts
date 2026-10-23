import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // unpdf/pdf.js should stay a normal server dependency rather than being bundled.
  serverExternalPackages: ['unpdf'],
};

export default nextConfig;

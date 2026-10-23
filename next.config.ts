import type { NextConfig } from 'next';

/** The one deployment that has the database, GitHub sign-in and email settings. */
const CANONICAL = 'https://immxrsive-platform.vercel.app';

const nextConfig: NextConfig = {
  // unpdf/pdf.js should stay a normal server dependency rather than being bundled.
  serverExternalPackages: ['unpdf'],

  // Our Release 2 Moodle submission listed a second Vercel project's address.
  // Send anyone using that old address to the main deployment so links keep working.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'immxrsive-platform-o787.vercel.app' }],
        destination: `${CANONICAL}/:path*`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

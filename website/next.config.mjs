import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output: standalone is fine for Hostinger VPS deployment
  output: 'standalone',
  // Allow large body for slip uploads later
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
};

export default withNextIntl(nextConfig);

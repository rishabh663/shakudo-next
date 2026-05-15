/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.prod.website-files.com' },
      { protocol: 'https', hostname: 'uploads-ssl.webflow.com' },
    ],
  },
  async redirects() {
    return [
      { source: '/', destination: '/stack-builder', permanent: false },
    ];
  },
};

module.exports = nextConfig;

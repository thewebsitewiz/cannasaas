/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/graphql', destination: 'http://localhost:3000/graphql' },
      { source: '/v1/:path*', destination: 'http://localhost:3000/v1/:path*' },
    ];
  },
};

module.exports = nextConfig;

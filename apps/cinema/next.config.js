/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
  webpack: (config, { isServer }) => {
    return config;
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    cpus: 1,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
  webpack: (config) => {
    config.parallelism = 1;
    return config;
  },
};

module.exports = nextConfig;

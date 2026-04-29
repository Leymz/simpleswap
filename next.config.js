/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      http2: false,
      stream: false,
      zlib: false,
      https: false,
      http: false,
    };
    return config;
  },
};

module.exports = nextConfig;
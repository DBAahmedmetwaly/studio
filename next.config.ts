
import type { NextConfig } from 'next';
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheStartUrl: false,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true,
    dynamicRoutesToCaches: [
      {
        urlPattern: /\/$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'start-url',
          expiration: {
            maxEntries: 1,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer, dev, turbopack }) => {
    // Apply custom webpack configurations only when not using Turbopack
    if (!turbopack) {
      // Add a rule to handle .node files
      config.module.rules.push({
        test: /\.node$/,
        use: 'node-loader',
      });

      // Fix for require.extensions error with certain packages like handlebars
      config.resolve.alias = {
        ...config.resolve.alias,
        'handlebars': 'handlebars/dist/cjs/handlebars',
      };
    }

    return config;
  },
};

export default withPWA(nextConfig);

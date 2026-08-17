import { defineConfig } from './src/libs/next/config/define-config';

const isVercel = !!process.env.VERCEL_ENV;

const nextConfig = defineConfig({
  experimental: {
    webpackBuildWorker: true,
    webpackMemoryOptimizations: true,
  },
  // Vercel serverless optimization: exclude musl binaries
  // Vercel uses Amazon Linux (glibc), not Alpine Linux (musl)
  // This saves ~45MB (29MB canvas-musl + 16MB sharp-musl)
  outputFileTracingExcludes: isVercel
    ? {
        '*': [
          'node_modules/.pnpm/@napi-rs+canvas-*-musl*',
          'node_modules/.pnpm/@img+sharp-libvips-*musl*',
        ],
      }
    : undefined,
  webpack: (webpackConfig, context) => {
    const { dev } = context;
    if (!dev) {
      webpackConfig.cache = false;
    }

    // Suppress known warnings from next-auth beta / jose using Node.js-only APIs
    // in Edge Runtime context. These are harmless — jose handles this gracefully at runtime.
    // refs: https://github.com/nextauthjs/next-auth/issues/9382
    webpackConfig.ignoreWarnings = [
      ...(webpackConfig.ignoreWarnings || []),
      {
        module: /next-auth.*jose.*deflate\.js/,
        message: /A Node\.js API is used/,
      },
    ];

    return webpackConfig;
  },
});

export default nextConfig;

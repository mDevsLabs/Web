import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const basePath = process.env.IS_DEMO === "1" ? "/demo" : "";
const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

// CSP pragmatique : pas de nonce (incompatible avec cacheComponents/PPR, qui
// sert du HTML statique partagé). Les hôtes externes reflètent les usages
// réels du code (Pyodide jsdelivr, sandbox srcDoc tailwind/unpkg, kroki.io,
// uploads Vercel Blob, stockage S3/R2 des fichiers cloud & avatars,
// images de secours picsum). BotID et le streaming passent par 'self'.
function buildContentSecurityPolicy(): string {
  // Fichiers cloud et avatars servis directement depuis le stockage S3/R2
  // (S3_PUBLIC_URL / S3_PUBLIC_URL_* côté backend Val Town).
  const storageHosts = ["https://s3.z1storage.com", "https://*.r2.dev"];
  const directives: Record<string, string[]> = {
    "base-uri": ["'self'"],
    "connect-src": [
      "'self'",
      "https://cdn.jsdelivr.net",
      "https://kroki.io",
      ...(isDev ? ["ws:", "wss:", "http://localhost:*"] : []),
    ],
    "default-src": ["'self'"],
    "font-src": ["'self'", "data:"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'self'"],
    "frame-src": [
      "'self'",
      "blob:",
      "data:",
      "https://*.public.blob.vercel-storage.com",
      ...storageHosts,
    ],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://*.public.blob.vercel-storage.com",
      "https://avatar.vercel.sh",
      "https://models.dev",
      "https://www.google.com",
      "https://picsum.photos",
      ...storageHosts,
    ],
    "manifest-src": ["'self'"],
    "media-src": [
      "'self'",
      "data:",
      "blob:",
      "https://*.public.blob.vercel-storage.com",
      ...storageHosts,
    ],
    "object-src": ["'none'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "https://cdn.jsdelivr.net",
      "https://cdn.tailwindcss.com",
      "https://unpkg.com",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    "worker-src": ["'self'", "blob:"],
  };

  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(" ")}`)
    .join("; ");
}

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  ...(basePath
    ? {
        assetPrefix: "/demo-assets",
        basePath,
        redirects: async () => [
          {
            basePath: false,
            destination: basePath,
            permanent: false,
            source: "/",
          },
        ],
      }
    : {}),
  cacheComponents: true,
  devIndicators: false,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  experimental: {
    appNewScrollHandler: true,
    cachedNavigations: true,
    inlineCss: true,
    prefetchInlining: true,
    turbopackFileSystemCacheForDev: true,
  },
  async headers() {
    // CSP_REPORT_ONLY=1 permet un premier déploiement en observation seule.
    const cspHeaderKey =
      process.env.CSP_REPORT_ONLY === "1"
        ? "Content-Security-Policy-Report-Only"
        : "Content-Security-Policy";
    return [
      {
        headers: [
          {
            key: cspHeaderKey,
            value: buildContentSecurityPolicy(),
          },
          ...securityHeaders,
        ],
        source: "/(.*)",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
      {
        hostname: "*.public.blob.vercel-storage.com",
        protocol: "https",
      },
      {
        hostname: "models.dev",
        protocol: "https",
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
    incomingRequests: false,
  },
  poweredByHeader: false,
  reactCompiler: true,
};

export default withBotId(nextConfig);

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
  // Origine de l'API mAI, telle que configurée pour le backend. Elle doit être
  // déclarée explicitement dans connect-src : les navigateurs refusent de la
  // déduire, et une politique trop étroite coupe le réseau en silence (des
  // erreurs de console, pas une page d'explication).
  const apiOrigin = (() => {
    try {
      return new URL(
        process.env.NEXT_PUBLIC_MAI_API_URL || "https://mai.val.run"
      ).origin;
    } catch {
      return "https://mai.val.run";
    }
  })();

  // Fichiers cloud et avatars servis directement depuis le stockage S3/R2
  // (S3_PUBLIC_URL / S3_PUBLIC_URL_* côté backend Val Town).
  const storageHosts = ["https://s3.z1storage.com", "https://*.r2.dev"];
  const directives: Record<string, string[]> = {
    "base-uri": ["'self'"],
    "connect-src": [
      "'self'",
      "https://cdn.jsdelivr.net",
      "https://kroki.io",
      // Vibe appelle l'API mAI directement depuis le navigateur (lib/vibe/services/api.ts
      // : `fetch` avec jeton Bearer, flux SSE inclus). Sans cette origine, la
      // timeline, les messages et le temps réel de /vibe seraient bloqués par
      // la politique — le reste de l'application passe par des routes BFF, ce
      // qui explique l'absence de cette origine avant Vibe.
      apiOrigin,
      ...(isDev ? ["ws:", "wss:", "http://localhost:*"] : []),
    ],
    "default-src": ["'self'"],
    "font-src": ["'self'", "data:"],
    "form-action": ["'self'"],
    // `'none'` et non `'self'` : l'application ne doit pas être intégrable dans
    // une iframe tierce. C'est la protection contre le clickjacking que
    // `X-Frame-Options` apporte, mais en moderne — et il est ajouté en doublon
    // plus bas pour les navigateurs anciens.
    "frame-ancestors": ["'none'"],
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
      "https://api.dicebear.com",
      apiOrigin,
      ...storageHosts,
    ],
    "manifest-src": ["'self'"],
    "media-src": [
      "'self'",
      "data:",
      "blob:",
      "https://*.public.blob.vercel-storage.com",
      apiOrigin,
      ...storageHosts,
    ],
    "object-src": ["'none'"],
    // Doit être déclarée à part : `report-uri` est une directive propre, pas un
    // mot-clé acceptant une liste de sources.
    "report-uri": ["/api/security/csp-report"],
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

  // Point de rapport CSP : report-uri /api/security/csp-report
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
    // Redondance assumée avec `frame-ancestors 'none'` pour les navigateurs
    // qui ne comprennent pas CSP. Ni le framework ni le backend ne
    // positionnaient cet en-tête sur l'application.
    key: "X-Frame-Options",
    value: "DENY",
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
    // Tailles réellement rendues. Les valeurs par défaut commencent à 640 px,
    // ce qui fait télécharger une image de 500 Ko à un logo de 24 px.
    deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920],
    // AVIF d'abord : sans `formats`, le défaut est webp seul et le format le
    // plus efficace n'est jamais négocié.
    formats: ["image/avif", "image/webp"],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Aligné sur l'`img-src` de la CSP ci-dessus : les deux listes doivent
    // accepter les mêmes sources, sinon une URL d'avatar autorisée par la CSP
    // échoue à l'optimisation et l'image ne s'affiche pas.
    qualities: [60, 75, 90],
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
      // Stockage des fichiers cloud (S3/R2), déjà autorisé par la CSP.
      {
        hostname: "s3.z1storage.com",
        protocol: "https",
      },
      {
        hostname: "*.r2.dev",
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
  outputFileTracingIncludes: {
    "/changelog": ["./CHANGELOG.md"],
  },
  poweredByHeader: false,
  reactCompiler: true,
  /**
   * Vibe nomme les profils `/@pseudo` : la barre latérale, les notifications,
   * la recherche et le partage construisent tous leurs liens ainsi, et la barre
   * latérale compare même `location.pathname` à `/@pseudo` pour marquer l'onglet
   * actif. `/vibe/@pseudo` doit donc répondre. L'App Router ne peut pas porter
   * un dossier `@[username]` (le préfixe `@` y désigne un slot parallèle) : on
   * réécrit donc vers la route `/vibe/u/[username]`, qui rend la même page.
   * La réécriture laisse l'URL visible en `/vibe/@pseudo` — les liens copiés et
   * partagés restent ceux de Vibe.
   *
   * Les deux chemins d'écriture de chemins (rewrites et basePath) sont
   * préfixés automatiquement par Next en mode démo.
   */
  async rewrites() {
    return [
      {
        destination: "/vibe/u/:username",
        source: "/vibe/@:username",
      },
      // Alias produit : l'application s'appelle « Code » dans le menu du logo
      // et le réglage « Menu favori », mais la route canonique est /coder.
      // Une REWRITE et non une redirection : Next 16 n'accepte ici que les
      // champs source/destination, et l'URL visible reste /code — les liens
      // partagés portent le nom affiché.
      {
        destination: "/coder",
        source: "/code",
      },
      {
        destination: "/coder/:path*",
        source: "/code/:path*",
      },
    ];
  },
};

export default withBotId(nextConfig);

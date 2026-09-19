import "server-only";

// Récupération d'une image distante pour le changement de photo de profil.
// Garde SSRF stricte : HTTPS uniquement, aucune adresse privée/localhost/
// link-local/métadonnées cloud, redirections limitées et revalidées à chaque
// saut, taille plafonnée, timeout, types MIME réellement autorisés (sniff des
// magic bytes, pas de confiance dans l'extension ou le Content-Type seul).
// Aucun cookie, token ou header utilisateur n'est transmis au domaine distant.

export const REMOTE_IMAGE_MAX_BYTES = 10 * 1024 * 1024; // aligné sur /upload-avatar (10 Mo)
export const REMOTE_IMAGE_TIMEOUT_MS = 8000;
export const REMOTE_IMAGE_MAX_REDIRECTS = 3;

export type RemoteImageError =
  | { code: "blocked_host"; message: string }
  | { code: "invalid_url"; message: string }
  | { code: "network"; message: string }
  | { code: "not_an_image"; message: string }
  | { code: "too_large"; message: string }
  | { code: "timeout"; message: string }
  | { code: "too_many_redirects"; message: string };

export type RemoteImage =
  | { ok: true; bytes: Uint8Array; contentType: string }
  | { ok: false; error: RemoteImageError };

export type ImageSourceValidation =
  | { ok: true; url: string }
  | { ok: false; error: RemoteImageError };

// Réseaux interdits (SSRF) : loopback, privés (RFC1918/CGNAT), link-local,
// métadonnées cloud (169.254.169.254), multicast/réservés, IPv4-mappé IPv6.
const BLOCKED_IPV4_PATTERNS: [string, string, string][] = [
  ["0.0.0.0", "0.255.255.255", "réseau non routable"],
  ["10.0.0.0", "10.255.255.255", "réseau privé (10.0.0.0/8)"],
  ["100.64.0.0", "100.127.255.255", "réseau partagé (CGNAT)"],
  ["127.0.0.0", "127.255.255.255", "localhost"],
  ["169.254.0.0", "169.254.255.255", "adresse link-local"],
  ["172.16.0.0", "172.31.255.255", "réseau privé (172.16.0.0/12)"],
  ["192.0.0.0", "192.0.0.255", "réseau réservé IETF"],
  ["192.0.2.0", "192.0.2.255", "plage de documentation TEST-NET-1"],
  ["192.168.0.0", "192.168.255.255", "réseau privé (192.168.0.0/16)"],
  ["198.18.0.0", "198.19.255.255", "réseau de benchmark"],
  ["198.51.100.0", "198.51.100.255", "plage de documentation TEST-NET-2"],
  ["203.0.113.0", "203.0.113.255", "plage de documentation TEST-NET-3"],
  ["224.0.0.0", "239.255.255.255", "adresse multicast"],
  ["240.0.0.0", "255.255.255.255", "plage réservée"],
];

function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return null;
  }
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }
    const n = Number(part);
    if (n > 255) {
      return null;
    }
    value = value * 256 + n;
  }
  return value;
}

function isBlockedIpv4(ip: string): string | null {
  const value = ipv4ToNumber(ip);
  if (value === null) {
    return null;
  }
  for (const [start, end, label] of BLOCKED_IPV4_PATTERNS) {
    const s = ipv4ToNumber(start);
    const e = ipv4ToNumber(end);
    if (s !== null && e !== null && value >= s && value <= e) {
      return label;
    }
  }
  return null;
}

function isBlockedIpv6(ip: string): string | null {
  const lower = ip.toLowerCase();
  const bare = lower.replace(/^\[|\]$/g, "");
  // Loopback, unspecified, link-local fe80::/10, et tout IPv4 encapsulé.
  if (
    bare === "::" ||
    bare === "::1" ||
    bare.startsWith("fe8") ||
    bare.startsWith("fe9") ||
    bare.startsWith("fea") ||
    bare.startsWith("feb")
  ) {
    return "adresse IPv6 non publique";
  }
  if (bare.includes(":ffff:") && bare.includes(".")) {
    const v4 = bare.split(":ffff:")[1];
    if (v4 && isBlockedIpv4(v4)) {
      return "adresse IPv4 encapsulée non publique";
    }
  }
  // fc00::/7 (unique local), fec0::/10 (site-local historique).
  if (/^f[cd]/.test(bare)) {
    return "adresse IPv6 unique-local/site-local";
  }
  return null;
}

// Types MIME réellement autorisés — le sniff des magic bytes reste l'arbitre.
const ALLOWED_MIME_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isAllowedImageMime(mime: string): boolean {
  return ALLOWED_MIME_TYPES.has(mime.toLowerCase());
}

// Validation statique d'une URL d'image fournie par l'utilisateur.
export function parseRemoteImageUrl(rawUrl: string): ImageSourceValidation {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return {
      error: { code: "invalid_url", message: "URL invalide." },
      ok: false,
    };
  }

  if (parsed.protocol !== "https:") {
    return {
      error: {
        code: "invalid_url",
        message: "Seules les URL HTTPS sont acceptées.",
      },
      ok: false,
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    // Littéraux IP (v4 ou v6 entre crochets).
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) ||
    hostname.startsWith("[") ||
    // Credentials dans l'URL : jamais.
    parsed.username ||
    parsed.password
  ) {
    return {
      error: {
        code: "blocked_host",
        message: "Cette adresse est interdite.",
      },
      ok: false,
    };
  }

  if (!parsed.hostname.includes(".")) {
    return {
      error: {
        code: "blocked_host",
        message: "Nom d'hôte invalide.",
      },
      ok: false,
    };
  }

  return { ok: true, url: parsed.toString() };
}

// Arbitre de type réel : magic bytes, jamais l'extension ni le seul
// Content-Type déclaré. Exporté pour la relire des pièces jointes (route
// settings) — mêmes règles, une seule implémentation.
export function sniffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) {
    return null;
  }
  // JPEG : FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  // GIF : GIF87a / GIF89a
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }
  // WebP : RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

function errorFromStatus(status: number): RemoteImageError {
  if (status === 413) {
    return {
      code: "too_large",
      message: "Image distante trop volumineuse (max 10 Mo).",
    };
  }
  if (status === 404 || status === 410) {
    return {
      code: "network",
      message: "Image distante introuvable.",
    };
  }
  return {
    code: "network",
    message: `Le serveur distant a répondu ${status}.`,
  };
}

async function fetchOnce(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMOTE_IMAGE_TIMEOUT_MS);
  try {
    return await fetch(url, {
      // Aucun cookie, token ou header utilisateur transmis au domaine distant.
      headers: { Accept: "image/jpeg,image/png,image/webp,image/gif" },
      redirect: "manual",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRemoteImage(rawUrl: string): Promise<RemoteImage> {
  const validated = parseRemoteImageUrl(rawUrl);
  if (!validated.ok) {
    return { error: validated.error, ok: false };
  }

  let currentUrl = validated.url;

  for (let hop = 0; hop <= REMOTE_IMAGE_MAX_REDIRECTS; hop += 1) {
    let response: Response;
    try {
      response = await fetchOnce(currentUrl);
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      return {
        error: aborted
          ? {
              code: "timeout",
              message: "Délai dépassé lors de la récupération de l'image.",
            }
          : {
              code: "network",
              message: "Impossible de joindre le serveur distant.",
            },
        ok: false,
      };
    }

    // 3xx : revalider la destination AVANT de suivre (anti-rebond SSRF).
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        return {
          error: {
            code: "network",
            message: "Redirection invalide (en-tête Location manquant).",
          },
          ok: false,
        };
      }
      if (hop === REMOTE_IMAGE_MAX_REDIRECTS) {
        return {
          error: {
            code: "too_many_redirects",
            message: "Trop de redirections (max 3).",
          },
          ok: false,
        };
      }
      let next: URL;
      try {
        next = new URL(location, currentUrl);
      } catch {
        return {
          error: { code: "invalid_url", message: "Redirection invalide." },
          ok: false,
        };
      }
      const revalidated = parseRemoteImageUrl(next.toString());
      if (!revalidated.ok) {
        return { error: revalidated.error, ok: false };
      }
      currentUrl = revalidated.url;
      continue;
    }

    if (!response.ok) {
      return { error: errorFromStatus(response.status), ok: false };
    }

    const declaredType = (response.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (declaredType && !isAllowedImageMime(declaredType)) {
      return {
        error: {
          code: "not_an_image",
          message:
            "Le contenu distant n'est pas une image autorisée (JPEG, PNG, WebP ou GIF).",
        },
        ok: false,
      };
    }

    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > REMOTE_IMAGE_MAX_BYTES) {
      return {
        error: {
          code: "too_large",
          message: "Image distante trop volumineuse (max 10 Mo).",
        },
        ok: false,
      };
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length > REMOTE_IMAGE_MAX_BYTES) {
      return {
        error: {
          code: "too_large",
          message: "Image distante trop volumineuse (max 10 Mo).",
        },
        ok: false,
      };
    }

    // Arbitre final : magic bytes réels, jamais l'extension ni le seul
    // Content-Type déclaré. SVG et tout contenu actif sont refusés ici.
    const sniffed = sniffImageMime(bytes);
    if (!sniffed) {
      return {
        error: {
          code: "not_an_image",
          message:
            "Le contenu distant n'est pas une image reconnue (SVG et contenus actifs refusés).",
        },
        ok: false,
      };
    }

    return { bytes, contentType: sniffed, ok: true };
  }

  return {
    error: {
      code: "too_many_redirects",
      message: "Trop de redirections (max 3).",
    },
    ok: false,
  };
}

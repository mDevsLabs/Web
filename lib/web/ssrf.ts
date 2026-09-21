// Protection anti-SSRF partagée par tous les outils sortants.
//
// L'ancienne version était purement lexicale : elle comparait la chaîne de
// l'hôte à des préfixes connus. Elle laissait donc passer
//   • un nom de domaine qui RÉSOUT vers 127.0.0.1 / 169.254.169.254 (rebinding) ;
//   • les encodages alternatifs d'une même adresse (2130706433, 0x7f.1,
//     0177.0.0.1) ;
//   • la plupart des formes IPv6 mappées (::ffff:7f00:1, NAT64 64:ff9b::7f00:1) ;
//   • une redirection vers un réseau privé.
//
// Ce module corrige la classification (toutes les formes sont ramenées à 4 ou
// 8 octets avant décision) et ajoute la résolution DNS : `assertPublicHost`
// refuse un hôte si N'IMPORTE laquelle de ses adresses résolues est privée.
// Le client HTTP (lib/web/safe-fetch.ts) épingle ensuite ces adresses validées
// pour fermer la fenêtre de rebinding.
//
// Testé par tests/unit/ssrf-network.test.ts.

/** Plages bloquées, en notation CIDR IPv4. */
const BLOCKED_IPV4_RANGES: Array<[number, number, string]> = [
  [0x00000000, 0xff000000, "0.0.0.0/8 (réseau source)"],
  [0x0a000000, 0xff000000, "10.0.0.0/8 (privé)"],
  [0x64400000, 0xffc00000, "100.64.0.0/10 (CGNAT)"],
  [0x7f000000, 0xff000000, "127.0.0.0/8 (loopback)"],
  [0xa9fe0000, 0xffff0000, "169.254.0.0/16 (link-local, métadonnées cloud)"],
  [0xac100000, 0xfff00000, "172.16.0.0/12 (privé)"],
  [0xc0000000, 0xffffff00, "192.0.0.0/24 (IETF)"],
  [0xc0000200, 0xffffff00, "192.0.2.0/24 (documentation)"],
  [0xc0586300, 0xffffff00, "192.88.99.0/24 (relais 6to4)"],
  [0xc0a80000, 0xffff0000, "192.168.0.0/16 (privé)"],
  [0xc6120000, 0xfffe0000, "198.18.0.0/15 (benchmark)"],
  [0xc6336400, 0xffffff00, "198.51.100.0/24 (documentation)"],
  [0xcb007100, 0xffffff00, "203.0.113.0/24 (documentation)"],
  [0xe0000000, 0xf0000000, "224.0.0.0/4 (multicast)"],
  [0xf0000000, 0xf0000000, "240.0.0.0/4 (réservé)"],
  [0xffffffff, 0xffffffff, "255.255.255.255 (broadcast)"],
];

/** Suffixes de noms internes/cluster : jamais résolubles vers l'extérieur. */
const BLOCKED_HOST_SUFFIXES = [
  ".cluster.local",
  ".internal",
  ".lan",
  ".local",
  ".localhost",
  ".home.arpa",
];

/** Hôtes explicitement interdits (métadonnées cloud, DNS du cluster). */
const BLOCKED_HOSTNAMES = new Set([
  "instance-data",
  "kubernetes.default",
  "metadata",
  "metadata.google.internal",
]);

function parseDecPart(part: string): number | null {
  if (!part) {
    return null;
  }
  let value: number;
  if (/^0x[0-9a-f]+$/i.test(part)) {
    value = Number.parseInt(part.slice(2), 16);
  } else if (/^0[0-7]+$/.test(part)) {
    value = Number.parseInt(part.slice(1), 8);
  } else if (/^[0-9]+$/.test(part)) {
    value = Number.parseInt(part, 10);
  } else {
    return null;
  }
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

/**
 * Ramène toutes les écritures d'une adresse IPv4 à 4 octets :
 * `127.0.0.1`, `127.1`, `0x7f.1`, `0177.0.0.1`, `2130706433`.
 */
export function parseIpv4ToBytes(host: string): number[] | null {
  const clean = host.trim().replace(/\.$/, "");
  if (!clean || clean.includes(":")) {
    return null;
  }
  const parts = clean.split(".");
  if (parts.length > 4) {
    return null;
  }
  const values = parts.map(parseDecPart);
  if (values.some((v) => v === null)) {
    return null;
  }
  const nums = values as number[];

  if (nums.length === 1) {
    if (nums[0] > 0xffffffff) {
      return null;
    }
    return [
      (nums[0] >>> 24) & 0xff,
      (nums[0] >>> 16) & 0xff,
      (nums[0] >>> 8) & 0xff,
      nums[0] & 0xff,
    ];
  }

  // Formes abrégées : `a.b` → a.(b>>16).(b>>8).b ; `a.b.c` → a.b.(c>>8).c
  const last = nums.at(-1) as number;
  const head = nums.slice(0, -1);
  const tailLength = 4 - head.length;
  if (last >= 256 ** tailLength) {
    return null;
  }
  const tail = Array.from({ length: tailLength }, (_, index) =>
    (last >>> (8 * (tailLength - 1 - index))) & 0xff
  );
  const bytes = [...head, ...tail];
  if (bytes.some((byte) => byte > 255)) {
    return null;
  }
  return bytes;
}

/** `true` si l'adresse IPv4 (4 octets) appartient à une plage interdite. */
export function isBlockedIpv4Bytes(bytes: readonly number[]): string | null {
  const value =
    ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  for (const [network, mask, label] of BLOCKED_IPV4_RANGES) {
    if ((value & mask) >>> 0 === network) {
      return label;
    }
  }
  return null;
}

/**
 * Décision pour une adresse littérale (IPv4 sous toutes ses formes, IPv6 sous
 * forme canonique ou mappée). Renvoie le libellé de la plage bloquée, ou null.
 */
export function blockedIpReason(rawHost: string): string | null {
  const host = rawHost.trim().replace(/^\[|\]$/g, "").toLowerCase();
  if (!host) {
    return "hôte vide";
  }

  const ipv4 = parseIpv4ToBytes(host);
  if (ipv4) {
    return isBlockedIpv4Bytes(ipv4);
  }

  if (!host.includes(":")) {
    return null; // nom de domaine : traité par la résolution DNS
  }

  // IPv6 : on teste les formes mappées (dont NAT64) puis les préfixes locaux.
  const mapped = host.match(/^(?:::ffff:|::|64:ff9b::)(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) {
    const inner = parseIpv4ToBytes(mapped[1]);
    if (inner) {
      const reason = isBlockedIpv4Bytes(inner);
      if (reason) {
        return `${reason} (IPv4 mappée)`;
      }
    }
  }

  // Forme hexadécimale mappée : ::ffff:7f00:1
  const hexMapped = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexMapped) {
    const value = Number.parseInt(hexMapped[1], 16);
    const low = Number.parseInt(hexMapped[2], 16);
    const reason = isBlockedIpv4Bytes([
      (value >> 8) & 0xff,
      value & 0xff,
      (low >> 8) & 0xff,
      low & 0xff,
    ]);
    if (reason) {
      return `${reason} (IPv4 mappée en hexadécimal)`;
    }
  }

  if (host === "::" || host === "::1" || host === "0:0:0:0:0:0:0:1") {
    return "IPv6 non spécifiée / loopback";
  }
  if (/^fe[89ab][0-9a-f]:/.test(host)) {
    return "fe80::/10 (link-local IPv6)";
  }
  if (/^f[cd][0-9a-f]{2}:/.test(host)) {
    return "fc00::/7 (adresse locale unique IPv6)";
  }
  return null;
}

/**
 * Vérification lexicale (sans réseau) : hôtes réservés, littéraux IP et
 * formes encodées. Conservée pour les appels synchrones ; toute décision
 * d'accès doit passer par `assertPublicHost` (résolution DNS incluse).
 */
export function isPrivateOrBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim().replace(/^\[|\]$/g, "");
  if (!host) {
    return true;
  }
  if (BLOCKED_HOSTNAMES.has(host)) {
    return true;
  }
  if (host === "localhost" || host.endsWith(".localhost")) {
    return true;
  }
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return true;
  }
  return blockedIpReason(host) !== null;
}

export type SafeUrlResult = { error: string; url?: undefined } | { error?: undefined; url: URL };

/**
 * Normalise une URL utilisateur et refuse les schémas/hôtes dangereux.
 *
 * L'ancienne version faisait `raw.startsWith("http") ? raw : "https://" + raw` :
 * `file:///etc/passwd` ne commençait pas par « http » et devenait donc
 * `https://file:///etc/passwd` — un schéma dangereux était silencieusement
 * réécrit en requête réseau au lieu d'être refusé. Un schéma explicite est
 * désormais identifié puis rejeté s'il n'est pas http(s).
 */
export function safeExternalUrl(raw: string): SafeUrlResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: "URL vide." };
  }

  // `scheme://` explicite (file, gopher, ftp…) ou `scheme:` sans « // »
  // (`javascript:`, `data:`), en excluant `hote:port` où le « : » est suivi
  // de chiffres.
  const explicitScheme = trimmed.match(
    /^([a-z][a-z0-9+.-]*):(?:\/\/|(?!\d))/i
  );
  let candidate = trimmed;
  if (explicitScheme) {
    const scheme = explicitScheme[1].toLowerCase();
    if (scheme !== "http" && scheme !== "https") {
      return {
        error: `Protocole non autorisé (${scheme}). Seuls HTTP et HTTPS sont acceptés.`,
      };
    }
  } else {
    candidate = `https://${trimmed}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(candidate);
  } catch {
    return { error: `URL invalide : "${raw}".` };
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return {
      error: "Protocole non autorisé. Seuls HTTP et HTTPS sont acceptés.",
    };
  }
  // Les identifiants dans l'URL sont refusés : ils finiraient dans des logs de
  // proxy et permettent de contourner une règle d'authentification en amont.
  if (parsedUrl.username || parsedUrl.password) {
    return {
      error: "URL avec identifiants refusée (utilisez un en-tête d'autorisation).",
    };
  }
  if (parsedUrl.port && !["", "80", "443", "8080", "8443"].includes(parsedUrl.port)) {
    return {
      error: `Port non autorisé (${parsedUrl.port}) : seuls 80, 443, 8080 et 8443 sont acceptés.`,
    };
  }
  if (isPrivateOrBlockedHost(parsedUrl.hostname)) {
    return {
      error:
        "Accès refusé pour des raisons de sécurité (adresse IP privée, locale ou métadonnées internes).",
    };
  }

  return { url: parsedUrl };
}

/** Paramètres de requête jamais transmis à un service tiers. */
const THIRD_PARTY_SECRET_PARAMS =
  /^(access[-_]?token|api[-_]?key|apikey|auth|authorization|code|credential|key|password|passwd|pwd|refresh[-_]?token|secret|session|sig|signature|token)$/i;

/**
 * Prépare une URL pour un service tiers (capture, aperçu, raccourcisseur) : les
 * paramètres ressemblant à un secret sont masqués. Un service externe ne doit
 * pas recevoir le jeton de session présent dans une URL signée ou un lien de
 * réinitialisation.
 */
export function redactUrlForThirdParty(raw: string): string {
  try {
    const parsed = new URL(raw);
    for (const name of [...parsed.searchParams.keys()]) {
      if (THIRD_PARTY_SECRET_PARAMS.test(name)) {
        parsed.searchParams.set(name, "***");
      }
    }
    return parsed.toString();
  } catch {
    return raw;
  }
}

export type ResolvedHost = {
  addresses: string[];
  url: URL;
};

type Resolver = (hostname: string) => Promise<string[]>;

async function defaultResolver(hostname: string): Promise<string[]> {
  const dns = await import("node:dns/promises");
  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
}

/**
 * Valide une URL PUIS résout son hôte. Toutes les adresses obtenues doivent
 * être publiques : une seule adresse privée fait échouer la requête. Les
 * adresses validées sont renvoyées pour être épinglées par le client HTTP
 * (`safe-fetch`), ce qui empêche la réponse DNS de changer entre la
 * vérification et la connexion (DNS rebinding).
 */
export async function validateAndResolveUrl(
  raw: string,
  options: { resolver?: Resolver } = {}
): Promise<{ error: string; host?: undefined } | { error?: undefined; host: ResolvedHost }> {
  const checked = safeExternalUrl(raw);
  if (checked.error !== undefined) {
    return { error: checked.error };
  }
  const url = checked.url;

  // Littéral IP : la résolution est inutile.
  if (blockedIpReason(url.hostname) !== null || parseIpv4ToBytes(url.hostname)) {
    return { error: "Adresse IP non autorisée." };
  }

  const resolver = options.resolver ?? defaultResolver;
  let addresses: string[];
  try {
    addresses = await resolver(url.hostname);
  } catch {
    return { error: `Résolution DNS impossible pour ${url.hostname}.` };
  }
  if (addresses.length === 0) {
    return { error: `Aucune adresse pour ${url.hostname}.` };
  }
  for (const address of addresses) {
    const reason =
      blockedIpReason(address) ??
      (parseIpv4ToBytes(address)
        ? isBlockedIpv4Bytes(parseIpv4ToBytes(address) as number[])
        : null);
    if (reason) {
      return {
        error: `Hôte ${url.hostname} résolu vers une adresse interdite (${reason}).`,
      };
    }
  }
  return { host: { addresses, url } };
}

/** Limite de redirections suivies (chacune intégralement revalidée). */
export const MAX_REDIRECTS = 3;

/**
 * Résout une redirection RELATIVE par rapport à l'URL courante. Retourne
 * `null` si la cible n'est pas http(s) : jamais de `file:`, `ftp:` ou `data:`
 * atteint depuis un `Location:` fourni par un tiers.
 */
export function resolveRedirectTarget(
  location: string,
  currentUrl: string
): URL | null {
  try {
    const next = new URL(location, currentUrl);
    if (!["http:", "https:"].includes(next.protocol)) {
      return null;
    }
    return next;
  } catch {
    return null;
  }
}

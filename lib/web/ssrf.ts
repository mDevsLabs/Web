// Protection anti-SSRF partagée par les outils web (read-url, web-capture).
export function isPrivateOrBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();

  // Hostnames réservés / locaux
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan")
  ) {
    return true;
  }

  // Vérification des adresses IPv4
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1, 5).map(Number);
    if (octets.some((o) => o > 255)) return true; // IP invalide

    // 0.0.0.0/8 (Broadcast/source)
    if (octets[0] === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (octets[0] === 127) return true;
    // 10.0.0.0/8 (Privé)
    if (octets[0] === 10) return true;
    // 172.16.0.0/12 (Privé: 172.16.0.0 à 172.31.255.255)
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
    // 192.168.0.0/16 (Privé)
    if (octets[0] === 192 && octets[1] === 168) return true;
    // 169.254.0.0/16 (Link-local & Métadonnées AWS/GCP/Azure)
    if (octets[0] === 169 && octets[1] === 254) return true;
    // 100.64.0.0/10 (CGNAT)
    if (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127) return true;
  }

  // IPv6 (entre crochets ou brutes)
  const cleanIpv6 = host.replace(/^\[|\]$/g, "");
  if (
    cleanIpv6 === "::1" ||
    cleanIpv6 === "::" ||
    cleanIpv6.startsWith("fe80:") ||
    cleanIpv6.startsWith("fc00:") ||
    cleanIpv6.startsWith("fd") ||
    cleanIpv6.includes("::ffff:127.") ||
    cleanIpv6.includes("::ffff:10.") ||
    cleanIpv6.includes("::ffff:192.168.")
  ) {
    return true;
  }

  return false;
}

/** Normalise une URL utilisateur et refuse les schémas/hôtes dangereux. */
export function safeExternalUrl(raw: string): { error?: string; url?: URL } {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return { error: `URL invalide : "${raw}".` };
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return {
      error: "Protocole non autorisé. Seuls HTTP et HTTPS sont acceptés.",
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

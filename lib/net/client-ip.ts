/**
 * Détermination de l'adresse cliente derrière le proxy de bord.
 *
 * Sur Vercel, `x-forwarded-for` est renseigné par la plateforme : la DERNIÈRE
 * entrée est l'adresse observée par le dernir proxy de confiance. Lire la
 * première revenait à lire une valeur entièrement contrôlée par le client :
 * un attaquant changeait d'en-tête à chaque requête et contournait les seaux.
 *
 * Module pur (aucun import serveur) pour être partagé et testé.
 */

const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /^[0-9a-f:]+$/i;

export function normalizeIp(value: string | null | undefined): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  let candidate = raw;
  if (candidate.startsWith("[")) {
    const closing = candidate.indexOf("]");
    candidate = closing > 0 ? candidate.slice(1, closing) : candidate;
  } else if (candidate.includes(":")) {
    // « 198.51.100.4:8080 » : le suffixe est un port, pas une adresse IPv6.
    const lastColon = candidate.lastIndexOf(":");
    const hostPart = candidate.slice(0, lastColon);
    const portPart = candidate.slice(lastColon + 1);
    if (IPV4_RE.test(hostPart) && /^\d+$/.test(portPart)) {
      candidate = hostPart;
    }
  }
  candidate = candidate.trim();
  if (IPV4_RE.test(candidate)) {
    const octets = candidate.split(".").map(Number);
    if (octets.every((o) => Number.isInteger(o) && o >= 0 && o <= 255)) {
      return candidate;
    }
    return null;
  }
  if (IPV6_RE.test(candidate) && candidate.includes(":")) {
    return candidate.toLowerCase();
  }
  return null;
}

type HeaderSource = {
  get: (name: string) => string | null;
};

export function getClientIp(headers: HeaderSource): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => normalizeIp(part))
      .filter((value): value is string => Boolean(value));
    const last = parts.at(-1);
    if (last) {
      return last;
    }
  }
  return normalizeIp(headers.get("x-real-ip")) || "unknown";
}

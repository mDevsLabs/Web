/**
 * Helpers média partagés (client et serveur).
 * Volontairement sans dépendance Node : ce module est importé par des
 * composants clients autant que par la couche actualités.
 */

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogv", ".ogg"];

export type MediaKind = "image" | "video";

export type MediaSource = { src: string; kind: MediaKind };

/** Détecte une vidéo à partir de l'extension de l'URL (ou du préfixe data:video/). */
export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  if (clean.startsWith("data:video/")) return true;
  return VIDEO_EXTENSIONS.some((extension) => clean.endsWith(extension));
}

/**
 * Détermine le type de média d'une source : une vidéo si l'URL en est une
 * (ou si le type est forcé), sinon une image.
 */
export function getMediaSource(
  source: { image?: string; imageType?: MediaKind } | null | undefined
): MediaSource | null {
  if (!source?.image) return null;
  const kind: MediaKind =
    source.imageType === "video" || isVideoUrl(source.image)
      ? "video"
      : "image";
  return { kind, src: source.image };
}

/** Identifiants de vidéo YouTube : 11 caractères [A-Za-z0-9_-]. */
const YOUTUBE_ID_RE = /^[\w-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/**
 * Détecte une URL YouTube et en extrait l'identifiant de vidéo.
 *
 * Pourquoi : une carte d'actualité pointait vers un fichier vidéo local retiré
 * du dépôt (plus de 140 Mo) et rendait une boîte blanche. Les présentations
 * vivent désormais sur YouTube (comme la page Modèles) ; ce helper permet au
 * rendu média de basculer sur l'iframe au lieu d'un lecteur HTML5 sans source.
 */
export function youTubeIdFromUrl(url?: string | null): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // URL relative ou invalide : ce n'est pas une vidéo YouTube absolue.
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").find(Boolean) ?? "";
    return YOUTUBE_ID_RE.test(id) ? id : null;
  }
  if (!YOUTUBE_HOSTS.has(host)) return null;

  if (parsed.pathname === "/watch") {
    const id = parsed.searchParams.get("v") ?? "";
    return YOUTUBE_ID_RE.test(id) ? id : null;
  }

  const match = parsed.pathname.match(
    /^\/(?:embed|shorts|live|v)\/([\w-]{11})(?:\/|$)/
  );
  return match ? match[1] : null;
}

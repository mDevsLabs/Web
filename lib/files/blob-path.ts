/**
 * Références DURABLES des pièces jointes de chat.
 *
 * L'upload renvoie une URL signée valable 10 minutes. Cette URL ne doit jamais
 * être la seule référence persistée : après 10 minutes, un ancien message
 * afficherait une image morte et une régénération transmettrait une URL
 * expirée au fournisseur. Le `pathname` du blob privé est la référence durable ;
 * le serveur en réémet une URL signée courte à la lecture et avant l'envoi au
 * modèle, après vérification de propriété (`uploads/<userId>/…`).
 *
 * Ce module est volontairement sans `server-only` : il est partagé avec le
 * client pour dériver le pathname d'un blob et tester la propriété.
 */

const BLOB_HOST_RE = /(^|\.)blob\.vercel-storage\.com$/i;

export function isVercelBlobUrl(rawUrl: string): boolean {
  try {
    return BLOB_HOST_RE.test(new URL(rawUrl).hostname);
  } catch {
    return false;
  }
}

/** Pathname d'un blob Vercel (sans slash initial), ou null. */
export function blobPathnameFromUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!BLOB_HOST_RE.test(url.hostname)) {
    return null;
  }
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  const clean = pathname.replace(/^\/+/, "");
  return clean.startsWith("uploads/") ? clean : null;
}

/** Vrai si le chemin appartient au préfixe d'upload de CE compte. */
export function isBlobPathnameOwnedBy(
  pathname: string,
  userId: string
): boolean {
  const cleanUser = String(userId || "").trim();
  if (!cleanUser) return false;
  const normalized = String(pathname || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  if (!normalized.startsWith("uploads/")) return false;
  if (
    normalized.split("/").some((segment) => segment === ".." || segment === ".")
  ) {
    return false;
  }
  return normalized.startsWith(`uploads/${cleanUser}/`);
}

type MessageLike = {
  parts?: unknown;
  [key: string]: unknown;
};

type FilePartLike = {
  pathname?: unknown;
  type?: unknown;
  url?: unknown;
  [key: string]: unknown;
};

/**
 * Remplace les URL de blobs expirées par des URL fraîches, dans les parties
 * `file` des messages. Seuls les blobs du compte sont resignés ; les autres
 * URL (externes, Cloud Z1…) restent intactes.
 *
 * Le signataire est injecté : la production utilise `issueSignedToken` +
 * `presignUrl`, les tests une horloge contrôlée.
 */
export async function refreshBlobAttachmentUrls<T extends MessageLike>(
  messages: T[],
  userId: string,
  signer: (pathname: string) => Promise<string | null>
): Promise<T[]> {
  let changed = false;
  const next = await Promise.all(
    messages.map(async (message) => {
      if (!Array.isArray(message.parts)) return message;
      let partsChanged = false;
      const parts = await Promise.all(
        (message.parts as unknown[]).map(async (part) => {
          if (!part || typeof part !== "object") return part;
          const filePart = part as FilePartLike;
          if (filePart.type !== "file" || typeof filePart.url !== "string") {
            return part;
          }
          const url = filePart.url;
          if (!isVercelBlobUrl(url)) return part;
          const pathname =
            (typeof filePart.pathname === "string" &&
              isBlobPathnameOwnedBy(filePart.pathname, userId) &&
              filePart.pathname) ||
            blobPathnameFromUrl(url);
          if (!pathname || !isBlobPathnameOwnedBy(pathname, userId)) {
            return part;
          }
          const signed = await signer(pathname);
          if (!signed) return part;
          partsChanged = true;
          return { ...filePart, url: signed };
        })
      );
      if (!partsChanged) return message;
      changed = true;
      return { ...message, parts };
    })
  );
  return changed ? next : messages;
}

import "server-only";

import { issueSignedToken, presignUrl } from "@vercel/blob";
import { isBlobPathnameOwnedBy } from "@/lib/files/blob-path";

/**
 * Durée d'une URL de lecture réémise. Elle couvre la lecture d'un message
 * ancien et l'exécution d'un tour de chat, sans transformer le blob privé en
 * ressource publique. Ce n'est PAS la durée de la référence : la référence
 * durable est le `pathname` stocké avec la pièce jointe.
 */
export const ATTACHMENT_URL_TTL_MS = 60 * 60 * 1000;

/**
 * Réémet une URL signée pour un blob privé, UNIQUEMENT si le chemin appartient
 * au compte. Toute autre demande retourne null — l'appelant ne doit jamais
 * révéler l'existence d'un blob étranger.
 */
export async function signBlobPathForUser(
  pathname: string,
  userId: string
): Promise<string | null> {
  if (!isBlobPathnameOwnedBy(pathname, userId)) {
    return null;
  }
  try {
    const validUntil = Date.now() + ATTACHMENT_URL_TTL_MS;
    const signedToken = await issueSignedToken({
      operations: ["get"],
      pathname,
      validUntil,
    });
    const { presignedUrl } = await presignUrl(signedToken, {
      access: "private",
      operation: "get",
      pathname,
      validUntil,
    });
    return presignedUrl;
  } catch (error) {
    console.error("[files] Réémission d'URL impossible:", error);
    return null;
  }
}

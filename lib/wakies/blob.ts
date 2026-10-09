import "server-only";

/**
 * ============================================================================
 * Accès aux pièces jointes privées d'une conversation
 * ============================================================================
 *
 * LE PROBLÈME
 *
 * `POST /api/files/upload` renvoie une URL signée valable DIX MINUTES. Une
 * pièce jointe qui vit dans l'historique d'une conversation vit des mois :
 * enregistrer cette URL produirait un lien mort au bout de dix minutes, et
 * l'historique afficherait « fichier indisponible » dès le lendemain.
 *
 * CE QUI EST PERSISTÉ, ET POURQUOI
 *
 * Le handler renvoie `{ ...data, url: presignedUrl }` : `data.pathname` fait
 * partie de la réponse. C'est CE pathname qui est stocké dans la part de
 * message, jamais l'URL signée — le pathname est stable, et c'est la seule
 * chose qui survive. L'URL n'est jamais persistée : elle est REFAITE à la
 * lecture, à partir du pathname, par ce module.
 *
 * CE QUI N'EST JAMAIS FAIT
 *
 *   - le client ne fournit jamais une URL comme preuve de propriété. Il ne
 *     fournit que le `pathname` que le serveur lui a donné, et le serveur
 *     le signe lui-même ;
 *   - aucun secret blob ne sort d'ici : seule une URL signée à durée courte
 *     est rendue, comme celle que l'upload produit déjà ;
 *   - un pathname absent ou illisible ne fait pas échouer la lecture de
 *     l'historique : le message reste lisible, la pièce est simplement
 *     annoncée comme indisponible.
 *
 * LE NOM DESPACE PAR COMPTE
 *
 * L'upload écrit sous `uploads/<userId>/…`. On revérifie ce préfixe avant de
 * signer : un pathname qui en sortirait Viendrait d'une autre origine, et le
 * signer reviendrait à prêter l'accès au blob de quelqu'un d'autre.
 */

import { head, issueSignedToken, presignUrl } from "@vercel/blob";

/** Durée de validité d'une URL signée rendue à la lecture. */
const DUREE_VALIDITE_MS = 10 * 60 * 1000;

/** Partie d'une part de message qui décrit une pièce jointe. */
export type AttachmentPart = {
  /** Nom du fichier, déjà assaini par le handler d'upload. */
  fileName?: string;
  /** Type MIME déclaré. */
  mediaType?: string;
  /** Identifiant de la pièce jointe, stable et propre au compte. */
  fileId?: string;
  /**
   * `uploads/<userId>/<suffixe>-<nom>`. C'est la SEULE donnée persistée.
   * L'URL signée n'est jamais stockée : elle expire en dix minutes.
   */
  pathname?: string;
  /** Taille en octets, pour l'affichage. */
  size?: number;
  /** `file` = téléversée dans ce tour ; `library` = déjà dans la bibliothèque. */
  source?: "file" | "library";
};

function namespaceDe(userId: string): string {
  return `uploads/${userId}/`;
}

/**
 * Le pathname appartient-il à ce compte ?
 *
 * Refuse tout ce qui n'est pas `uploads/<userId>/…` : un nom d'espace
 * différent, un chemin qui remonte (`..`), ou un pathname absent. C'est un
 * contrôle de forme et de préfixe, pas une preuve — la preuve reste la
 * signature du blob, qu'on ne peut pas forger sans la clé du compte.
 */
export function pathnameDuCompte(
  userId: string,
  pathname: unknown
): string | null {
  if (typeof pathname !== "string" || pathname.length === 0) {
    return null;
  }
  if (
    pathname.length > 512 ||
    pathname.includes("..") ||
    pathname.includes("\\") ||
    /%2e|%2f|%5c/i.test(pathname)
  ) {
    return null;
  }
  const prefixe = namespaceDe(userId);
  if (!pathname.startsWith(prefixe)) {
    return null;
  }
  const reste = pathname.slice(prefixe.length);
  if (reste.length === 0) {
    return null;
  }
  return pathname;
}

/**
 * Re-signe une pièce jointe pour ce compte. Renvoie `null` — jamais une
 * exception — si le blob n'est plus lisible : l'historique doit rester
 * consultable et annoncer « fichier indisponible », pas échouer en bloc.
 */
export async function signerPieceJointe(
  userId: string,
  pathname: unknown
): Promise<string | null> {
  const valide = pathnameDuCompte(userId, pathname);
  if (!valide) {
    return null;
  }
  try {
    // La signature seule ne prouve pas que le fichier existe encore.
    await head(valide);
    const signedToken = await issueSignedToken({
      operations: ["get"],
      pathname: valide,
      validUntil: Date.now() + DUREE_VALIDITE_MS,
    });
    const { presignedUrl } = await presignUrl(signedToken, {
      access: "private",
      operation: "get",
      pathname: valide,
      validUntil: Date.now() + DUREE_VALIDITE_MS,
    });
    return presignedUrl;
  } catch {
    // Blob supprimé, ou stockage indisponible : l'interface affiche
    // « Fichier indisponible ». Inventer une URL serait pire que l'absence.
    return null;
  }
}

import { head } from "@vercel/blob";
import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiSessionToken } from "@/lib/auth/session";
import { pathnameDuCompte, signerPieceJointe } from "@/lib/wakies/blob";
import {
  badRequest,
  isResponse,
  json,
  notFound,
  rejectCrossOriginMutation,
  requireWakiesUser,
} from "@/lib/wakies/http";
import {
  quotaBibliotheque,
  verserVersBibliotheque,
} from "@/lib/wakies/library";
import { DOCUMENT_MAX_BYTES, safeFetchBuffer } from "@/lib/web/safe-fetch";

/**
 * POST /api/wakies/files/library { pathname }
 *
 * Verse UNE PIÈCE JOIANTE DÉJÀ ENVOYÉE dans la bibliothèque cloud mAI.
 *
 * L'ordre des vérifications est le contrat, et il se lit du moins cher au plus
 * cher : identité, origine, propriété du chemin, taille RÉELLE du blob (jamais
 * ce que le client a déclaré), quota, puis seulement le contenu. Un refus de
 * quota ne doit donc rien télécharger : sinon chaque message « bibliothèque
 * pleine » coûterait trente mégaoctets à répéter.
 *
 * Un refus n'est JAMAIS une erreur du message en cours : la pièce jointe reste
 * dans la conversation, l'import est un plus.
 */

const schema = z.object({ pathname: z.string().min(1).max(512) }).strict();

export async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) return identite;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest("Chemin de fichier invalide.");
  }
  // Le namespace du compte : un pathname d'un autre compte répond comme une
  // ressource absente, jamais comme une ressource interdite.
  const pathname = pathnameDuCompte(identite.userId, parsed.data.pathname);
  if (!pathname) return notFound("Fichier introuvable.");

  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", {
      message: "Session expirée. Reconnectez-vous pour importer.",
    });
  }

  const octets = await headBlob(pathname);
  if (!octets) {
    return notFound("Ce fichier n'est plus disponible.");
  }

  const quota = await quotaBibliotheque({ tier: identite.tier, token });
  const placeManque =
    quota.source === "amont" &&
    quota.bytesLimit > 0 &&
    quota.bytesUsed + octets.taille > quota.bytesLimit;
  if (placeManque) {
    return errorResponse("quota_exceeded", {
      details: {
        bytesLimit: quota.bytesLimit,
        bytesUsed: quota.bytesUsed,
        taille: octets.taille,
      },
      message: `Votre bibliothèque cloud est pleine (${Mo(quota.bytesUsed)} Mo sur ${Mo(quota.bytesLimit)} Mo). Le fichier reste disponible dans cette conversation.`,
    });
  }

  const url = await signerPieceJointe(identite.userId, pathname);
  if (!url) {
    return notFound("Ce fichier n'est plus disponible.");
  }
  const lecture = await safeFetchBuffer(url, {
    maxBytes: Math.min(octets.taille, DOCUMENT_MAX_BYTES),
    timeoutMs: 60_000,
  });
  if (!lecture.ok) {
    return errorResponse("service_unavailable", {
      message: "Le fichier n'a pas pu être relu. Réessayez plus tard.",
    });
  }

  try {
    const verse = await verserVersBibliotheque({
      contentType: octets.contentType,
      contenu: new Uint8Array(lecture.buffer),
      nom: octets.nom,
      token,
    });
    return json({
      dejaPresente: verse.dejaPresent,
      id: verse.id,
      pathname,
    });
  } catch (erreur) {
    return errorResponse("service_unavailable", {
      message:
        erreur instanceof Error
          ? erreur.message
          : "Le service de fichiers est injoignable. Le message, lui, est bien parti.",
    });
  }
}

function Mo(octets: number): number {
  return Math.round(octets / 1024 / 1024);
}

/**
 * Taille, type et nom RÉELS du blob. `null` si le fichier n'existe plus.
 *
 * La déclaration du navigateur n'est jamais crue : c'est par elle qu'un client
 * (ou une page modifiée) ferait passer 500 Mo pour 1 Ko.
 */
async function headBlob(
  pathname: string
): Promise<{ contentType: string; nom: string; taille: number } | null> {
  try {
    const { head } = await import("@vercel/blob");
    const blob = await head(pathname);
    return {
      contentType: blob.contentType || "application/octet-stream",
      nom: pathname.split("/").pop() || "fichier",
      taille: Number(blob.size) || 0,
    };
  } catch {
    return null;
  }
}

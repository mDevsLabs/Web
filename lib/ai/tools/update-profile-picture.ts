import { createHash } from "node:crypto";
import { tool } from "ai";
import { z } from "zod";
import { PHOTO_STATUS, PROFILE_PICTURE_TOOL } from "./account-status";

// Tool natif de changement de photo de profil. Même principe de sécurité que
// updateAccountProfile : le tool NE MODIFIE RIEN lui-même — il prépare
// l'opération, affiche une carte de confirmation (aperçu de l'image, origine,
// action) et n'exécute l'upload qu'après une confirmation explicite de
// l'utilisateur, valable UNIQUEMENT pour la source exacte affichée (le hachage
// de la source est revérifié côté serveur à la soumission : toute
// modification de source exige une nouvelle confirmation).
//
// Aucun Plugin, aucun serveur MCP, aucune Skill : tool natif typé, dépendant
// uniquement de /api/settings (côté carte) et de la session utilisateur.

export type ProfilePictureOrigin = "attachment" | "remote";

// Aperçu de la source proposée : uniquement des données affichables, jamais
// d'octets d'image (la carte les récupère via l'URL déjà validée).
export type ProfilePicturePreview = {
  /** Nom de fichier affiché (pièce jointe) ou hôte distant. */
  label: string;
  /** Origine de la source, affichée dans la carte. */
  origin: ProfilePictureOrigin;
  /** URL déjà validée par le pipeline d'upload ou par la garde SSRF. */
  sourceUrl: string;
  /** Hachage de la source exacte : fonde la validité de la confirmation. */
  sourceHash: string;
};

export type UpdateProfilePictureOutput =
  | { status: "invalid"; error: string }
  | {
      status: "awaiting_user";
      message: string;
      preview: ProfilePicturePreview;
    }
  | { status: "submitted"; avatarUrl: string; message: string; success: true }
  | { status: "cancelled"; message: string }
  | { status: "failed"; error: string };

export const updateProfilePictureInput = z.object({
  imageUrl: z
    .string()
    .max(2048)
    .optional()
    .describe(
      "URL HTTPS de l'image à utiliser (fournie par l'utilisateur). Omettre si une image est jointe à la conversation."
    ),
  reason: z
    .string()
    .max(200)
    .optional()
    .describe(
      "Raison courte de la demande, affichée dans la carte (ex: demande de l'utilisateur)."
    ),
  source: z
    .enum(["attachment", "remote"])
    .describe(
      "Origine de l'image : 'attachment' pour une image jointe à la conversation, 'remote' pour une URL fournie."
    ),
});

function hashSource(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 32);
}

// Valide une pièce jointe : l'URL doit provenir du pipeline d'upload déjà
// authentifié (Vercel Blob). Le modèle ne peut jamais téléverser lui-même des
// octets ni désigner une ressource implicite.
function buildAttachmentPreview(
  imageUrl: string
): { error: string } | { preview: ProfilePicturePreview } {
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return { error: "URL de pièce jointe invalide." };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { error: "L'URL de la pièce jointe doit être HTTP(S)." };
  }
  // Allow-list du stockage d'upload (Vercel Blob, namespaces /uploads/).
  const host = parsed.hostname.toLowerCase();
  const isBlobHost =
    host.endsWith(".public.blob.vercel-storage.com") ||
    host === "public.blob.vercel-storage.com";
  const isUploadPath = parsed.pathname.startsWith("/uploads/");
  if (!isBlobHost || !isUploadPath) {
    return {
      error:
        "La pièce jointe doit provenir du téléversement de la conversation (stockage mAI).",
    };
  }
  const sourceUrl = parsed.toString();
  return {
    preview: {
      label: decodeURIComponent(parsed.pathname.split("/").pop() || "image"),
      origin: "attachment",
      sourceHash: hashSource(sourceUrl),
      sourceUrl,
    },
  };
}

export function updateProfilePicture() {
  return tool({
    description:
      "Prépare le changement de photo de profil de l'utilisateur à partir d'une image jointe à la conversation ou d'une URL HTTPS fournie. N'appelle cet outil QUE sur demande explicite de changer la photo de profil. L'outil ne modifie RIEN lui-même : il affiche une carte de confirmation avec l'aperçu de l'image, son origine et l'action à effectuer ; l'utilisateur doit confirmer dans la carte. N'affirme jamais que la photo a été changée : attends le résultat (submitted, cancelled ou failed) renvoyé par la carte.",
    execute: async ({
      imageUrl,
      reason: _reason,
      source,
    }): Promise<UpdateProfilePictureOutput> => {
      if (source === "attachment") {
        if (!imageUrl) {
          return {
            error:
              "Aucune image jointe identifiable : demande à l'utilisateur de joindre l'image à la conversation.",
            status: PHOTO_STATUS.INVALID,
          };
        }
        const built = buildAttachmentPreview(imageUrl);
        if ("error" in built) {
          return { error: built.error, status: PHOTO_STATUS.INVALID };
        }
        return {
          message:
            "Confirmation requise : l'utilisateur doit confirmer le changement dans la carte.",
          preview: built.preview,
          status: PHOTO_STATUS.AWAITING,
        };
      }

      // Source distante : HTTPS strict validé ici (même règle que la garde
      // serveur lib/net/fetch-image.ts, appliquée à nouveau côté route au
      // moment de la soumission).
      if (!imageUrl) {
        return {
          error:
            "Fournis l'URL HTTPS de l'image, ou utilise une image jointe à la conversation.",
          status: PHOTO_STATUS.INVALID,
        };
      }
      let parsed: URL;
      try {
        parsed = new URL(imageUrl.trim());
      } catch {
        return {
          error: "URL invalide : fournis une URL HTTPS complète.",
          status: PHOTO_STATUS.INVALID,
        };
      }
      if (parsed.protocol !== "https:") {
        return {
          error: "Seules les URL HTTPS sont acceptées.",
          status: PHOTO_STATUS.INVALID,
        };
      }
      const host = parsed.hostname.toLowerCase();
      const isPublicHost =
        !(
          host === "localhost" ||
          host.endsWith(".localhost") ||
          host.endsWith(".local") ||
          host.endsWith(".internal") ||
          /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
          host.startsWith("[")
        ) && host.includes(".");
      if (!isPublicHost) {
        return {
          error: "Cette adresse n'est pas accessible (hôte interdit).",
          status: PHOTO_STATUS.INVALID,
        };
      }
      const sourceUrl = parsed.toString();
      return {
        message:
          "Confirmation requise : l'image distante sera vérifiée puis appliquée après confirmation dans la carte.",
        preview: {
          label: host,
          origin: "remote",
          sourceHash: hashSource(sourceUrl),
          sourceUrl,
        },
        status: PHOTO_STATUS.AWAITING,
      };
    },
    inputSchema: updateProfilePictureInput,
  });
}

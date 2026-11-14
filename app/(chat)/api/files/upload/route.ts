import { del, issueSignedToken, presignUrl, put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { errorResponse, logError } from "@/lib/api/error-response";

const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 Mo / fichier (limite par message imposée côté client)

// Types exécutables par le navigateur — refusés même s'ils passent le filtre text/*|image/*
const BLOCKED_UPLOAD_TYPES = ["text/html", "text/javascript", "image/svg+xml"];

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "La taille du fichier ne doit pas dépasser 50 Mo",
    })
    .refine(
      (file) => {
        if (!file.type) {
          return true; // fallback si mime manquant (certains navigateurs)
        }
        if (BLOCKED_UPLOAD_TYPES.includes(file.type)) {
          return false;
        }
        return (
          ALLOWED_UPLOAD_TYPES.includes(file.type) ||
          file.type.startsWith("image/") ||
          file.type.startsWith("text/") ||
          file.type === "application/pdf" ||
          file.type === "application/json"
        );
      },
      {
        message:
          "Type de fichier non pris en charge (image, PDF ou texte uniquement)",
      }
    ),
});

// Étapes du téléversement blob, pour nommer la cause exacte d'un échec dans les
// logs et dans le message rendu — jamais le contenu du fichier.
type UploadStep = "presignature" | "signature" | "écriture";

/**
 * Vrai si AUCUNE credentiale de stockage n'est présente. `@vercel/blob` accepte
 * un jeton de lecture/écriture, ou un couple OIDC + store : quand les trois
 * variables sont absentes, l'envoi échouerait de toute façon — mieux vaut le
 * dire explicitement que de renvoyer un 500 opaque (issue #47).
 */
function blobCredentialsMissing(): boolean {
  return (
    !process.env.BLOB_READ_WRITE_TOKEN &&
    !process.env.VERCEL_OIDC_TOKEN &&
    !process.env.BLOB_STORE_ID
  );
}

function storageUnavailableMessage(step: UploadStep | null): string {
  const stepLabel = step ? ` (étape : ${step})` : "";
  return `Le stockage de fichiers est indisponible${stepLabel}. Le fichier n'a pas été envoyé, veuillez réessayer.`;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return errorResponse("auth_required");
  }

  if (request.body === null) {
    return errorResponse("invalid_request", {
      message: "Le corps de la requête est vide.",
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return errorResponse("invalid_request", {
        message: "Aucun fichier n'a été fourni.",
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("payload_too_large");
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.issues
        .map((error) => error.message)
        .join(", ");

      return errorResponse("unsupported_media_type", {
        message: errorMessage,
      });
    }

    // Stockage absent de l'instance : refus explicite AVANT l'envoi, plutôt
    // qu'un 500 opaque venu du SDK blob. L'échec reste récupérable : le client
    // doit afficher ce message, pas retirer le fichier en silence.
    if (blobCredentialsMissing()) {
      logError(
        `Upload refusé : stockage non configuré type=${file.type} taille=${file.size}`,
        new Error("BLOB_READ_WRITE_TOKEN / VERCEL_OIDC_TOKEN absents")
      );
      return errorResponse("service_unavailable", {
        message:
          "Le stockage de fichiers n'est pas configuré sur cette instance. Le fichier n'a pas été envoyé.",
      });
    }

    const filename = (formData.get("file") as File).name;
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    // Namespace par utilisateur + suffixe unique : deux utilisateurs ne peuvent
    // pas s'écraser mutuellement les fichiers sur le blob privé.
    const blobKey = `uploads/${session.user.id}/${nanoid()}-${safeName}`;
    const fileBuffer = await file.arrayBuffer();

    let uploadedUrl: string | null = null;
    let step: UploadStep = "écriture";
    try {
      const data = await put(blobKey, fileBuffer, {
        access: "private",
      });
      uploadedUrl = data.url;
      const validUntil = Date.now() + 10 * 60 * 1000;
      step = "signature";
      const signedToken = await issueSignedToken({
        operations: ["get"],
        pathname: data.pathname,
        validUntil,
      });
      step = "presignature";
      const { presignedUrl } = await presignUrl(signedToken, {
        access: "private",
        operation: "get",
        pathname: data.pathname,
        validUntil,
      });

      return NextResponse.json({ ...data, url: presignedUrl });
    } catch (error) {
      if (uploadedUrl) {
        await del(uploadedUrl).catch(() => {});
      }
      // Erreur du stockage (credential, accès, indisponibilité) : échec
      // explicite et récupérable, jamais un 500 opaque ni un succès. La trace
      // nomme l'étape et le type du fichier, sans son contenu.
      logError(
        `Échec upload blob étape=${step} type=${file.type} taille=${file.size}`,
        error
      );
      return errorResponse("service_unavailable", {
        message: storageUnavailableMessage(step),
      });
    }
  } catch (error) {
    logError("Échec traitement upload", error);
    return errorResponse("internal_error", {
      message: "Impossible de traiter la requête d'envoi.",
    });
  }
}

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

    const filename = (formData.get("file") as File).name;
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    // Namespace par utilisateur + suffixe unique : deux utilisateurs ne peuvent
    // pas s'écraser mutuellement les fichiers sur le blob privé.
    const blobKey = `uploads/${session.user.id}/${nanoid()}-${safeName}`;
    const fileBuffer = await file.arrayBuffer();

    let uploadedUrl: string | null = null;
    try {
      const data = await put(blobKey, fileBuffer, {
        access: "private",
      });
      uploadedUrl = data.url;
      const validUntil = Date.now() + 10 * 60 * 1000;
      const signedToken = await issueSignedToken({
        operations: ["get"],
        pathname: data.pathname,
        validUntil,
      });
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
      logError("Échec upload blob", error);
      return errorResponse("internal_error", {
        message: "L'envoi du fichier a échoué. Veuillez réessayer.",
      });
    }
  } catch (error) {
    logError("Échec traitement upload", error);
    return errorResponse("internal_error", {
      message: "Impossible de traiter la requête d'envoi.",
    });
  }
}

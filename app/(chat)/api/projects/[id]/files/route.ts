import { z } from "zod";
import { errorResponse, logError } from "@/lib/api/error-response";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import {
  createProjectFile,
  deleteProjectFile,
  getProjectFileById,
  getProjectFiles,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { MAI_API_URL } from "@/lib/constants";
import {
  extractDocument,
  fetchDocumentBuffer,
} from "@/lib/agent/tools/internal/extract";
import {
  getProjectAccess,
} from "@/lib/projects/access";
import { canDeleteProjectFile, canUploadProjectFile } from "@/lib/projects/permissions";

// Fichiers d'un Projet partagé : stockage cloud mAI (backend Z1 Storage via
// MAI_API_URL, même chemin que /api/library) — jamais Vercel Blob ici. Le
// texte est extrait à l'upload (pdf-parse/mammoth/Papa déjà présents) pour
// une injection bornée dans les conversations du projet.
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 Mo

const ALLOWED_CONTENT_TYPES = [
  "application/json",
  "application/pdf",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "text/markdown",
  "text/plain",
];

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isExtractable(contentType: string, fileName: string): boolean {
  if (
    contentType.startsWith("text/") ||
    contentType === "application/json" ||
    contentType === "application/pdf" ||
    contentType === DOCX_MIME
  ) {
    return true;
  }
  return /\.(txt|md|markdown|csv|json|pdf|docx)$/i.test(fileName);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const access = await getProjectAccess({
    projectId: id,
    userEmail: user.email,
    userId: user.id || user.email,
  });
  if (!access) {
    return new ChatbotError("not_found:database", "Projet introuvable").toResponse();
  }
  const files = await getProjectFiles({ projectId: id });
  return Response.json({ files });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;

  // Un membre peut contribuer au projet partagé avec ses propres fichiers.
  const access = await getProjectAccess({
    projectId: id,
    userEmail: user.email,
    userId,
  });
  if (!access) {
    return new ChatbotError("not_found:database", "Projet introuvable").toResponse();
  }
  if (!canUploadProjectFile(access.role)) {
    return new ChatbotError(
      "forbidden:api",
      "Vous n'êtes pas membre de ce projet."
    ).toResponse();
  }

  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return errorResponse("invalid_request", {
        message: "Aucun fichier fourni.",
      });
    }
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("payload_too_large");
    }
    const contentType = file.type || "application/octet-stream";
    const allowed =
      ALLOWED_CONTENT_TYPES.includes(contentType) ||
      contentType === DOCX_MIME ||
      contentType.startsWith("image/") ||
      contentType.startsWith("text/");
    if (!allowed) {
      return errorResponse("unsupported_media_type", {
        message: "Type de fichier non pris en charge.",
      });
    }

    // Upload proxifié vers le stockage cloud mAI (compte du membre).
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    const uploadRes = await fetch(`${MAI_API_URL}/cloud/upload`, {
      body: uploadFormData,
      headers: { Authorization: `Bearer ${token}` },
      method: "POST",
    });
    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      return errorResponse("internal_error", {
        message:
          (uploadData as { error?: string }).error ||
          "L'envoi du fichier a échoué.",
      });
    }

    const storageUrl =
      (uploadData as { url?: string; file_url?: string }).url ||
      (uploadData as { url?: string; file_url?: string }).file_url ||
      "";
    const fileRef =
      (uploadData as { id?: string; file_id?: string }).id ||
      (uploadData as { id?: string; file_id?: string }).file_id ||
      null;

    // Extraction texte pour les documents (PDF/DOCX/CSV/texte) : cache borné
    // en base, injecté sous budget par la policy (lib/chat/project-files.ts).
    let extractionStatus: "pending" | "ready" | "unsupported" | "failed" =
      "unsupported";
    let extractedText: string | null = null;
    if (isExtractable(contentType, file.name)) {
      try {
        const bufferResult = await fetchDocumentBuffer({ url: storageUrl });
        if ("buffer" in bufferResult) {
          const extracted = await extractDocument({
            buffer: bufferResult.buffer,
            contentType,
            maxChars: 100_000,
            url: file.name,
          });
          if (extracted.data?.text) {
            extractionStatus = "ready";
            extractedText = extracted.data.text;
          } else {
            extractionStatus = "failed";
          }
        } else {
          extractionStatus = "failed";
        }
      } catch {
        extractionStatus = "failed";
      }
    }

    const created = await createProjectFile({
      contentType,
      extractedText,
      extractionStatus,
      fileRef,
      fileName: file.name,
      fileSize: file.size,
      projectId: id,
      storageUrl,
      uploadedBy: userId,
    });
    return Response.json({ file: created });
  } catch (error) {
    logError("Project file upload error", error);
    return errorResponse("internal_error", {
      message: "Impossible de traiter le fichier.",
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");
  if (!fileId) {
    return new ChatbotError(
      "bad_request:api",
      "fileId est requis."
    ).toResponse();
  }

  const access = await getProjectAccess({
    projectId: id,
    userEmail: user.email,
    userId,
  });
  if (!access) {
    return new ChatbotError("not_found:database", "Projet introuvable").toResponse();
  }

  const file = await getProjectFileById({ id: fileId });
  if (!file || file.projectId !== id) {
    return new ChatbotError("not_found:database", "Fichier introuvable").toResponse();
  }
  // Un fichier est supprimable par son auteur ou par le propriétaire du
  // projet — décision portée par la matrice de permissions, pas par l'UI.
  if (!canDeleteProjectFile({ fileUploadedBy: file.uploadedBy, role: access.role, userId })) {
    return new ChatbotError(
      "forbidden:api",
      "Ce fichier ne peut pas être supprimé."
    ).toResponse();
  }

  try {
    // Suppression du stockage cloud (best effort) : le fichier appartient au
    // compte du membre qui l'a téléversé.
    const token = await getMaiSessionToken();
    if (token && file.fileRef) {
      await fetch(`${MAI_API_URL}/cloud/files/${file.fileRef}`, {
        headers: { Authorization: `Bearer ${token}` },
        method: "DELETE",
      }).catch(() => null);
    }
    await deleteProjectFile({ id: fileId });
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    logError("Project file delete error", error);
    return new ChatbotError("bad_request:database").toResponse();
  }
}

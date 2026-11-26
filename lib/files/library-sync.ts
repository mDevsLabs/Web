import "server-only";

/**
 * Synchronisation best-effort des images importées dans mAI vers la Bibliothèque
 * cloud de l'utilisateur (`cloud_files` + `cloud_storage_usage`).
 *
 * Pourquoi best-effort : l'import principal (`/api/files/upload`, Vercel Blob)
 * doit rester opérationnel même si le quota Bibliothèque est plein ou si le
 * stockage distant est momentanément indisponible.
 */

import { logError } from "@/lib/api/error-response";
import { upstreamForm } from "@/lib/api/upstream";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { getUserCloudStorage } from "@/lib/db/queries/storage";

// Plafond imposé par `storage.ts` (`/cloud/upload`).
const LIBRARY_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const LIBRARY_SYNC_TIMEOUT_MS = 30_000;

export type LibraryImageSyncResult =
  | {
      fileId: string | null;
      saved: true;
      url: string | null;
    }
  | {
      reason:
        | "file_too_large"
        | "not_image"
        | "quota_exceeded"
        | "unauthenticated"
        | "unavailable";
      saved: false;
    };

export async function syncUploadedImageToLibrary(params: {
  buffer: ArrayBuffer;
  contentType: string;
  filename: string;
  size: number;
}): Promise<LibraryImageSyncResult> {
  if (!params.contentType.toLowerCase().startsWith("image/")) {
    return { reason: "not_image", saved: false };
  }
  if (params.size <= 0 || params.size > LIBRARY_MAX_FILE_SIZE_BYTES) {
    return { reason: "file_too_large", saved: false };
  }

  try {
    const token = await getMaiSessionToken();
    if (!token) {
      return { reason: "unauthenticated", saved: false };
    }
    const user = await getMaiUser(token);
    if (!user?.id) {
      return { reason: "unauthenticated", saved: false };
    }

    const storage = await getUserCloudStorage(user.id, user.tier);
    if (
      storage.bytes_limit > 0 &&
      storage.bytes_used + params.size > storage.bytes_limit
    ) {
      return { reason: "quota_exceeded", saved: false };
    }

    const bytes = new Uint8Array(params.buffer.slice(0));
    const form = new FormData();
    form.append(
      "file",
      new Blob([bytes.buffer], { type: params.contentType }),
      params.filename || "image"
    );

    const upload = await upstreamForm<{
      file?: { id?: string; url?: string };
      id?: string;
      url?: string;
    }>({
      form,
      path: "/cloud/upload",
      timeoutMs: LIBRARY_SYNC_TIMEOUT_MS,
      token,
    });

    if (!upload.ok) {
      if (upload.payload.status === 413 || upload.payload.status === 409) {
        return { reason: "quota_exceeded", saved: false };
      }
      logError(
        `Échec sync image Bibliothèque status=${upload.payload.status}`,
        new Error(upload.payload.message)
      );
      return { reason: "unavailable", saved: false };
    }

    return {
      fileId: upload.data?.file?.id ?? upload.data?.id ?? null,
      saved: true,
      url: upload.data?.file?.url ?? upload.data?.url ?? null,
    };
  } catch (error) {
    logError("Erreur sync image vers la Bibliothèque", error);
    return { reason: "unavailable", saved: false };
  }
}

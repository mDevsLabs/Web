import { type NextRequest, NextResponse } from "next/server";
import { errorResponse, logError } from "@/lib/api/error-response";
import { upstreamForm } from "@/lib/api/upstream";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import {
  deleteUserCloudFile,
  getUserCloudFiles,
  getUserCloudStorage,
  renameUserCloudFile,
} from "@/lib/db/queries/storage";

// Aligné sur `app/(chat)/api/files/upload/route.ts`.
const MAX_LIBRARY_FILE_SIZE = 50 * 1024 * 1024;

export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  try {
    const user = await getMaiUser(token);
    if (!user?.id) {
      return errorResponse("auth_required", { message: "Non authentifié." });
    }
    const [storage, files] = await Promise.all([
      getUserCloudStorage(user.id, user.tier),
      getUserCloudFiles(user.id),
    ]);

    return NextResponse.json({
      files,
      storage,
    });
  } catch (error) {
    logError("Erreur API Library GET", error);
    return errorResponse("internal_error", { message: "Erreur serveur." });
  }
}

export async function POST(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return errorResponse("invalid_request", {
        message: "Aucun fichier fourni.",
      });
    }

    // `/api/files/upload` plafonne à 50 Mo par fichier ; cette route ne le
    // faisait pas et laissait le corps entier transiter en mémoire avant d'être
    // relayé. Même limite, donc même comportement entre les deux chemins
    // d'envoi de fichier.
    if (file.size > MAX_LIBRARY_FILE_SIZE) {
      return errorResponse("invalid_request", {
        details: { limit: MAX_LIBRARY_FILE_SIZE },
        message: `Le fichier dépasse la limite de ${Math.round(MAX_LIBRARY_FILE_SIZE / 1024 / 1024)} Mo.`,
      });
    }

    const user = await getMaiUser(token);
    if (!user?.id) {
      return errorResponse("auth_required", { message: "Non authentifié." });
    }
    const storageData = await getUserCloudStorage(user.id, user.tier);
    const bytesLimit = storageData.bytes_limit;
    const bytesUsed = storageData.bytes_used;
    if (bytesLimit > 0 && bytesUsed + file.size > bytesLimit) {
      return errorResponse("quota_exceeded", {
        message: "Le quota de la Bibliothèque est atteint.",
        status: 409,
      });
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    const upload = await upstreamForm({
      form: uploadFormData,
      // Un envoi de fichier dépasse le délai JSON par défaut.
      path: "/cloud/upload",
      timeoutMs: 120_000,
      token,
    });
    if (!upload.ok) {
      return NextResponse.json(upload.payload, {
        status: upload.payload.status,
      });
    }
    return NextResponse.json(upload.data);
  } catch (error) {
    logError("Erreur API Library POST", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de l'upload.",
    });
  }
}

export async function DELETE(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("id");

  if (!fileId) {
    return errorResponse("invalid_request", {
      message: "L'identifiant du fichier est requis.",
    });
  }

  try {
    const user = await getMaiUser(token);
    if (!user?.id) {
      return errorResponse("auth_required", { message: "Non authentifié." });
    }
    const result = await deleteUserCloudFile(fileId, user.id);
    if (!result.success) {
      return errorResponse(result.notFound ? "not_found" : "internal_error", {
        message: result.error || "Erreur lors de la suppression.",
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Erreur API Library DELETE", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de la suppression.",
    });
  }
}

export async function PATCH(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  try {
    const body = await req.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!/^[0-9a-f-]{36}$/i.test(id) || !name || name.length > 255) {
      return errorResponse("invalid_request", {
        message: "L'identifiant et le nom du fichier sont requis.",
      });
    }

    const user = await getMaiUser(token);
    if (!user?.id) {
      return errorResponse("auth_required", { message: "Non authentifié." });
    }
    const ok = await renameUserCloudFile(id, user.id, name);
    if (!ok) {
      // Aucune ligne modifiée : le fichier n'existe pas pour ce compte.
      return errorResponse("not_found", {
        message: "Fichier introuvable. Le nom n'a pas été modifié.",
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Erreur API Library PATCH", error);
    return errorResponse("internal_error", {
      message: "Impossible de renommer le fichier.",
    });
  }
}

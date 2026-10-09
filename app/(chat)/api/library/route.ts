import { type NextRequest, NextResponse } from "next/server";
import { errorResponse, logError } from "@/lib/api/error-response";
import { upstreamForm, upstreamJson } from "@/lib/api/upstream";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { getTierStorageBytes } from "@/lib/plans/tier-limits";

// Aligné sur `app/(chat)/api/files/upload/route.ts`.
const MAX_LIBRARY_FILE_SIZE = 50 * 1024 * 1024;

export async function GET() {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  try {
    const [user, storage, files] = await Promise.all([
      getMaiUser(token),
      upstreamJson<Record<string, any>>({
        path: "/cloud/storage",
        token,
      }),
      upstreamJson<{ files?: any[] }>({ path: "/cloud/files", token }),
    ]);

    // Une lecture en échec ne doit pas vider la page : le quota de stockage se
    // lit dans le forfait, donc l'onglet reste utilisable et affiche « aucun
    // fichier » si seul le catalogue est injoignable.
    const storageData = storage.ok ? storage.data : null;
    const filesData = files.ok ? files.data : { files: [] };

    const userTier = (user?.tier || storageData?.tier || "Free").trim();
    const exactLimit = Number(
      storageData?.bytes_limit || getTierStorageBytes(userTier)
    );

    const bytesUsed = Number(storageData?.bytes_used || 0);
    const percentUsed =
      exactLimit > 0
        ? Math.min(100, Math.round((bytesUsed / exactLimit) * 10_000) / 100)
        : 0;

    const finalStorage = {
      bytes_limit: exactLimit,
      bytes_used: bytesUsed,
      files_count: Number(
        storageData?.files_count || (filesData?.files?.length ?? 0)
      ),
      over_limit: bytesUsed >= exactLimit,
      percent_used: percentUsed,
      tier: userTier,
    };

    return NextResponse.json({
      files: filesData.files || [],
      storage: finalStorage,
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
    const result = await upstreamJson({
      method: "DELETE",
      path: `/cloud/files/${fileId}`,
      token,
    });
    if (!result.ok) {
      return NextResponse.json(result.payload, {
        status: result.payload.status,
      });
    }
    return NextResponse.json(result.data);
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

    const result = await upstreamJson({
      body: { name },
      method: "PATCH",
      path: `/cloud/files/${id}`,
      token,
    });
    if (!result.ok) {
      // Le nom n'a pas été modifié : le dire explicitement évite que
      // l'interface montre un optimistic update que rien n'a confirmé.
      return NextResponse.json(
        {
          ...result.payload,
          message: result.payload.message.includes("joignable")
            ? "Le service de fichiers est indisponible. Le nom n'a pas été modifié."
            : result.payload.message,
        },
        { status: result.payload.status }
      );
    }
    return NextResponse.json(result.data);
  } catch (error) {
    logError("Erreur API Library PATCH", error);
    return errorResponse("internal_error", {
      message: "Impossible de renommer le fichier.",
    });
  }
}

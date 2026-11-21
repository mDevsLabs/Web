import { type NextRequest, NextResponse } from "next/server";
import { errorResponse, logError } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { getMaiSessionToken } from "@/lib/auth/session";
import {
  deleteImageGeneration,
  getImageGenerations,
  updateImageGeneration,
} from "@/lib/db/queries/generations";
import { formatImageSrc } from "@/lib/utils";

// `page` et `limit` partaient tels quels dans la requête amont, sans être
// contraints à l'entier : une valeur non numérique était transmise telle quelle.
function readPositiveInt(
  raw: string | null,
  fallback: number,
  max: number
): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(parsed), 1), max);
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const auth = await requireUser(token);
  if (!auth) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }
  const { userId } = auth;

  const { searchParams } = req.nextUrl;
  const page = readPositiveInt(searchParams.get("page"), 1, 10_000);
  const limit = readPositiveInt(searchParams.get("limit"), 20, 100);

  try {
    const { items: rawItems, total } = await getImageGenerations({
      limit,
      page,
      userId,
    });

    const items = rawItems.map((item: any) => ({
      ...item,
      image_url: formatImageSrc(item.image_url),
    }));

    return NextResponse.json({
      data: items,
      images: items,
      success: true,
      total,
    });
  } catch (error) {
    logError("Erreur API images/history", error);
    return errorResponse("internal_error", {
      message: "Erreur lors du chargement de l'historique.",
    });
  }
}

export async function DELETE(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const auth = await requireUser(token);
  if (!auth) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }
  const { userId } = auth;

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  const purgeAll = searchParams.get("all") === "1";

  if (!id && !purgeAll) {
    return errorResponse("invalid_request", {
      message: "L'identifiant de l'image est requis.",
    });
  }

  if (id && !UUID_PATTERN.test(id)) {
    return errorResponse("invalid_request", {
      message: "L'identifiant de l'image est invalide.",
    });
  }

  try {
    const res = await deleteImageGeneration({
      id,
      purgeAll,
      userId,
    });

    return NextResponse.json({ success: res.success });
  } catch (error) {
    logError("Erreur suppression image", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de la suppression de l'image.",
    });
  }
}

export async function PATCH(req: NextRequest) {
  const token = await getMaiSessionToken();
  if (!token) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }

  const auth = await requireUser(token);
  if (!auth) {
    return errorResponse("auth_required", { message: "Non authentifié." });
  }
  const { userId } = auth;

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const targetId = (id || body.id) as string;

  if (!targetId) {
    return errorResponse("invalid_request", {
      message: "L'identifiant de l'image est requis.",
    });
  }

  if (typeof targetId !== "string" || !UUID_PATTERN.test(targetId)) {
    return errorResponse("invalid_request", {
      message: "L'identifiant de l'image est invalide.",
    });
  }

  try {
    const updated = await updateImageGeneration({
      id: targetId,
      pinned: typeof body.pinned === "boolean" ? body.pinned : undefined,
      title: typeof body.title === "string" ? body.title : undefined,
      userId,
    });

    if (!updated) {
      return errorResponse("not_found", {
        message: "Image introuvable.",
      });
    }

    return NextResponse.json({ image: updated, success: true });
  } catch (error) {
    logError("Erreur mise à jour image", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de la mise à jour de l'image.",
    });
  }
}

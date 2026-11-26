import { type NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { getMaiSessionToken } from "@/lib/auth/session";
import {
  deleteSpeechGeneration,
  getSpeechGenerations,
} from "@/lib/db/queries/generations";

// `mprojects_speech_generations.id` est un entier auto-incrémenté en base Neon
// (serial), ou un UUID selon les environnements : les deux formats sont admis.
const AUDIO_ID_PATTERN =
  /^(?:\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

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
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;

  try {
    const { items, total } = await getSpeechGenerations({
      limit,
      page,
      userId,
    });

    return NextResponse.json({
      audios: items,
      data: items,
      success: true,
      total,
    });
  } catch {
    return NextResponse.json({
      audios: [],
      data: [],
      success: true,
      total: 0,
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
      message: "L'identifiant de l'audio est requis.",
    });
  }

  if (id && !AUDIO_ID_PATTERN.test(id)) {
    return errorResponse("invalid_request", {
      message: "L'identifiant de l'audio est invalide.",
    });
  }

  try {
    const res = await deleteSpeechGeneration({
      id,
      purgeAll,
      userId,
    });

    return NextResponse.json({ success: res.success });
  } catch {
    return errorResponse("internal_error", {
      message: "Erreur lors de la suppression de l'audio.",
    });
  }
}

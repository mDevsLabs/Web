import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { errorResponse } from "@/lib/api/error-response";
import {
  ATTACHMENT_URL_TTL_MS,
  signBlobPathForUser,
} from "@/lib/files/blob-access";
import { isBlobPathnameOwnedBy } from "@/lib/files/blob-path";

const querySchema = z.object({
  pathname: z.string().min(1).max(1024),
});

/**
 * GET /api/files/url?pathname=uploads/<userId>/…
 *
 * Renouvelle l'URL signée d'une pièce jointe ancienne. Le contrôle de
 * propriété est fait par préfixe de compte ; un chemin étranger répond 404,
 * jamais 403, pour ne pas confirmer qu'il existe.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return errorResponse("auth_required");
  }
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    pathname: searchParams.get("pathname") ?? "",
  });
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Paramètre pathname manquant ou invalide.",
    });
  }
  const userId = session.user.id;
  if (!isBlobPathnameOwnedBy(parsed.data.pathname, userId)) {
    return errorResponse("not_found", {
      message: "Fichier introuvable.",
    });
  }
  const url = await signBlobPathForUser(parsed.data.pathname, userId);
  if (!url) {
    return errorResponse("service_unavailable", {
      message: "Impossible de renouveler le lien du fichier.",
    });
  }
  return NextResponse.json({
    expiresAt: Date.now() + ATTACHMENT_URL_TTL_MS,
    url,
  });
}

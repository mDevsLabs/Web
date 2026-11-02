import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { origineConfiance } from "@/lib/quizzly/http";
import { crediterUtilisateurQuizzly } from "@/lib/quizzly/queries";

const corpsSchema = z
  .object({
    gems: z.number().int().min(0).max(100_000).optional().default(0),
    target: z.string().min(1).max(64),
    xp: z.number().int().min(0).max(100_000).optional().default(0),
  })
  .strict()
  .refine((data) => data.gems > 0 || data.xp > 0, {
    message: "Indiquez un montant supérieur à 0 pour les gemmes ou l'XP.",
  });

export async function POST(request: Request) {
  if (!origineConfiance(request)) {
    return errorResponse("access_denied", {
      message: "Origine de la requête non autorisée.",
    });
  }
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }

  const body = await request.json().catch(() => null);
  const parsed = corpsSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }

  try {
    const res = await crediterUtilisateurQuizzly(parsed.data.target, {
      gems: parsed.data.gems,
      xp: parsed.data.xp,
    });
    if (!res.ok) {
      return errorResponse("invalid_request", { message: res.message });
    }
    return Response.json(res, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("POST /api/quizzly/admin/credit", error);
    return errorResponse("database_error");
  }
}

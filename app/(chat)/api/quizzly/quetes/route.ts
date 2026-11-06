import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { origineConfiance } from "@/lib/quizzly/http";
import { listerQuetes, reclamerQuete } from "@/lib/quizzly/queries";

const corpsSchema = z
  .object({
    questKey: z.string().min(1).max(80),
  })
  .strict();

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  try {
    const quests = await listerQuetes(session.userId);
    return Response.json(
      { quests },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("GET /api/quizzly/quetes", error);
    return errorResponse("database_error");
  }
}

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
    const reclamation = await reclamerQuete(
      session.userId,
      parsed.data.questKey
    );
    if (!reclamation.ok) {
      return errorResponse("invalid_request", { message: reclamation.message });
    }
    return Response.json(reclamation, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("POST /api/quizzly/quetes", error);
    return errorResponse("database_error");
  }
}

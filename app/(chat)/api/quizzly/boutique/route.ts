import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { origineConfiance } from "@/lib/quizzly/http";
import {
  acheterArticle,
  listerArticlesPersonnalises,
  resumeQuizzly,
} from "@/lib/quizzly/queries";
import { listerArticlesBoutique } from "@/lib/quizzly/shop";

const corpsSchema = z
  .object({
    itemId: z.string().min(1).max(40),
  })
  .strict();

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  try {
    const resume = await resumeQuizzly(session.userId, session.user);
    return Response.json(
      {
        dailyGiftClaimed: resume.dailyGiftClaimed,
        gems: resume.gems,
        giftsReceived: resume.giftsReceived || [],
        hearts: resume.hearts,
        items: listerArticlesBoutique(await listerArticlesPersonnalises()),
        leagueShieldWeek: resume.leagueShieldWeek,
        ownedFrames: resume.ownedFrames,
        streakFreezes: resume.streakFreezes,
        weekKey: resume.weekKey,
        xpBoostUntil: resume.xpBoostUntil,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("GET /api/quizzly/boutique", error);
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
    const achat = await acheterArticle(session.userId, parsed.data.itemId);
    if (!achat.ok) {
      return errorResponse("invalid_request", { message: achat.message });
    }
    return Response.json(achat, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("POST /api/quizzly/boutique", error);
    return errorResponse("database_error");
  }
}

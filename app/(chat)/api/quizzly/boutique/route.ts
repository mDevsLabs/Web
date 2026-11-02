import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { origineConfiance } from "@/lib/quizzly/http";
import {
  acheterArticle,
  ajouterArticleBoutique,
  resumeQuizzly,
} from "@/lib/quizzly/queries";
import { listerArticlesBoutique, type ShopKind } from "@/lib/quizzly/shop";

const corpsAchatSchema = z
  .object({
    action: z.literal("buy").optional(),
    itemId: z.string().min(1).max(40),
  })
  .strict();

const corpsAjoutSchema = z
  .object({
    action: z.literal("add-item"),
    description: z.string().min(3).max(300),
    id: z.string().min(2).max(40).optional(),
    kind: z.enum(["boost", "daily", "frame", "freeze", "hearts", "shield"]),
    label: z.string().min(2).max(60),
    price: z.number().int().min(0).max(50_000),
  })
  .strict();

const corpsSchema = z.union([corpsAchatSchema, corpsAjoutSchema]);

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
        items: listerArticlesBoutique(),
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
    if ("action" in parsed.data && parsed.data.action === "add-item") {
      const res = await ajouterArticleBoutique({
        description: parsed.data.description,
        id: parsed.data.id,
        kind: parsed.data.kind as ShopKind,
        label: parsed.data.label,
        price: parsed.data.price,
      });
      return Response.json(res, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const itemId = "itemId" in parsed.data ? parsed.data.itemId : "";
    const achat = await acheterArticle(session.userId, itemId);
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

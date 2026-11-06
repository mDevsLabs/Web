import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { origineConfiance } from "@/lib/quizzly/http";
import {
  envoyerCadeauQuizzly,
  reclamerCadeauQuizzly,
  resumeQuizzly,
} from "@/lib/quizzly/queries";

const corpsEnvoiSchema = z
  .object({
    action: z.literal("send").default("send"),
    gems: z.number().int().min(1).max(10_000).optional(),
    itemId: z.string().min(1).max(40).optional(),
    message: z.string().max(200).optional(),
    recipientUsername: z.string().min(2).max(40),
  })
  .strict();

const corpsReclamationSchema = z
  .object({
    action: z.literal("claim"),
    giftId: z.string().min(1).max(100),
  })
  .strict();

const corpsSchema = z.union([corpsEnvoiSchema, corpsReclamationSchema]);

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  try {
    const resume = await resumeQuizzly(session.userId, session.user);
    return Response.json(
      {
        giftsReceived: resume.giftsReceived || [],
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("GET /api/quizzly/cadeaux", error);
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
    if (parsed.data.action === "claim") {
      const res = await reclamerCadeauQuizzly(
        session.userId,
        parsed.data.giftId
      );
      if (!res.ok) {
        return errorResponse("invalid_request", { message: res.message });
      }
      return Response.json(res, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const res = await envoyerCadeauQuizzly(session.userId, {
      gems: parsed.data.gems,
      itemId: parsed.data.itemId,
      message: parsed.data.message,
      recipientUsername: parsed.data.recipientUsername,
    });
    if (!res.ok) {
      return errorResponse("invalid_request", { message: res.message });
    }
    return Response.json(res, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("POST /api/quizzly/cadeaux", error);
    return errorResponse("database_error");
  }
}

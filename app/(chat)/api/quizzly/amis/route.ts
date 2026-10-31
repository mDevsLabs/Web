import QRCode from "qrcode";
import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { lireNomAffiche } from "@/lib/quizzly/display-name";
import {
  demanderAmi,
  listerAmis,
  repondreAmi,
  retirerAmi,
} from "@/lib/quizzly/friend-store";
import { origineConfiance } from "@/lib/quizzly/http";

const corpsSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("request"),
      username: z.string().min(1).max(40),
    })
    .strict(),
  z
    .object({
      action: z.enum(["accept", "decline", "remove"]),
      friendshipId: z.string().uuid(),
    })
    .strict(),
]);

export async function GET(request: Request) {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  try {
    const [liste, nom] = await Promise.all([
      listerAmis(session.userId),
      lireNomAffiche(session.user),
    ]);
    const origine = new URL(request.url).origin;
    const inviteUrl = nom.username
      ? `${origine}/quizzly/amis?u=${encodeURIComponent(nom.username)}`
      : `${origine}/quizzly/amis`;
    const qrDataUrl = nom.username
      ? await QRCode.toDataURL(inviteUrl, { margin: 1, width: 280 })
      : null;
    return Response.json(
      { ...liste, inviteUrl, qrDataUrl },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("GET /api/quizzly/amis", error);
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
    const resultat =
      parsed.data.action === "request"
        ? await demanderAmi(session.userId, parsed.data.username)
        : parsed.data.action === "remove"
          ? await retirerAmi(session.userId, parsed.data.friendshipId)
          : await repondreAmi(
              session.userId,
              parsed.data.friendshipId,
              parsed.data.action === "accept"
            );
    if (!resultat.ok) {
      return errorResponse("invalid_request", { message: resultat.message });
    }
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("POST /api/quizzly/amis", error);
    return errorResponse("database_error");
  }
}

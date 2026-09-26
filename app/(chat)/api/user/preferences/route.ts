import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { getUserPreferences, upsertUserPreferences } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import {
  buildCustomInstructionsSchema,
  customInstructionsLimitPayload,
} from "@/lib/plans/custom-instructions";

// La limite de customInstructions dépend du forfait : le schéma est donc
// construit par requête. Avant, `z.string().max(4000)` était figé ici comme
// dans 6 autres routes — un compte Pro ou Max ne pouvait pas dépasser 4000
// caractères, alors que le produit l'annonçait sans limite.
const buildSchema = (tier?: string | null) =>
  z.object({
    customInstructions: buildCustomInstructionsSchema(tier),
    defaultAgentId: z.string().uuid().nullable().optional(),
    defaultAudioModel: z.string().max(150).optional(),
    defaultAudioSpeed: z.number().min(0.5).max(2.0).optional(),
    defaultAudioVoice: z.string().max(100).optional(),
    defaultChatModel: z.string().max(200).nullable().optional(),
    defaultChatVisibility: z.enum(["private", "public"]).optional(),
    defaultImageModel: z.string().max(150).optional(),
    defaultImageSize: z.string().max(50).optional(),
    enabled: z.boolean().optional(),
    ghostMemoryEnabled: z.boolean().optional(),
    showAgentChatIcons: z.boolean().optional(),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
  });

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id;
  if (!userId) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  try {
    const prefs = await getUserPreferences(userId);
    return NextResponse.json(prefs);
  } catch (e) {
    console.error("GET user preferences error", e);
    return NextResponse.json({
      customInstructions: "",
      defaultAgentId: null,
      defaultAudioModel: "deepgram/flux-tts:free",
      defaultAudioSpeed: 1.0,
      defaultAudioVoice: "flux-alexis-en",
      defaultChatModel: null,
      defaultChatVisibility: "private",
      defaultImageModel: "black-forest-labs/flux-schnell",
      defaultImageSize: "1024x1024",
      enabled: false,
      ghostMemoryEnabled: false,
      showAgentChatIcons: true,
      temperature: 0.7,
      topP: 0.9,
    });
  }
}

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id;
  if (!userId) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = buildSchema(user.tier).safeParse(body);
    if (!parsed.success) {
      // Un dépassement de longueur mérite un message de forfait, pas une
      // liste de champs invalides : on le distingue avant le repli Zod.
      const raw = (body as { customInstructions?: unknown }).customInstructions;
      if (typeof raw === "string") {
        const payload = customInstructionsLimitPayload(user.tier, raw.length);
        if (payload) {
          return errorResponse("invalid_request", payload);
        }
      }
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(parsed.error),
      });
    }

    const updated = await upsertUserPreferences(userId, parsed.data);
    return NextResponse.json({ preferences: updated, success: true });
  } catch (e) {
    console.error("POST user preferences error", e);
    return new ChatbotError("bad_request:database").toResponse();
  }
}

export async function PATCH(request: Request) {
  return POST(request);
}

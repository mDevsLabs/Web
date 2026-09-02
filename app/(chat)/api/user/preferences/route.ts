import { NextResponse } from "next/server";
import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import {
  getUserPreferences,
  upsertUserPreferences,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const schema = z.object({
  customInstructions: z.string().max(4000).optional(),
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
  const userId = user.id || user.email;
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
  const userId = user.id || user.email;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const updated = await upsertUserPreferences(userId, parsed.data);
    return NextResponse.json({ success: true, preferences: updated });
  } catch (e) {
    console.error("POST user preferences error", e);
    return new ChatbotError("bad_request:database").toResponse();
  }
}

export async function PATCH(request: Request) {
  return POST(request);
}

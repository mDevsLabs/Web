import { NextResponse } from "next/server";
import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import {
  getUserNotificationPrefs,
  upsertUserNotificationPrefs,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const prefsSchema = z.object({
  aiResponse: z.boolean().optional(),
  enabled: z.boolean().optional(),
  mcpAccessRequest: z.boolean().optional(),
  mcpCreated: z.boolean().optional(),
  news: z.boolean().optional(),
  projectCreated: z.boolean().optional(),
  regenerateMode: z.enum(["truncate", "fork"]).optional(),
});

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const prefs = await getUserNotificationPrefs(userId);
  return NextResponse.json(prefs);
}

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const body = await request.json().catch(() => ({}));
  const parsed = prefsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const updated = await upsertUserNotificationPrefs(userId, parsed.data);
  return NextResponse.json(updated);
}

export async function PATCH(request: Request) {
  return POST(request);
}

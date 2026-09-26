import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import {
  getUserNotificationPrefs,
  upsertUserNotificationPrefs,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

// Les 6 préférences `agent*` existent en base (migrations 0017) et étaient
// lisibles via GET, mais ce schéma ne les exposait pas : impossible de les
// désactiver depuis l'interface, et `createNotification` venait de les câbler
// (voir lib/db/queries.ts). Elles sont donc désormais acceptées ici.
//
// `agentEmailEnabled` / `agentPushEnabled` restent volontairement hors
// schéma : aucun transport email/push n'existe (les ports sont de simples
// journalisations console dans lib/agent/notifications/service.ts). Les
// exposer laisserait croire à un réglage qui ne fait rien.
const prefsSchema = z.object({
  agentApprovalRequired: z.boolean().optional(),
  agentRunFailed: z.boolean().optional(),
  agentRunFinished: z.boolean().optional(),
  agentUserInputRequired: z.boolean().optional(),
  aiResponse: z.boolean().optional(),
  enabled: z.boolean().optional(),
  mcpAccessRequest: z.boolean().optional(),
  mcpCreated: z.boolean().optional(),
  news: z.boolean().optional(),
  planningTaskCompleted: z.boolean().optional(),
  projectCreated: z.boolean().optional(),
  quotaWarning: z.boolean().optional(),
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
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  const updated = await upsertUserNotificationPrefs(userId, parsed.data);
  return NextResponse.json(updated);
}

export async function PATCH(request: Request) {
  return POST(request);
}

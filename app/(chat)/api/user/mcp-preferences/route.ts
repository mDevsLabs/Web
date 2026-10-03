import { z } from "zod";
import {
  errorResponse,
  logError,
  zodIssuesMessage,
} from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { getUserMcpPrefs, upsertUserMcpPrefs } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const schema = z.object({
  allowStdio: z.boolean().optional(),
  defaultRateLimitPerMin: z.number().int().min(1).max(1000).optional(),
  defaultRequireApproval: z
    .enum(["always_allow", "write_only", "ask_permission"])
    .optional(),
  defaultTimeoutMs: z.number().int().min(1000).max(120_000).optional(),
  globalKillSwitch: z.boolean().optional(),
  retentionDays: z.number().int().min(1).max(50).optional(),
});

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const prefs = await getUserMcpPrefs(session.userId);
  return Response.json(prefs);
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  try {
    const json = await request.json();
    const parsed = schema.parse(json);
    const updated = await upsertUserMcpPrefs(session.userId, parsed);
    return Response.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(err),
      });
    }
    logError("Erreur sauvegarde préférences MCP", err);
    return errorResponse("internal_error", {
      message: "Erreur lors de l'enregistrement des préférences MCP.",
    });
  }
}

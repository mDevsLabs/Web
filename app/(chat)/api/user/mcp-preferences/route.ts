import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
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
  retentionDays: z.number().int().min(1).max(365).optional(),
});

export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const prefs = await getUserMcpPrefs(userId);
  return Response.json(prefs);
}

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  try {
    const json = await request.json();
    const parsed = schema.parse(json);
    const updated = await upsertUserMcpPrefs(userId, parsed);
    return Response.json(updated);
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? "Données invalides" },
      { status: 400 }
    );
  }
}

import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import { purgeMcpLogs } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) return new ChatbotError("unauthorized:chat").toResponse();
  const userId = user.id || user.email;
  const json = await request.json().catch(() => ({}));
  const days = Number(json.retentionDays ?? json.olderThanDays ?? 30);
  const safe = Math.min(Math.max(days, 1), 365);
  const res = await purgeMcpLogs({ olderThanDays: safe, userId });
  return Response.json({ deleted: res.deleted, retentionDays: safe });
}

import { NextResponse } from "next/server";
import { getDueScheduledMessages } from "@/lib/db/queries";
import { executeScheduledMessage } from "@/lib/planning/executor";

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Si CRON_SECRET est configuré, on le vérifie
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dueItems = await getDueScheduledMessages();
  const results = [];

  for (const item of dueItems) {
    try {
      const res = await executeScheduledMessage(item.id);
      results.push({ id: item.id, ...res });
    } catch (err: any) {
      results.push({
        error: err?.message || String(err),
        id: item.id,
        status: "failed",
      });
    }
  }

  return NextResponse.json({
    executedCount: results.length,
    results,
    timestamp: new Date().toISOString(),
  });
}
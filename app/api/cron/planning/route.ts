import { NextResponse } from "next/server";
import { getMaiUser } from "@/lib/auth/session";
import { getDueScheduledMessages } from "@/lib/db/queries";
import { executeScheduledMessage } from "@/lib/planning/executor";

export const maxDuration = 300;

async function isAuthorized(request: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");

  const url = new URL(request.url);
  const paramSecret =
    url.searchParams.get("secret") || url.searchParams.get("key");

  // 1. Vérification par CRON_SECRET (Bearer token, header ou query param)
  if (cronSecret) {
    if (authHeader === `Bearer ${cronSecret}`) return true;
    if (headerSecret === cronSecret) return true;
    if (paramSecret === cronSecret) return true;
  }

  // 2. Si appelé par un utilisateur connecté dans l'application
  try {
    const user = await getMaiUser();
    if (user) return true;
  } catch {
    // Ignorer l'erreur et continuer
  }

  // 3. En mode développement, tolérer l'absence de CRON_SECRET
  if (!cronSecret && process.env.NODE_ENV !== "production") {
    console.warn(
      "[cron/planning] CRON_SECRET manquant — endpoint non protégé (dev uniquement)"
    );
    return true;
  }

  return false;
}

async function handleCronExecution(request: Request) {
  const authorized = await isAuthorized(request);

  if (!authorized) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "CRON_SECRET non configuré et utilisateur non authentifié" },
        { status: 503 }
      );
    }
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

export async function GET(request: Request) {
  return handleCronExecution(request);
}

export async function POST(request: Request) {
  return handleCronExecution(request);
}
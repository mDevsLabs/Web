import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ensureAgentNotificationsInstalled } from "@/lib/agent/notifications/install";
import { runSchedulerTick } from "@/lib/agent/scheduler/engine";
import { errorResponse } from "@/lib/api/error-response";
import { verifyCronAuth } from "@/lib/security/timing";

export const maxDuration = 300;

// Tick du scheduler Agent : déclenché périodiquement (cron Vercel ou tout
// planificateur externe). Authentifié par CRON_SECRET via header uniquement
// (jamais en query : logs/proxy/history) ; fail-closed en production.
// Idempotent : deux ticks concurrents ne créent jamais deux runs pour la
// même occurrence (réservation atomique par lease).
async function isAuthorized(request: Request): Promise<boolean> {
  if (process.env.CRON_SECRET) {
    return verifyCronAuth(request);
  }

  if (process.env.NODE_ENV === "production") {
    console.error("[cron/agent] CRON_SECRET manquant en production — refusé");
    return false;
  }

  console.warn(
    "[cron/agent] CRON_SECRET manquant — endpoint non protégé (dev uniquement)"
  );
  return true;
}

async function handleTick(request: Request) {
  if (!(await isAuthorized(request))) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  try {
    ensureAgentNotificationsInstalled();
    const result = await runSchedulerTick({
      now: new Date(),
      workerId: `cron-${randomUUID().slice(0, 8)}`,
    });
    return NextResponse.json({
      processed: result.processed,
      results: result.results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/agent] Échec du tick :", error);
    return errorResponse("internal_error", {
      message: "Le tick du planificateur Agent a échoué.",
    });
  }
}

export async function GET(request: Request) {
  return handleTick(request);
}

export async function POST(request: Request) {
  return handleTick(request);
}

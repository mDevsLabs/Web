import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
import { claimCronTicks, runClaimedCronTicks } from "@/lib/cron/lazy";
import { CRON_TICKS } from "@/lib/cron/ticks";
import { verifyCronAuth } from "@/lib/security/timing";

export const maxDuration = 300;

/**
 * GET /api/cron/daily — filet de sécurité quotidien (cron natif Vercel).
 *
 * Le plan Hobby n'autorise qu'un cron par jour : cette route ne remplace pas
 * la cadence fine (GitHub Actions `cron-master`, ticks paresseux Neon). Elle
 * garantit seulement que chaque tick tourne au moins une fois par jour, même
 * si ni l'un ni l'autre n'a fonctionné.
 *
 * Les six ticks passent par le MÊME bail atomique (`cron_ticks`) que le
 * runner paresseux : un tick déjà porté par une autre instance est ignoré,
 * jamais exécuté en double.
 *
 * AUTHENTIFICATION : Vercel envoie `Authorization: Bearer <CRON_SECRET>` ;
 * en-tête uniquement (jamais en query), fail-closed en production.
 */
async function isAuthorized(request: Request): Promise<boolean> {
  if (process.env.CRON_SECRET) {
    return verifyCronAuth(request);
  }
  if (process.env.NODE_ENV === "production") {
    console.error("[cron/daily] CRON_SECRET manquant en production — refusé");
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  try {
    const claimed = await claimCronTicks(CRON_TICKS, { force: true });
    const outcomes = await runClaimedCronTicks(claimed);
    const ignores = CRON_TICKS.filter(
      (tick) => !claimed.some((c) => c.name === tick.name)
    ).map((tick) => tick.name);
    const echecs = outcomes.filter((outcome) => !outcome.ok);

    return NextResponse.json(
      {
        echecs: echecs.length,
        // Ticks déjà portés par une autre instance (bail valide) : non rejoués.
        ignores,
        ok: echecs.length === 0,
        ticks: outcomes.map(({ durationMs, name, ok, status }) => ({
          durationMs,
          name,
          ok,
          status,
        })),
        timestamp: new Date().toISOString(),
      },
      // Un statut non 2xx rend l'échec visible dans les logs de cron Vercel.
      { status: echecs.length === 0 ? 200 : 500 }
    );
  } catch (error) {
    console.error("[cron/daily] Échec :", error);
    return errorResponse("internal_error", {
      message: "Le tick quotidien a échoué.",
    });
  }
}

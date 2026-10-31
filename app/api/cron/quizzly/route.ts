import { errorResponse } from "@/lib/api/error-response";
import { cloreLiguesEchues } from "@/lib/quizzly/league-store";
import { timingSafeCompare } from "@/lib/security/timing";

export const maxDuration = 60;

async function isAuthorized(request: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const enTete = request.headers.get("authorization");
    const secret = request.headers.get("x-cron-secret");
    return (
      timingSafeCompare(enTete, `Bearer ${cronSecret}`) ||
      timingSafeCompare(secret, cronSecret)
    );
  }
  if (process.env.NODE_ENV === "production") {
    console.error("[cron/quizzly] CRON_SECRET manquant en production — refusé");
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }
  try {
    const closed = await cloreLiguesEchues();
    return Response.json({ closed, ok: true });
  } catch (error) {
    console.error("POST /api/cron/quizzly", error);
    return errorResponse("database_error");
  }
}

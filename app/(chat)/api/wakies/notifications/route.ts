/** Les réponses persistées alimentent une relève bornée, isolée par compte. */
import { createHash } from "node:crypto";
import { z } from "zod";
import {
  badRequest,
  isResponse,
  json,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { releverNotifications } from "@/lib/wakies/queries";

export async function GET(request: Request) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) return identite;
  const valeur = new URL(request.url).searchParams.get("after");
  const parsed = z.coerce
    .number()
    .int()
    .min(0)
    .max(Number.MAX_SAFE_INTEGER)
    .safeParse(valeur);
  if (valeur !== null && (!/^\d+$/.test(valeur) || !parsed.success))
    return badRequest("Curseur de notification invalide.");
  const result = await releverNotifications(
    identite.userId,
    valeur === null ? undefined : parsed.success ? parsed.data : undefined
  );
  return json(
    {
      ...result,
      scope: createHash("sha256").update(identite.userId).digest("hex"),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
